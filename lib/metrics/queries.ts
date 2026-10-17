import "server-only";

import { createAdminClient } from "@/lib/db/admin";

import { forecast } from "./forecast";
import { originGroup, originLabel } from "./origin-group";
import { addDays, daysBetween, spDate } from "./period";
import type {
  DailyPoint,
  ForecastResult,
  FunnelData,
  MetricsSummary,
  OriginGroup,
  OriginRow,
  Period,
  ProductMetricsRow,
  SortKey,
  ViewerRow,
} from "./types";

// Reads for /admin/metricas. Aggregates come from product_metrics_daily
// (refreshed every hour); only the "who viewed" list reads raw events.
// Callers must have checked requireAdmin(): this uses the service role.

type DailyRow = {
  dia: string;
  product_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  ref: string;
  views: number;
  visitantes: number;
  add_to_cart: number;
  begin_checkout: number;
  pedidos: number;
  unidades: number;
  faturamento_cents: number;
  custo_cents: number;
};

const PAGE = 1000;

async function dailyRows(
  de: string,
  ate: string,
  productId?: string,
): Promise<DailyRow[]> {
  const admin = createAdminClient();
  const out: DailyRow[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = admin
      .from("product_metrics_daily")
      .select(
        "dia, product_id, utm_source, utm_medium, utm_campaign, ref, views, visitantes, add_to_cart, begin_checkout, pedidos, unidades, faturamento_cents, custo_cents",
      )
      .gte("dia", de)
      .lte("dia", ate)
      .order("dia")
      .order("product_id")
      .range(from, from + PAGE - 1);
    if (productId) q = q.eq("product_id", productId);
    const { data, error } = await q;
    if (error) throw new Error(`product_metrics_daily: ${error.message}`);
    out.push(...((data ?? []) as DailyRow[]));
    if (!data || data.length < PAGE) return out;
  }
}

type ProductDayRow = {
  dia: string;
  product_id: string;
  visitantes: number;
  pedidos: number;
};
type StoreDayRow = {
  dia: string;
  visitantes: number;
  pedidos: number;
  unidades: number;
  faturamento_cents: number;
  custo_cents: number;
};

/**
 * Distinct counts (visitors, orders) per product and day, across origins.
 * Never sum the per-origin "visitantes"/"pedidos": the same visitor or order
 * would count more than once.
 */
async function productDayRows(
  de: string,
  ate: string,
  productId?: string,
): Promise<ProductDayRow[]> {
  const admin = createAdminClient();
  const out: ProductDayRow[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = admin
      .from("product_metrics_product_daily")
      .select("dia, product_id, visitantes, pedidos")
      .gte("dia", de)
      .lte("dia", ate)
      .order("dia")
      .order("product_id")
      .range(from, from + PAGE - 1);
    if (productId) q = q.eq("product_id", productId);
    const { data, error } = await q;
    if (error) {
      throw new Error(`product_metrics_product_daily: ${error.message}`);
    }
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

/** The whole store per day: distinct visitors and orders across products. */
async function storeDayRows(de: string, ate: string): Promise<StoreDayRow[]> {
  const { data, error } = await createAdminClient()
    .from("store_metrics_daily")
    .select(
      "dia, visitantes, pedidos, unidades, faturamento_cents, custo_cents",
    )
    .gte("dia", de)
    .lte("dia", ate)
    .order("dia");
  if (error) throw new Error(`store_metrics_daily: ${error.message}`);
  return data ?? [];
}

const rate = (a: number, b: number) => (b > 0 ? a / b : null);

type ProductInfo = {
  ativo?: boolean;
  id: string;
  slug: string;
  nome: string;
  categoria: "eletronicos" | "cosmeticos";
};

async function allProducts(): Promise<ProductInfo[]> {
  const admin = createAdminClient();
  const data: {
    id: string;
    slug: string;
    nome: string;
    ativo: boolean;
    categories: { slug: string };
  }[] = [];
  // Paged (the API returns at most 1000 rows), stable order with id.
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await admin
      .from("products")
      .select("id, slug, nome, ativo, categories!inner(slug)")
      .order("nome")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`products: ${error.message}`);
    data.push(...(page ?? []));
    if (!page || page.length < PAGE) break;
  }
  return data.map((p) => ({
    ativo: p.ativo,
    id: p.id,
    slug: p.slug,
    nome: p.nome,
    categoria:
      p.categories.slug === "cosmeticos" ? "cosmeticos" : "eletronicos",
  }));
}

