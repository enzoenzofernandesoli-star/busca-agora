import "server-only";

import { createAdminClient } from "@/lib/db/admin";
import type { Database } from "@/lib/db/types";
import { env } from "@/lib/env";

// Read side of the admin panel. Every page calls requireAdmin() before
// using these (they read with the service role, custo_cents included).

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "invoiced",
  "label_ready",
  "printed",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
];

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`admin: ${context}: ${error?.message ?? "sem dados"}`);
}

export type Dashboard = {
  vendasHojeCents: number;
  pedidosHoje: number;
  aEnviar: number;
  jobsErro: number;
  estoqueBaixo: number;
};

export async function getDashboard(): Promise<Dashboard> {
  const { data, error } = await createAdminClient().rpc("admin_dashboard");
  if (error || !data) fail("dashboard", error);
  const d = data as Record<string, number>;
  return {
    vendasHojeCents: Number(d.vendas_hoje_cents ?? 0),
    pedidosHoje: Number(d.pedidos_hoje ?? 0),
    aEnviar: Number(d.a_enviar ?? 0),
    jobsErro: Number(d.jobs_erro ?? 0),
    estoqueBaixo: Number(d.estoque_baixo ?? 0),
  };
}

export async function listOrders(opts: {
  status?: OrderStatus | "a_enviar";
  busca?: string;
}) {
  let query = createAdminClient()
    .from("orders")
    .select(
      "id, numero, status, total_cents, cliente_nome, payment_method, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (opts.status === "a_enviar") {
    query = query.in("status", ["paid", "invoiced", "label_ready", "printed"]);
  } else if (opts.status) {
    query = query.eq("status", opts.status);
  }
  const busca = opts.busca?.trim().toUpperCase();
  if (busca) {
    const numero = /^\d+$/.test(busca) ? `BA-${busca.padStart(6, "0")}` : busca;
    query = query.eq("numero", numero);
  }
  const { data, error } = await query;
  if (error) fail("orders", error);
  return data ?? [];
}

export async function getOrderByNumber(numero: string) {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select(
      "*, order_items(*), invoices(*), shipments(*), payments(id, metodo, status, valor_cents, created_at)",
    )
    .eq("numero", numero)
    .maybeSingle();
  if (error) fail("order", error);
  if (!order) return null;

  const [{ data: eventos }, { data: jobs }] = await Promise.all([
    admin
      .from("order_events")
      .select("id, evento, detalhe, created_at")
      .eq("order_id", order.id)
      .order("created_at"),
    admin
      .from("jobs")
      .select("id, tipo, status, tentativas, ultimo_erro, run_at")
      .eq("order_id", order.id)
      .order("created_at"),
  ]);
  return { order, eventos: eventos ?? [], jobs: jobs ?? [] };
}

export async function listProducts(opts: {
  busca?: string;
  filtro?: "ativos" | "inativos" | "estoque";
}) {
  let query = createAdminClient()
    .from("products")
    .select(
      "id, nome, slug, ativo, destaque, updated_at, categories(nome), product_variants(estoque, preco_cents), product_images(url, ordem)",
    )
    .order("updated_at", { ascending: false })
    .limit(200);
  if (opts.filtro === "ativos") query = query.eq("ativo", true);
  if (opts.filtro === "inativos") query = query.eq("ativo", false);
  if (opts.busca?.trim())
    query = query.ilike("nome", `%${opts.busca.trim().replace(/[%_]/g, "")}%`);
  const { data, error } = await query;
  if (error) fail("products", error);
  const rows =
    opts.filtro === "estoque"
      ? (data ?? []).filter(
          (p) => p.ativo && p.product_variants.some((v) => v.estoque <= 3),
        )
      : (data ?? []);
  return rows.map((p) => ({
    id: p.id,
    nome: p.nome,
    slug: p.slug,
    ativo: p.ativo,
    destaque: p.destaque,
    categoria: p.categories?.nome ?? "",
    estoque: p.product_variants.reduce((n, v) => n + v.estoque, 0),
    precoMinCents: p.product_variants.length
      ? Math.min(...p.product_variants.map((v) => v.preco_cents))
      : null,
    capa:
      [...p.product_images].sort((a, b) => a.ordem - b.ordem)[0]?.url ?? null,
  }));
}

