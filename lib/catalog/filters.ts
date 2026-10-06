import { z } from "zod";

// Search and category filters live in the URL (?q=&marca=&min=&max=&ordem=&pagina=),
// so they work without JavaScript and can be shared. This parses them.
// Pure module (no "server-only") so it can be unit tested.

export const SORT_OPTIONS = [
  { value: "relevancia", label: "Mais relevantes" },
  { value: "menor_preco", label: "Menor preço" },
  { value: "maior_preco", label: "Maior preço" },
  { value: "novidades", label: "Novidades" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 24;
const MAX_PAGE = 500;

const firstValue = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

const optionalText = (max: number) =>
  z.preprocess((value) => {
    const v = firstValue(value);
    if (typeof v !== "string") return undefined;
    const trimmed = v.trim().replace(/\s+/g, " ");
    return trimmed === "" ? undefined : trimmed.slice(0, max);
  }, z.string().optional());

/**
 * Parses a price typed in reais ("49", "49,9", "49,90", "1.299,90") into
 * integer cents without floating point. Anything else becomes undefined.
 */
export function reaisToCents(input: string): number | undefined {
  const cleaned = input.replace(/[R$\s]/g, "");
  // Thousands separator "." only when followed by exactly 3 digits.
  const normalized = cleaned
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return undefined;
  const reais = Number(match[1]);
  const centavos = Number((match[2] ?? "0").padEnd(2, "0"));
  return reais * 100 + centavos;
}

const priceCents = z.preprocess((value) => {
  const v = firstValue(value);
  return typeof v === "string" ? reaisToCents(v) : undefined;
}, z.number().int().nonnegative().optional());

const slugParam = z.preprocess((value) => {
  const v = firstValue(value);
  return typeof v === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v)
    ? v
    : undefined;
}, z.string().optional());

const sortParam = z.preprocess(
  (value) => {
    const v = firstValue(value);
    return SORT_OPTIONS.some((o) => o.value === v) ? v : undefined;
  },
  z
    .enum(SORT_OPTIONS.map((o) => o.value) as [SortOption, ...SortOption[]])
    .optional(),
);

const pageParam = z.preprocess((value) => {
  const v = firstValue(value);
  if (typeof v !== "string" || !/^\d{1,4}$/.test(v)) return 1;
  return Math.min(Math.max(Number(v), 1), MAX_PAGE);
}, z.number().int());

export const SHELF_FILTERS = ["ofertas", "mais-buscados"] as const;
export type ShelfFilter = (typeof SHELF_FILTERS)[number];

const shelfParam = z.preprocess((value) => {
  const v = firstValue(value);
  return SHELF_FILTERS.some((f) => f === v) ? v : undefined;
}, z.enum(SHELF_FILTERS).optional());

const filtersSchema = z.object({
  q: optionalText(100),
  marca: slugParam,
  min: priceCents,
  max: priceCents,
  ordem: sortParam,
  pagina: pageParam,
  filtro: shelfParam,
});

export type CatalogFilters = {
  q?: string;
  marca?: string;
  /** Integer cents. */
  minCents?: number;
  /** Integer cents. */
  maxCents?: number;
  ordem: SortOption;
  pagina: number;
  /** Shelf shortcuts from the category menu. */
  filtro?: ShelfFilter;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Never throws: invalid values are dropped, as if they were not in the URL. */
export function parseFilters(params: RawSearchParams): CatalogFilters {
  const parsed = filtersSchema.parse(params);
  let { min, max } = parsed;
  if (min !== undefined && max !== undefined && min > max) {
    [min, max] = [max, min];
  }
  return {
    q: parsed.q,
    marca: parsed.marca,
    minCents: min,
    maxCents: max,
    // With a search term, relevance is the natural default; without one,
    // newest first.
    ordem: parsed.ordem ?? (parsed.q ? "relevancia" : "novidades"),
    pagina: parsed.pagina,
    filtro: parsed.filtro,
  };
}

/** Cents back to the "49,90" shown in the price inputs. */
export function centsToReaisInput(cents: number | undefined): string {
  if (cents === undefined) return "";
  const reais = Math.trunc(cents / 100);
  const centavos = cents % 100;
  return centavos === 0
    ? String(reais)
    : `${reais},${String(centavos).padStart(2, "0")}`;
}

/** Builds the URL for a filter change, dropping empty values and page 1. */
export function filtersHref(
  pathname: string,
  filters: CatalogFilters,
  changes: Partial<CatalogFilters>,
): string {
  const next = { ...filters, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.filtro) params.set("filtro", next.filtro);
  if (next.marca) params.set("marca", next.marca);
  if (next.minCents !== undefined)
    params.set("min", centsToReaisInput(next.minCents));
  if (next.maxCents !== undefined)
    params.set("max", centsToReaisInput(next.maxCents));
  const defaultSort = next.q ? "relevancia" : "novidades";
  if (next.ordem !== defaultSort) params.set("ordem", next.ordem);
  if (next.pagina > 1) params.set("pagina", String(next.pagina));
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