function emptyRow(p: ProductInfo): ProductMetricsRow {
  return {
    productId: p.id,
    slug: p.slug,
    nome: p.nome,
    categoria: p.categoria,
    views: 0,
    visitantes: 0,
    carrinho: 0,
    carrinhoTaxa: null,
    checkout: 0,
    checkoutTaxa: null,
    compras: 0,
    unidades: 0,
    conversao: null,
    faturamentoCents: 0,
    margemCents: 0,
  };
}

const SORTERS: Record<SortKey, (r: ProductMetricsRow) => number | string> = {
  nome: (r) => r.nome.toLowerCase(),
  views: (r) => r.views,
  visitantes: (r) => r.visitantes,
  carrinho: (r) => r.carrinho,
  checkout: (r) => r.checkout,
  compras: (r) => r.compras,
  conversao: (r) => r.conversao ?? -1,
  faturamento: (r) => r.faturamentoCents,
  margem: (r) => r.margemCents,
};

export function sortRows(
  rows: ProductMetricsRow[],
  key: SortKey,
  dir: "asc" | "desc",
): ProductMetricsRow[] {
  const get = SORTERS[key];
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = get(a);
    const y = get(b);
    return (x < y ? -1 : x > y ? 1 : 0) * sign || a.nome.localeCompare(b.nome);
  });
}

/** Every product, one row each, for the period; plus the store totals. */
export async function productsTable(period: Period): Promise<{
  rows: ProductMetricsRow[];
  summary: MetricsSummary;
}> {
  const [produtos, daily, porProduto, loja] = await Promise.all([
    allProducts(),
    dailyRows(period.de, period.ate),
    productDayRows(period.de, period.ate),
    storeDayRows(period.de, period.ate),
  ]);
  // Every product on sale, plus products no longer on sale that still had
  // movement in the period.
  const comMovimento = new Set(daily.map((d) => d.product_id));
  const byId = new Map(
    produtos
      .filter((p) => p.ativo || comMovimento.has(p.id))
      .map((p) => [p.id, emptyRow(p)]),
  );
  const custo = new Map<string, number>();
  // Distinct visitors and orders per product and day (summed over days).
  for (const d of porProduto) {
    const r = byId.get(d.product_id);
    if (!r) continue;
    r.visitantes += d.visitantes;
    r.compras += d.pedidos;
  }
  // Additive figures from the origin breakdown.
  for (const d of daily) {
    const r = byId.get(d.product_id);
    if (!r) continue;
    r.views += d.views;
    r.carrinho += d.add_to_cart;
    r.checkout += d.begin_checkout;
    r.unidades += d.unidades;
    r.faturamentoCents += Number(d.faturamento_cents);
    custo.set(
      d.product_id,
      (custo.get(d.product_id) ?? 0) + Number(d.custo_cents),
    );
  }
  const rows = [...byId.values()].map((r) => ({
    ...r,
    carrinhoTaxa: rate(r.carrinho, r.visitantes),
    checkoutTaxa: rate(r.checkout, r.carrinho),
    conversao: rate(r.compras, r.visitantes),
    margemCents: r.faturamentoCents - (custo.get(r.productId) ?? 0),
  }));
  // Store totals from the store summary: one order with two products is one
  // purchase, one visitor of two products is one visitor.
  const visitantes = loja.reduce((n, d) => n + d.visitantes, 0);
  const compras = loja.reduce((n, d) => n + d.pedidos, 0);
  const faturamentoCents = loja.reduce(
    (n, d) => n + Number(d.faturamento_cents),
    0,
  );
  const margemCents =
    faturamentoCents - loja.reduce((n, d) => n + Number(d.custo_cents), 0);
  return {
    rows,
    summary: {
      visitantes,
      compras,
      conversao: rate(compras, visitantes),
      faturamentoCents,
      margemCents,
    },
  };
}

