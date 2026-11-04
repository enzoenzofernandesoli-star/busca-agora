import { LOJA } from "@/lib/config/empresa";

// Static store config for phase 0. Categories move to the `categories` table
// (phase 1); legal data lives in lib/config/empresa.ts.

/**
 * What the operation keeps today, in the store's short words (top bar,
 * running bands, benefits). Nothing here that it cannot deliver.
 */
export const PROMESSAS = [
  "Pix aprovado na hora",
  "Frete e prazo no seu CEP",
  "Troca em até 7 dias",
  "Despacho em até 24 h",
] as const;

/** Shown only while LOJA.emiteNotaFiscal is on. */
export const NOTA_FISCAL = "Nota fiscal em todo pedido";

/** PROMESSAS plus the invoice one when it is true. */
export function promessasDaLoja(): string[] {
  return [...PROMESSAS, ...(LOJA.emiteNotaFiscal ? [NOTA_FISCAL] : [])];
}

export type CategorySlug = "eletronicos" | "cosmeticos";

export const categoryStyles: Record<
  CategorySlug,
  { nome: string; cor: string; tile: string; ink: string }
> = {
  eletronicos: {
    nome: "Eletrônicos",
    cor: "bg-ciano",
    tile: "bg-ciano-tile",
    ink: "text-ciano-ink",
  },
  cosmeticos: {
    nome: "Cosméticos",
    cor: "bg-rosa",
    tile: "bg-rosa-tile",
    ink: "text-rosa-ink",
  },
};

/** Words of the running band on category and product pages. */
export const categoryBand: Record<CategorySlug, string[]> = {
  eletronicos: [
    "Fones",
    "Relógios",
    "Caixas de som",
    "Carregadores",
    ...(LOJA.emiteNotaFiscal ? [NOTA_FISCAL] : []),
    "Despacho em até 24 h",
  ],
  cosmeticos: [
    "Skincare",
    "Cabelo",
    "Corpo",
    "Proteção solar",
    ...(LOJA.emiteNotaFiscal ? [NOTA_FISCAL] : []),
    "Despacho em até 24 h",
  ],
};

export const navCategories: { label: string; href: string; cor?: string }[] = [
  { label: "Eletrônicos", href: "/c/eletronicos", cor: "bg-ciano" },
  { label: "Cosméticos", href: "/c/cosmeticos", cor: "bg-rosa" },
  { label: "Ofertas", href: "/busca?filtro=ofertas", cor: "bg-oferta" },
  { label: "Mais buscados", href: "/busca?filtro=mais-buscados" },
];
