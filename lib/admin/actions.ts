"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { fieldErrors } from "@/lib/auth/schemas";
import { requireAdmin } from "@/lib/auth/session";
import { cepSchema } from "@/lib/br/cep";
import { createAdminClient } from "@/lib/db/admin";
import { publicEnv } from "@/lib/env-public";
import { echoValues, type FormState } from "@/lib/forms/state";
import { kickJobs } from "@/lib/jobs/run";

import { parseProductForm } from "./product-schema";
import { PHOTO_BUCKET, photoPathFromUrl } from "./storage-url";

// Every admin action checks the role on the server again (the /admin
// layout check alone is not enough: actions can be called directly) and
// writes with the service role.

export type ActionResult = { ok: boolean; message?: string };

const BUCKET = PHOTO_BUCKET;
const ourStoragePath = (url: string) =>
  photoPathFromUrl(url, publicEnv.NEXT_PUBLIC_SUPABASE_URL);
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const GENERIC: FormState = {
  ok: false,
  message: "Não deu certo agora. Tente de novo em instantes.",
};

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

const uploadSchema = z.object({
  name: z.string().max(200),
  type: z.string(),
  size: z.number().int().positive(),
});

/** Signed upload URL (a few minutes, one file) for the browser to PUT to. */
export async function requestImageUpload(file: {
  name: string;
  type: string;
  size: number;
}): Promise<
  | { ok: true; path: string; signedUrl: string; publicUrl: string }
  | { ok: false; message: string }
> {
  await requireAdmin();
  const parsed = uploadSchema.safeParse(file);
  const ext = parsed.success ? TYPES[parsed.data.type] : undefined;
  if (!parsed.success || !ext) {
    return { ok: false, message: "Use fotos JPG, PNG ou WEBP." };
  }
  if (parsed.data.size > MAX_BYTES) {
    return { ok: false, message: "A foto pode ter no máximo 5 MB." };
  }

  const path = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
  const storage = createAdminClient().storage.from(BUCKET);
  const { data, error } = await storage.createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false, message: "Não foi possível enviar a foto agora." };
  }
  return {
    ok: true,
    path,
    signedUrl: data.signedUrl,
    publicUrl: storage.getPublicUrl(path).data.publicUrl,
  };
}

/**
 * Only photos uploaded to OUR bucket are accepted: next/image refuses other
 * hosts (the page would break) and a foreign URL could track visitors.
 */
const ourImageUrl = z.url().refine((u) => ourStoragePath(u) !== null, {
  error: "Envie a foto pelo botão de fotos.",
});

async function removeFiles(urls: string[]) {
  const paths = urls.flatMap((u) => {
    const p = ourStoragePath(u);
    return p ? [p] : [];
  });
  if (paths.length > 0) {
    await createAdminClient().storage.from(BUCKET).remove(paths);
  }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const imagesSchema = z
  .array(
    z.object({
      id: z.uuid().optional(),
      url: ourImageUrl,
      path: z.string().optional(),
      alt: z.string().max(200).default(""),
    }),
  )
  .max(8);

/** Errors keyed by the full path ("variantes.0.preco") for the variant editor. */
function fullPathErrors(error: z.ZodError): Partial<Record<string, string[]>> {
  const out: Partial<Record<string, string[]>> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

const dbErrors: Record<string, string> = {
  products_slug_key: "Já existe um produto com esse endereço (slug).",
  product_variants_sku_key: "Esse SKU já está em uso em outro produto.",
};

export async function saveProduct(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Confira os campos marcados.",
      fieldErrors: fullPathErrors(parsed.error),
      values: echoValues(formData),
    };
  }

  let imagens: z.infer<typeof imagesSchema>;
  try {
    imagens = imagesSchema.parse(
      JSON.parse(String(formData.get("imagens") ?? "[]")),
    );
  } catch {
    return {
      ok: false,
      message: "Fotos inválidas. Recarregue a página.",
      values: echoValues(formData),
    };
  }

  const { data, error } = await createAdminClient().rpc("admin_save_product", {
    p_product: { ...parsed.data, imagens },
  });
  if (error || !data) {
    const known = Object.entries(dbErrors).find(([k]) =>
      error?.message.includes(k),
    );
    return {
      ...(known ? { ok: false, message: known[1] } : GENERIC),
      values: echoValues(formData),
    };
  }

  const result = data as { id: string; removed_urls: string[] };
  await removeFiles(result.removed_urls ?? []);

  revalidatePath("/admin/produtos");
  revalidatePath("/", "layout");
  redirect(`/admin/produtos/${result.id}?salvo=1`);
}

