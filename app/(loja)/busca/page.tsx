import type { Metadata } from "next";

import { Breadcrumb } from "@/components/loja/breadcrumb";
import { CatalogResults } from "@/components/loja/catalog-results";
import { parseFilters } from "@/lib/catalog/filters";
import { getBrands, searchCatalog } from "@/lib/catalog/queries";

export async function generateMetadata(
  props: PageProps<"/busca">,
): Promise<Metadata> {
  const { q } = parseFilters(await props.searchParams);
  return {
    title: q ? `Busca: ${q}` : "Busca",
    // Search result pages are not worth indexing; product pages are.
    robots: { index: false, follow: true },
  };
}

export default async function BuscaPage(props: PageProps<"/busca">) {
  const filters = parseFilters(await props.searchParams);
  const [result, marcas] = await Promise.all([
    searchCatalog(filters),
    getBrands(),
  ]);

  return (
    <>
      <Breadcrumb itens={[{ nome: "Início", href: "/" }, { nome: "Busca" }]} />
      <header className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
          {filters.q ? (
            <>
              Resultados para{" "}
              <span className="text-ultramar">“{filters.q}”</span>
            </>
          ) : filters.filtro === "ofertas" ? (
            "Ofertas"
          ) : filters.filtro === "mais-buscados" ? (
            "Mais buscados"
          ) : (
            "Todos os produtos"
          )}
        </h1>
      </header>
      <CatalogResults
        pathname="/busca"
        filters={filters}
        result={result}
        marcas={marcas}
        vazio={{
          titulo: filters.q
            ? `Nada encontrado para “${filters.q}”`
            : "Nenhum produto por aqui ainda",
          texto: filters.q
            ? "Confira a grafia ou tente uma palavra mais curta, como “fone” ou “sérum”."
            : "Estamos montando as prateleiras. Novidades chegam toda semana.",
        }}
      />
    </>
  );
}
