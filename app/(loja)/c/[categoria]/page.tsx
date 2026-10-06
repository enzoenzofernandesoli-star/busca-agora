import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/loja/breadcrumb";
import { CatalogResults } from "@/components/loja/catalog-results";
import { parseFilters } from "@/lib/catalog/filters";
import { getBrands, searchCatalog } from "@/lib/catalog/queries";
import { categoryStyles, type CategorySlug } from "@/lib/site";
import { cn } from "@/lib/utils";

// Category texts from docs/design/Home.dc.html.
const intro: Record<CategorySlug, string> = {
  eletronicos: "Fones, relógios, caixas de som e carregadores",
  cosmeticos: "Skincare, cabelo, corpo e proteção solar",
};

function toCategory(value: string): CategorySlug | null {
  return value === "eletronicos" || value === "cosmeticos" ? value : null;
}

export async function generateMetadata(
  props: PageProps<"/c/[categoria]">,
): Promise<Metadata> {
  const categoria = toCategory((await props.params).categoria);
  if (!categoria) return {};
  const nome = categoryStyles[categoria].nome;
  return {
    title: nome,
    description: `${nome}: ${intro[categoria].toLowerCase()}. Frete calculado no seu CEP e nota fiscal em todo pedido.`,
    alternates: { canonical: `/c/${categoria}` },
  };
}

export default async function CategoriaPage(
  props: PageProps<"/c/[categoria]">,
) {
  const categoria = toCategory((await props.params).categoria);
  if (!categoria) notFound();

  const filters = parseFilters(await props.searchParams);
  const [result, marcas] = await Promise.all([
    searchCatalog(filters, categoria),
    getBrands(categoria),
  ]);
  const cat = categoryStyles[categoria];

  return (
    <>
      <Breadcrumb itens={[{ nome: "Início", href: "/" }, { nome: cat.nome }]} />
      <header className="flex flex-col gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-2 text-[13px] font-bold tracking-[.1em] uppercase",
            cat.ink,
          )}
        >
          <span
            aria-hidden="true"
            className={cn("size-2.5 rounded-[3px]", cat.cor)}
          />
          Categoria
        </span>
        <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
          {cat.nome}
        </h1>
        <p className="m-0 text-[15px] text-texto-2 md:text-base">
          {intro[categoria]}
        </p>
      </header>
      <CatalogResults
        pathname={`/c/${categoria}`}
        filters={filters}
        result={result}
        marcas={marcas}
        vazio={{
          titulo: "Prateleira sendo montada",
          texto:
            "Ainda não temos produtos aqui com esses filtros. Novidades chegam toda semana.",
        }}
      />
    </>
  );
}
