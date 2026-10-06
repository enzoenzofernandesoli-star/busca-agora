import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { publicEnv } from "@/lib/env-public";
import type { CategorySlug } from "@/lib/site";

import { PAGE_SIZE, type CatalogFilters } from "./filters";

// Catalog reads are public: an anon client WITHOUT cookies, so pages that
// only read the catalog can be cached (ISR) instead of rendered per user.
// RLS and the column grants still apply (no custo_cents, active only).
function catalogClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export type ProductSummary = {
  id: string;
  slug: string;
  nome: string;
  categoria: CategorySlug;
  categoriaNome: string;
  marcaNome: string | null;
  /** Cheapest variant, integer cents. */
  precoCents: number;
  precoDeCents: number | null;
  estoque: number;
  imagemUrl: string | null;
  imagemAlt: string | null;
};

type ListingRow = Database["public"]["Views"]["product_listing"]["Row"];

const LISTING_COLUMNS =
  "id, slug, nome, categoria_slug, categoria_nome, marca_nome, preco_cents, preco_de_cents, estoque, imagem_url, imagem_alt";

function isCategorySlug(value: string | null): value is CategorySlug {
  return value === "eletronicos" || value === "cosmeticos";
}

function toSummary(
  row: Pick<
    ListingRow,
    | "id"
    | "slug"
    | "nome"
    | "categoria_slug"
    | "categoria_nome"
    | "marca_nome"
    | "preco_cents"
    | "preco_de_cents"
    | "estoque"
    | "imagem_url"
    | "imagem_alt"
  >,
): ProductSummary | null {
  // The view never returns these as null; the generated types just cannot
  // know that. Rows that break the assumption are skipped, not rendered.
  if (
    !row.id ||
    !row.slug ||
    !row.nome ||
    row.preco_cents === null ||
    !isCategorySlug(row.categoria_slug)
  ) {
    return null;
  }
  return {
    id: row.id,
    slug: row.slug,
    nome: row.nome,
    categoria: row.categoria_slug,
    categoriaNome: row.categoria_nome ?? "",
    marcaNome: row.marca_nome,
    precoCents: row.preco_cents,
    precoDeCents: row.preco_de_cents,
    estoque: row.estoque ?? 0,
    imagemUrl: row.imagem_url,
    imagemAlt: row.imagem_alt,
  };
}

function toSummaries(rows: Parameters<typeof toSummary>[0][] | null) {
  return (rows ?? []).flatMap((row) => {
    const summary = toSummary(row);
    return summary ? [summary] : [];
  });
}

/** Thrown errors reach the route's error boundary and Sentry. */
function fail(context: string, error: { message: string }): never {
  throw new Error(`catalog: ${context}: ${error.message}`);
}

