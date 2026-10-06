"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { fieldErrors } from "@/lib/auth/schemas";
import { requireUser } from "@/lib/auth/session";
import { cepSchema } from "@/lib/br/cep";
import { cpfSchema } from "@/lib/br/cpf";
import { telefoneSchema } from "@/lib/br/telefone";
import { createAdminClient } from "@/lib/db/admin";
import { createClient } from "@/lib/db/server";
import { echoValues, type FormState } from "@/lib/forms/state";

const SAVED: FormState = { ok: true, message: "Dados salvos." };
const GENERIC_ERROR: FormState = {
  ok: false,
  message: "Não deu certo agora. Tente de novo em instantes.",
};

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    schema.optional(),
  );

const profileSchema = z.object({
  nome: z.string().trim().min(2, { error: "Informe seu nome." }).max(120),
  cpf: optional(cpfSchema),
  telefone: optional(telefoneSchema),
});

// Writes go through the customer's own session: RLS and the column grants
// (nome, cpf, telefone, terms_accepted_at) decide what can change.
export async function updateProfile(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/conta");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: echoValues(formData),
    };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      nome: parsed.data.nome,
      cpf: parsed.data.cpf ?? null,
      telefone: parsed.data.telefone ?? null,
    })
    .eq("id", user.id);
  if (error) return GENERIC_ERROR;
  revalidatePath("/conta");
  return SAVED;
}

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

const text = (max: number, message: string) =>
  z.string().trim().min(1, { error: message }).max(max);

const addressSchema = z.object({
  id: optional(z.uuid()),
  cep: cepSchema,
  rua: text(160, "Informe a rua."),
  numero: text(20, "Informe o número (ou S/N)."),
  complemento: optional(z.string().trim().max(80)),
  bairro: text(80, "Informe o bairro."),
  cidade: text(80, "Informe a cidade."),
  uf: z.enum(UFS, { error: "Escolha o estado." }),
  principal: z.preprocess((v) => v === "on", z.boolean()),
});

export async function saveAddress(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/conta/enderecos");
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: echoValues(formData),
    };
  }
  const { id, principal, ...campos } = parsed.data;
  const supabase = await createClient();

  // The first address is always the main one.
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const virarPrincipal = principal || (count ?? 0) === 0;

  // Only one main address (unique index): unset the others first.
  if (virarPrincipal) {
    const unset = await supabase
      .from("addresses")
      .update({ principal: false })
      .eq("user_id", user.id)
      .eq("principal", true);
    if (unset.error) return GENERIC_ERROR;
  }

  const row = {
    ...campos,
    complemento: campos.complemento ?? null,
    principal: virarPrincipal,
    user_id: user.id,
  };
  const { error } = id
    ? await supabase.from("addresses").update(row).eq("id", id)
    : await supabase.from("addresses").insert(row);
  if (error) return GENERIC_ERROR;

  revalidatePath("/conta/enderecos");
  return { ok: true, message: "Endereço salvo." };
}

const idSchema = z.object({ id: z.uuid() });

export async function deleteAddress(formData: FormData): Promise<void> {
  const user = await requireUser("/conta/enderecos");
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { data: removido } = await supabase
    .from("addresses")
    .delete()
    .eq("id", parsed.data.id)
    .select("principal")
    .maybeSingle();

  // Keep one main address when the main one is deleted.
  if (removido?.principal) {
    const { data: outro } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (outro) {
      await supabase
        .from("addresses")
        .update({ principal: true })
        .eq("id", outro.id);
    }
  }
  revalidatePath("/conta/enderecos");
}

export async function setMainAddress(formData: FormData): Promise<void> {
  const user = await requireUser("/conta/enderecos");
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase
    .from("addresses")
    .update({ principal: false })
    .eq("user_id", user.id)
    .eq("principal", true);
  await supabase
    .from("addresses")
    .update({ principal: true })
    .eq("id", parsed.data.id);
  revalidatePath("/conta/enderecos");
}

export async function deleteAccount(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/conta");
  if (formData.get("confirmacao") !== "EXCLUIR") {
    return { ok: false, message: "Digite EXCLUIR para confirmar." };
  }
  if (user.role === "admin") {
    return {
      ok: false,
      message: "Contas de administrador não podem ser excluídas por aqui.",
    };
  }

  // Service role: deletes the login itself and personal data (LGPD);
  // orders stay with the fiscal copies only (supabase/migrations/..._accounts.sql).
  const { error } = await createAdminClient().rpc("delete_account", {
    p_user_id: user.id,
  });
  if (error) return GENERIC_ERROR;

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?conta=excluida");
}