const toggleSchema = z.object({
  id: z.uuid(),
  campo: z.enum(["ativo", "destaque"]),
  valor: z.enum(["true", "false"]),
});

export async function toggleProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = toggleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { id, campo, valor } = parsed.data;
  await createAdminClient()
    .from("products")
    .update(
      campo === "ativo"
        ? { ativo: valor === "true" }
        : { destaque: valor === "true" },
    )
    .eq("id", id);
  revalidatePath("/admin/produtos");
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  id: z
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  nome: z.string().trim().min(2, { error: "Informe o nome." }).max(60),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: "Use só letras minúsculas, números e hífen, ex.: casa-e-cozinha",
    }),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { error: "Cor no formato #RRGGBB." }),
  ordem: z.coerce.number().int().min(0).max(999),
  ativa: z.preprocess((v) => v === "on", z.boolean()),
});

export async function saveCategory(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: echoValues(formData),
    };
  }
  const { id, ...row } = parsed.data;
  const admin = createAdminClient();
  const { error } = id
    ? await admin.from("categories").update(row).eq("id", id)
    : await admin.from("categories").insert(row);
  if (error) {
    return {
      ok: false,
      message: error.message.includes("categories_slug_key")
        ? "Já existe uma categoria com esse endereço."
        : GENERIC.message,
      values: echoValues(formData),
    };
  }
  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
  return { ok: true, message: "Categoria salva." };
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

const bannerSchema = z.object({
  id: z
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  titulo: z.string().trim().max(120).default(""),
  imagemUrl: ourImageUrl,
  link: z
    .string()
    .trim()
    .max(300)
    // "//site.com" and "/\site.com" would leave the store.
    .refine((v) => v === "" || /^\/(?![/\\])/.test(v), {
      error: "Use um endereço da loja, começando com /, ex.: /c/eletronicos",
    })
    .transform((v) => (v === "" ? null : v)),
  ordem: z.coerce.number().int().min(0).max(999),
  ativo: z.preprocess((v) => v === "on", z.boolean()),
});

export async function saveBanner(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = bannerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: echoValues(formData),
    };
  }
  const { id, imagemUrl, ...rest } = parsed.data;
  // The path to delete later comes from the checked URL, never the form.
  const row = {
    ...rest,
    imagem_url: imagemUrl,
    imagem_path: ourStoragePath(imagemUrl)!,
  };
  const admin = createAdminClient();
  const { error } = id
    ? await admin.from("banners").update(row).eq("id", id)
    : await admin.from("banners").insert(row);
  if (error) return { ...GENERIC, values: echoValues(formData) };
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true, message: "Banner salvo." };
}

export async function deleteBanner(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Banner inválido." };
  const admin = createAdminClient();
  const { data } = await admin
    .from("banners")
    .delete()
    .eq("id", id.data)
    .select("imagem_url")
    .maybeSingle();
  if (data) await removeFiles([data.imagem_url]);
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

const settingsSchema = z.object({
  razao_social: optionalText(160),
  documento: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || v.length === 14, {
      error: "CNPJ tem 14 dígitos. Vendendo no CPF, deixe em branco.",
    })
    .transform((v) => (v === "" ? null : v)),
  ie: optionalText(30),
  regime_tributario: optionalText(60),
  printer_id: optionalText(40),
  cep: cepSchema,
  rua: z.string().trim().min(1, { error: "Informe a rua." }).max(160),
  numero: z.string().trim().min(1, { error: "Informe o número." }).max(20),
  complemento: optionalText(80),
  bairro: z.string().trim().min(1, { error: "Informe o bairro." }).max(80),
  cidade: z.string().trim().min(1, { error: "Informe a cidade." }).max(80),
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, { error: "UF com 2 letras." }),
});

export async function saveSettings(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: echoValues(formData),
    };
  }
  const d = parsed.data;
  const { error } = await createAdminClient()
    .from("settings")
    .update({
      razao_social: d.razao_social,
      cnpj: d.documento,
      ie: d.ie,
      regime_tributario: d.regime_tributario,
      printer_id: d.printer_id,
      // Origin of every shipment: quotes and labels read this.
      endereco_origem: {
        cep: d.cep,
        rua: d.rua,
        numero: d.numero,
        complemento: d.complemento,
        bairro: d.bairro,
        cidade: d.cidade,
        uf: d.uf,
      },
    })
    .eq("id", true);
  if (error) return { ...GENERIC, values: echoValues(formData) };
  revalidatePath("/admin/configuracoes");
  return { ok: true, message: "Configurações salvas." };
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const orderActionSchema = z.object({
  orderId: z.uuid(),
  motivo: z.string().trim().max(200).optional(),
});