export async function getHomeShowcase(): Promise<{
  maisBuscados: ProductSummary[];
  cosmeticos: ProductSummary[];
}> {
  const supabase = catalogClient();
  const [destaques, cosmeticos] = await Promise.all([
    supabase
      .from("product_listing")
      .select(LISTING_COLUMNS)
      .eq("destaque", true)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("product_listing")
      .select(LISTING_COLUMNS)
      .eq("categoria_slug", "cosmeticos")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (destaques.error) fail("home destaques", destaques.error);
  if (cosmeticos.error) fail("home cosmeticos", cosmeticos.error);
  return {
    maisBuscados: toSummaries(destaques.data),
    cosmeticos: toSummaries(cosmeticos.data),
  };
}

export type SearchResult = {
  produtos: ProductSummary[];
  total: number;
  paginas: number;
  /**
   * The requested page is past the last one (old shared link, catalog
   * shrank). Pages redirect to the last valid page instead of showing
   * "0 produtos".
   */
  foraDoIntervalo: boolean;
};

export async function searchCatalog(
  filters: CatalogFilters,
  categoria?: CategorySlug,
): Promise<SearchResult> {
  const supabase = catalogClient();
  const params = {
    p_q: filters.q,
    p_categoria: categoria,
    p_marca: filters.marca,
    p_preco_min: filters.minCents,
    p_preco_max: filters.maxCents,
    p_ordem: filters.ordem,
    p_por_pagina: PAGE_SIZE,
    p_filtro: filters.filtro,
  };
  const { data, error } = await supabase.rpc("search_products", {
    ...params,
    p_pagina: filters.pagina,
  });
  if (error) fail("search", error);
  const rows = data ?? [];

  let total = Number(rows[0]?.total ?? 0);
  // The total travels on each row (count(*) over ()), so an empty page past
  // the end says nothing about it: ask for the first row to learn it.
  if (rows.length === 0 && filters.pagina > 1) {
    const first = await supabase.rpc("search_products", {
      ...params,
      p_pagina: 1,
      p_por_pagina: 1,
    });
    if (first.error) fail("search total", first.error);
    total = Number(first.data?.[0]?.total ?? 0);
  }

  const paginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    produtos: toSummaries(rows),
    total,
    paginas,
    foraDoIntervalo: rows.length === 0 && total > 0 && filters.pagina > paginas,
  };
}

export async function getBrands(
  categoria?: CategorySlug,
): Promise<{ slug: string; nome: string }[]> {
  let query = catalogClient()
    .from("product_listing")
    .select("marca_slug, marca_nome")
    .not("marca_slug", "is", null);
  if (categoria) query = query.eq("categoria_slug", categoria);
  const { data, error } = await query;
  if (error) fail("brands", error);
  const brands = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.marca_slug && row.marca_nome)
      brands.set(row.marca_slug, row.marca_nome);
  }
  return [...brands]
    .map(([slug, nome]) => ({ slug, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function suggestProducts(
  q: string,
): Promise<{ slug: string; nome: string; categoria: CategorySlug }[]> {
  const { data, error } = await catalogClient().rpc("suggest_products", {
    p_q: q,
  });
  if (error) fail("suggest", error);
  return (data ?? []).flatMap((row) =>
    isCategorySlug(row.categoria_slug)
      ? [{ slug: row.slug, nome: row.nome, categoria: row.categoria_slug }]
      : [],
  );
}

export type ProductVariant = {
  id: string;
  sku: string;
  nome: string;
  precoCents: number;
  precoDeCents: number | null;
  estoque: number;
};

export type ProductDetail = {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  categoria: CategorySlug;
  categoriaNome: string;
  marcaNome: string | null;
  variantes: ProductVariant[];
  imagens: { url: string; alt: string }[];
};

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const supabase = catalogClient();
  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, slug, nome, descricao, categories!inner(slug, nome, ativa), brands(nome)",
    )
    .eq("slug", slug)
    .eq("ativo", true)
    .eq("categories.ativa", true)
    .maybeSingle();
  if (error) fail("product", error);
  if (!product || !isCategorySlug(product.categories.slug)) return null;

  const [variants, images] = await Promise.all([
    supabase
      .from("product_variants_public")
      .select("id, sku, nome, preco_cents, preco_de_cents, estoque")
      .eq("product_id", product.id)
      .order("created_at")
      .order("sku"),
    supabase
      .from("product_images")
      .select("url, alt")
      .eq("product_id", product.id)
      .order("ordem")
      .order("created_at"),
  ]);
  if (variants.error) fail("product variants", variants.error);
  if (images.error) fail("product images", images.error);

  const variantes = (variants.data ?? []).flatMap((v) =>
    v.id && v.sku && v.preco_cents !== null
      ? [
          {
            id: v.id,
            sku: v.sku,
            nome: v.nome ?? "",
            precoCents: v.preco_cents,
            precoDeCents: v.preco_de_cents,
            estoque: v.estoque ?? 0,
          },
        ]
      : [],
  );
  if (variantes.length === 0) return null;

  return {
    id: product.id,
    slug: product.slug,
    nome: product.nome,
    descricao: product.descricao,
    categoria: product.categories.slug,
    categoriaNome: product.categories.nome,
    marcaNome: product.brands?.nome ?? null,
    variantes,
    imagens: (images.data ?? []).map((img) => ({
      url: img.url,
      alt: img.alt || product.nome,
    })),
  };
}

/** "Quem buscou isso também viu": same category, best sellers first. */
export async function getRelated(
  categoria: CategorySlug,
  excludeId: string,
): Promise<ProductSummary[]> {
  const { data, error } = await catalogClient()
    .from("product_listing")
    .select(LISTING_COLUMNS)
    .eq("categoria_slug", categoria)
    .neq("id", excludeId)
    .order("destaque", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);
  if (error) fail("related", error);
  return toSummaries(data);
}

/** Every active product, for the sitemap. */
export async function getAllProductSlugs(): Promise<
  { slug: string; updatedAt: string }[]
> {
  const { data, error } = await catalogClient()
    .from("products")
    .select("slug, updated_at")
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(5000);
  if (error) fail("sitemap", error);
  return (data ?? []).map((row) => ({
    slug: row.slug,
    updatedAt: row.updated_at,
  }));
}
