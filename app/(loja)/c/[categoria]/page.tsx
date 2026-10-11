import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Breadcrumb } from "@/components/loja/breadcrumb";
import { CatalogResults } from "@/components/loja/catalog-results";
import { CategoryArt } from "@/components/loja/category-art";
import { filtersHref, parseFilters } from "@/lib/catalog/filters";
import { getBrands, searchCatalog } from "@/lib/catalog/queries";
import { categoryStyles, type CategorySlug } from "@/lib/site";
import { cn } from "@/lib/utils";

// Category texts from docs/design/Home.dc.html.
const intro: Record<CategorySlug, string> = {
  eletronicos: "Fones, relógios, caixas de som e carregadores",
  cosmeticos: "Skincare, cabelo, corpo e proteção solar",
};

// Shortcuts are searches inside the category (?q=), not a new taxonomy.
const atalhos: Record<CategorySlug, { label: string; q: string }[]> = {
  eletronicos: [
    { label: "Fones", q: "fone" },
    { label: "Relógios", q: "relógio" },
    { label: "Caixas de som", q: "caixa de som" },
    { label: "Carregadores", q: "carregador" },
  ],
  cosmeticos: [
    { label: "Skincare", q: "skincare" },
    { label: "Cabelo", q: "cabelo" },
    { label: "Corpo", q: "corpo" },
    { label: "Proteção solar", q: "protetor" },
  ],
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
  if (result.foraDoIntervalo) {
    redirect(
      filtersHref(`/c/${categoria}`, filters, { pagina: result.paginas }),
    );
  }
  const cat = categoryStyles[categoria];

  return (
    <>
      <Breadcrumb itens={[{ nome: "Início", href: "/" }, { nome: cat.nome }]} />
      {/* No approved design for this page: tinted header with the
          category art fills the space next to the title (audit 11/10). */}
      <header
        className={cn(
          "relative isolate grid items-center gap-6 overflow-hidden rounded-[24px] p-6 text-noite md:min-h-[216px] md:grid-cols-[3fr_2fr] md:gap-8 md:p-8",
          // Full category colour (the pale tile vanished on the page
          // background); text stays noite for contrast.
          cat.cor,
        )}
      >
        {/* Brand rings, as on the Home hero. */}
        <div
          aria-hidden="true"
          className="ba-drift pointer-events-none absolute -top-24 -right-16 -z-10 size-72 rounded-full border-[48px] border-white/25 md:-top-40 md:right-[30%] md:size-[420px] md:border-[64px]"
        />
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[.1em] text-noite uppercase">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-[3px] bg-noite"
                />
                Categoria
              </span>
              <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
                {cat.nome}
              </h1>
              <p className="m-0 text-[15px] text-noite md:text-base">
                {intro[categoria]}
              </p>
            </div>
            <CategoryArt
              categoria={categoria}
              variante="mini"
              fundo="claro"
              className="ba-float size-[72px] shrink-0 md:hidden"
            />
          </div>
          <nav aria-label={`Atalhos de ${cat.nome}`}>
            <ul className="-mx-6 flex [scrollbar-width:none] list-none gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
              {atalhos[categoria].map((atalho, i) => {
                const ativo = filters.q === atalho.q;
                return (
                  <li
                    key={atalho.q}
                    className="shrink-0 motion-safe:animate-[ba-reveal_420ms_cubic-bezier(.2,.8,.2,1)_both]"
                    style={{ animationDelay: `${120 + i * 70}ms` }}
                  >
                    <Link
                      href={
                        ativo
                          ? filtersHref(`/c/${categoria}`, filters, {
                              q: undefined,
                              pagina: 1,
                            })
                          : filtersHref(`/c/${categoria}`, filters, {
                              q: atalho.q,
                              pagina: 1,
                            })
                      }
                      aria-current={ativo ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full border px-4 text-[15px] font-bold no-underline transition-colors duration-150",
                        ativo
                          ? "border-noite bg-noite text-white hover:text-white"
                          : "border-transparent bg-white text-noite hover:border-noite hover:text-noite",
                      )}
                    >
                      {atalho.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <CategoryArt
          categoria={categoria}
          variante="placa"
          fundo="claro"
          className="ba-float hidden w-full max-w-[320px] justify-self-end md:block"
        />
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