/** After any change to an order: fresh admin pages, and the queue runs now. */
function revalidateOrder() {
  revalidatePath("/admin/pedidos", "layout");
  revalidatePath("/admin");
  kickJobs();
}

/** Cancels an unpaid order; set_order_status gives the stock back. */
export async function cancelOrder(formData: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = orderActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Pedido inválido." };
  const { error } = await createAdminClient().rpc("set_order_status", {
    p_order_id: parsed.data.orderId,
    p_status: "canceled",
    p_detalhe: {
      origem: "admin",
      admin: user.email,
      motivo: parsed.data.motivo ?? null,
    },
  });
  if (error) {
    return {
      ok: false,
      message:
        error.message === "invalid_transition"
          ? "Só dá para cancelar pedidos que ainda não foram pagos. Pedido pago se estorna."
          : GENERIC.message,
    };
  }
  revalidateOrder();
  return { ok: true };
}

/** Invoice issued by hand (selling on CPF, NFE_ENABLED=false). */
export async function markInvoiceManual(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = orderActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Pedido inválido." };
  const admin = createAdminClient();
  const { orderId, motivo } = parsed.data;

  const { data: order } = await admin
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();
  if (!order || order.status !== "paid") {
    return {
      ok: false,
      message: "Só pedidos pagos, ainda sem nota, recebem a nota manual.",
    };
  }

  const { error } = await admin
    .from("invoices")
    .upsert(
      { order_id: orderId, status: "manual" },
      { onConflict: "order_id" },
    );
  if (error) return { ok: false, message: GENERIC.message };

  const status = await admin.rpc("set_order_status", {
    p_order_id: orderId,
    p_status: "invoiced",
    p_detalhe: {
      origem: "admin",
      admin: user.email,
      nota: "manual",
      observacao: motivo ?? null,
    },
  });
  if (status.error) return { ok: false, message: GENERIC.message };
  revalidateOrder();
  return { ok: true };
}

const requeueSchema = orderActionSchema.extend({
  tipo: z.enum(["invoice", "label", "print"]),
});

/**
 * "Reemitir nota" / "Reimprimir": puts the job back on the queue (phase 6
 * runs it). The unique (tipo, order_id, etapa) keeps it to one job per kind.
 */
export async function requeueJob(formData: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = requeueSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Pedido inválido." };
  const admin = createAdminClient();
  const { orderId, tipo, motivo } = parsed.data;

  const { error } = await admin.from("jobs").upsert(
    {
      order_id: orderId,
      tipo,
      status: "pending",
      tentativas: 0,
      ultimo_erro: null,
      run_at: new Date().toISOString(),
    },
    { onConflict: "tipo,order_id,etapa" },
  );
  if (error) return { ok: false, message: GENERIC.message };

  await admin.from("order_events").insert({
    order_id: orderId,
    evento:
      tipo === "print"
        ? "reimpressao_pedida"
        : tipo === "invoice"
          ? "nota_reemitida"
          : "etiqueta_refeita",
    detalhe: { origem: "admin", admin: user.email, motivo: motivo ?? null },
  });
  revalidateOrder();
  return { ok: true };
}

const retrySchema = z.object({ jobId: z.uuid() });

/** "Tentar de novo" on a job that used all its attempts. */
export async function retryJob(formData: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = retrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Trabalho inválido." };
  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("jobs")
    .update({
      status: "pending",
      tentativas: 0,
      ultimo_erro: null,
      run_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.jobId)
    .eq("status", "failed")
    .select("order_id, tipo, etapa")
    .maybeSingle();
  if (error) return { ok: false, message: GENERIC.message };
  if (!job) return { ok: false, message: "Esse trabalho não está com falha." };

  await admin.from("order_events").insert({
    order_id: job.order_id,
    evento: "job_reenfileirado",
    detalhe: {
      tipo: job.tipo,
      etapa: job.etapa,
      origem: "admin",
      admin: user.email,
    },
  });
  revalidateOrder();
  return { ok: true };
}
