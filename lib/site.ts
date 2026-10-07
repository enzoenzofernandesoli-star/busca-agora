// Static store config for phase 0. Categories move to the `categories` table
// (phase 1); legal data lives in `settings` (lib/store-info.ts, phase 9).

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

export const navCategories: { label: string; href: string; cor?: string }[] = [
  { label: "Eletrônicos", href: "/c/eletronicos", cor: "bg-ciano" },
  { label: "Cosméticos", href: "/c/cosmeticos", cor: "bg-rosa" },
  { label: "Ofertas", href: "/busca?filtro=ofertas", cor: "bg-lima" },
  { label: "Mais buscados", href: "/busca?filtro=mais-buscados" },
];

/** Set by proxy.ts on the Home when the visitor has no ba_visto cookie. */
export const FIRST_VISIT_HEADER = "x-ba-primeira-visita";