/**
 * Daily series: views and revenue add up from the origin breakdown; sales
 * come from a distinct-orders summary (store or product).
 */
function seriesOf(
  daily: DailyRow[],
  vendas: { dia: string; pedidos: number }[],
  days: string[],
): DailyPoint[] {
  const map = new Map<string, DailyPoint>(
    days.map((d) => [d, { data: d, views: 0, vendas: 0, faturamentoCents: 0 }]),
  );
  for (const r of daily) {
    const p = map.get(r.dia);
    if (!p) continue;
    p.views += r.views;
    p.faturamentoCents += Number(r.faturamento_cents);
  }
  for (const v of vendas) {
    const p = map.get(v.dia);
    if (p) p.vendas += v.pedidos;
  }
  return [...map.values()];
}

/**
 * Forecast for the next N days from the last 28 days (before today). Days
 * before the first recorded data are not invented as zeros: the forecast
 * sees only the days the store actually has.
 */
export async function forecastFor(
  horizonDays: number,
  now: Date,
  productId?: string,
): Promise<ForecastResult> {
  const hoje = spDate(now);
  const ontem = addDays(hoje, -1);
  const inicioJanela = addDays(hoje, -28);
  const admin = createAdminClient();
  const { data: primeiro } = await (
    productId
      ? admin
          .from("product_metrics_product_daily")
          .select("dia")
          .eq("product_id", productId)
          .order("dia")
          .limit(1)
      : admin.from("store_metrics_daily").select("dia").order("dia").limit(1)
  ).maybeSingle();
  if (!primeiro) {
    return { suficiente: false, motivo: "Ainda não há dados registrados." };
  }
  const de = primeiro.dia > inicioJanela ? primeiro.dia : inicioJanela;
  if (de > ontem) {
    return { suficiente: false, motivo: "Menos de 14 dias de dados." };
  }
  const [daily, vendas] = await Promise.all([
    dailyRows(de, ontem, productId),
    productId ? productDayRows(de, ontem, productId) : storeDayRows(de, ontem),
  ]);
  return forecast(
    seriesOf(daily, vendas, daysBetween(de, ontem)),
    horizonDays,
    now,
  );
}

export async function productBySlug(slug: string): Promise<ProductInfo | null> {
  const { data } = await createAdminClient()
    .from("products")
    .select("id, slug, nome, categories!inner(slug)")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    nome: data.nome,
    categoria:
      data.categories.slug === "cosmeticos" ? "cosmeticos" : "eletronicos",
  };
}

const GROUP_ORDER: OriginGroup[] = [
  "redes",
  "influenciador",
  "anuncio",
  "direto",
  "outros",
];

export async function productDetail(
  productId: string,
  period: Period,
): Promise<{
  dias: DailyPoint[];
  funil: FunnelData;
  origens: OriginRow[];
  quemViu: ViewerRow[];
}> {
  const [daily, porDia] = await Promise.all([
    dailyRows(period.de, period.ate, productId),
    productDayRows(period.de, period.ate, productId),
  ]);
  const dias = seriesOf(daily, porDia, daysBetween(period.de, period.ate));
  const funil: FunnelData = {
    // Distinct across origins (one visitor, one order).
    viu: porDia.reduce((n, d) => n + d.visitantes, 0),
    carrinho: 0,
    checkout: 0,
    comprou: porDia.reduce((n, d) => n + d.pedidos, 0),
  };
  const origens = new Map<string, OriginRow>();
  for (const d of daily) {
    funil.carrinho += d.add_to_cart;
    funil.checkout += d.begin_checkout;
    const grupo = originGroup(d);
    const detalhe = originLabel(d);
    const key = `${grupo}|${detalhe}`;
    const o = origens.get(key) ?? {
      grupo,
      detalhe,
      visitas: 0,
      vendas: 0,
      faturamentoCents: 0,
    };
    o.visitas += d.views;
    o.vendas += d.pedidos;
    o.faturamentoCents += Number(d.faturamento_cents);
    origens.set(key, o);
  }
  return {
    dias,
    funil,
    origens: [...origens.values()].sort(
      (a, b) =>
        GROUP_ORDER.indexOf(a.grupo) - GROUP_ORDER.indexOf(b.grupo) ||
        b.visitas - a.visitas,
    ),
    quemViu: await viewers(productId, period),
  };
}