export async function getProductForEdit(id: string) {
  const { data, error } = await createAdminClient()
    .from("products")
    .select("*, product_variants(*), product_images(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("product", error);
  if (!data) return null;
  return {
    ...data,
    product_variants: [...data.product_variants].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
    product_images: [...data.product_images].sort((a, b) => a.ordem - b.ordem),
  };
}

export async function listCategoriesAndBrands() {
  const admin = createAdminClient();
  const [categorias, marcas] = await Promise.all([
    admin.from("categories").select("*").order("ordem"),
    admin.from("brands").select("id, nome, slug").order("nome"),
  ]);
  if (categorias.error) fail("categories", categorias.error);
  if (marcas.error) fail("brands", marcas.error);
  return { categorias: categorias.data ?? [], marcas: marcas.data ?? [] };
}

export async function listBanners() {
  const { data, error } = await createAdminClient()
    .from("banners")
    .select("*")
    .order("ordem");
  if (error) fail("banners", error);
  return data ?? [];
}

/** Customers, read only. CPF masked; e-mail from Supabase Auth. */
export async function listCustomers() {
  const admin = createAdminClient();
  const [{ data: perfis, error }, users, { data: pedidos }] = await Promise.all(
    [
      admin
        .from("profiles")
        .select("id, nome, cpf, telefone, role, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("orders").select("user_id, total_cents, status"),
    ],
  );
  if (error) fail("customers", error);
  const emails = new Map(
    (users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]),
  );
  const totais = new Map<string, { pedidos: number; totalCents: number }>();
  for (const o of pedidos ?? []) {
    if (!o.user_id || o.status === "canceled" || o.status === "pending_payment")
      continue;
    const t = totais.get(o.user_id) ?? { pedidos: 0, totalCents: 0 };
    t.pedidos += 1;
    t.totalCents += o.total_cents;
    totais.set(o.user_id, t);
  }
  return (perfis ?? []).map((p) => ({
    id: p.id,
    nome: p.nome || "(sem nome)",
    email: emails.get(p.id) ?? "",
    cpf: p.cpf ? `***.${p.cpf.slice(3, 6)}.***-**` : "",
    telefone: p.telefone ?? "",
    admin: p.role === "admin",
    criadoEm: p.created_at,
    pedidos: totais.get(p.id)?.pedidos ?? 0,
    totalCents: totais.get(p.id)?.totalCents ?? 0,
  }));
}

export async function getSettings() {
  const { data, error } = await createAdminClient()
    .from("settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error || !data) fail("settings", error);
  const origem =
    data.endereco_origem &&
    typeof data.endereco_origem === "object" &&
    !Array.isArray(data.endereco_origem)
      ? (data.endereco_origem as Record<string, string | null>)
      : {};
  return { ...data, origem };
}

export type IntegrationStatus = {
  nome: string;
  estado: "conectado" | "erro" | "nao_configurado" | "desligado";
  detalhe: string;
};

/** Only says whether each integration is set up and answering. Never the key. */
export async function getIntegrationStatus(): Promise<IntegrationStatus[]> {
  const has = (v: string | undefined) => Boolean(v && v.trim());

  async function melhorEnvio(): Promise<IntegrationStatus> {
    const nome = `Melhor Envio (${env.MELHORENVIO_ENV === "production" ? "produção" : "teste"})`;
    if (!has(env.MELHORENVIO_TOKEN)) {
      return { nome, estado: "nao_configurado", detalhe: "Falta o token." };
    }
    const base =
      env.MELHORENVIO_ENV === "production"
        ? "https://melhorenvio.com.br"
        : "https://sandbox.melhorenvio.com.br";
    try {
      const res = await fetch(`${base}/api/v2/me`, {
        headers: {
          Authorization: `Bearer ${env.MELHORENVIO_TOKEN}`,
          Accept: "application/json",
          "User-Agent": "Busca Agora (contato@buscaagora.com.br)",
        },
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      return res.ok
        ? { nome, estado: "conectado", detalhe: "Token aceito." }
        : {
            nome,
            estado: "erro",
            detalhe: `O Melhor Envio recusou o token (HTTP ${res.status}).`,
          };
    } catch {
      return { nome, estado: "erro", detalhe: "Sem resposta do Melhor Envio." };
    }
  }

  const simples = (
    nome: string,
    ok: boolean,
    falta: string,
  ): IntegrationStatus =>
    ok
      ? { nome, estado: "conectado", detalhe: "Chave configurada." }
      : { nome, estado: "nao_configurado", detalhe: falta };

  return [
    simples(
      "Mercado Pago",
      has(env.MP_ACCESS_TOKEN) && has(env.MP_WEBHOOK_SECRET),
      "Falta o token ou o segredo do webhook (fase 5).",
    ),
    await melhorEnvio(),
    env.NFE_ENABLED
      ? simples(
          "Nota fiscal (Focus NFe)",
          has(env.NFE_API_TOKEN),
          "Falta o token da API de NF-e.",
        )
      : {
          nome: "Nota fiscal",
          estado: "desligado",
          detalhe: "Emissão manual (venda no CPF).",
        },
    simples(
      "PrintNode (impressora)",
      has(env.PRINTNODE_API_KEY),
      "Falta a chave do PrintNode (fase 6).",
    ),
    simples(
      "Resend (e-mails)",
      has(env.RESEND_API_KEY),
      "Falta a chave do Resend (fase 7).",
    ),
    simples(
      "Telegram (avisos)",
      has(env.TELEGRAM_BOT_TOKEN) && has(env.TELEGRAM_CHAT_ID),
      "Falta o bot ou o chat (fase 7).",
    ),
    simples("Sentry (erros)", has(env.SENTRY_DSN), "Opcional."),
  ];
}