/** Visitors of the product in the period (raw events, latest 50). */
async function viewers(
  productId: string,
  period: Period,
): Promise<ViewerRow[]> {
  const admin = createAdminClient();
  const inicio = new Date(`${period.de}T00:00:00-03:00`).toISOString();
  const fim = new Date(
    `${addDays(period.ate, 1)}T00:00:00-03:00`,
  ).toISOString();
  const { data: views, error } = await admin
    .from("product_events")
    .select(
      "session_id, user_id, utm_source, utm_medium, utm_campaign, ref, device, created_at",
    )
    .eq("product_id", productId)
    .eq("event", "view")
    .gte("created_at", inicio)
    .lt("created_at", fim)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw new Error(`product_events: ${error.message}`);

  const sessions = new Map<
    string,
    {
      userId: string | null;
      origem: string;
      device: "mobile" | "desktop";
      primeira: string;
      visitas: number;
      dias: Set<string>;
    }
  >();
  for (const v of views ?? []) {
    const s = sessions.get(v.session_id);
    const dia = spDate(new Date(v.created_at));
    if (s) {
      s.visitas += 1;
      s.dias.add(dia);
      s.userId ??= v.user_id;
      // Rows come newest first: the last one seen is the first visit.
      s.primeira = v.created_at;
      s.origem = originLabel({
        utm_source: v.utm_source ?? "",
        utm_medium: v.utm_medium ?? "",
        utm_campaign: v.utm_campaign ?? "",
        ref: v.ref ?? "",
      });
    } else if (sessions.size < 50) {
      sessions.set(v.session_id, {
        userId: v.user_id,
        origem: originLabel({
          utm_source: v.utm_source ?? "",
          utm_medium: v.utm_medium ?? "",
          utm_campaign: v.utm_campaign ?? "",
          ref: v.ref ?? "",
        }),
        device: v.device === "mobile" ? "mobile" : "desktop",
        primeira: v.created_at,
        visitas: 1,
        dias: new Set([dia]),
      });
    }
  }
  const ids = [...sessions.keys()];
  if (ids.length === 0) return [];

  const userIds = [
    ...new Set([...sessions.values()].map((s) => s.userId).filter(Boolean)),
  ] as string[];
  const [{ data: compras }, { data: perfis }] = await Promise.all([
    admin
      .from("product_events")
      .select("session_id")
      .eq("product_id", productId)
      .eq("event", "purchase")
      .in("session_id", ids),
    userIds.length
      ? admin.from("profiles").select("id, nome").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; nome: string | null }[] }),
  ]);
  const compraram = new Set((compras ?? []).map((c) => c.session_id));
  const nomes = new Map(
    (perfis ?? []).map((p) => [p.id, p.nome || "(sem nome)"]),
  );

  return [...sessions.entries()].map(([sessionId, s]) => ({
    sessionId,
    cliente: s.userId
      ? { id: s.userId, nome: nomes.get(s.userId) ?? "(cliente)" }
      : null,
    origem: s.origem,
    device: s.device,
    primeiraVisita: s.primeira,
    visitas: s.visitas,
    voltou: s.dias.size > 1,
    comprou: compraram.has(sessionId),
  }));
}
