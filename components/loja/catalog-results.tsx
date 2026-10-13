import Link from "next/link";

import { EmptyState } from "@/components/loja/empty-state";
import { ProductCard } from "@/components/loja/product-card";
import { formatBRL } from "@/lib/format";
import {
  SORT_OPTIONS,
  centsToReaisInput,
  filtersHref,
  type CatalogFilters,
} from "@/lib/catalog/filters";
import type { SearchResult } from "@/lib/catalog/queries";
import { cn } from "@/lib/utils";

type CatalogResultsProps = {
  /** Path the filter form submits to: "/busca" or "/c/eletronicos". */
  pathname: string;
  filters: CatalogFilters;
  result: SearchResult;
  marcas: { slug: string; nome: string }[];
  /** Shown when nothing matches. */
  vazio: { titulo: string; texto: string };
};

const fieldClass =
  "h-11 w-full min-w-0 rounded-xl border-[1.5px] border-borda-forte bg-white px-3.5 text-base text-noite placeholder:text-texto-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar";

// Plain GET form: filters, sort and pages work without JavaScript and the
// URL can be shared.
function FilterForm({
  pathname,
  filters,
  marcas,
  idPrefix,
}: Pick<CatalogResultsProps, "pathname" | "filters" | "marcas"> & {
  /** The form renders twice (mobile and desktop): ids must not repeat. */
  idPrefix: string;
}) {
  return (
    <form
      action={pathname}
      method="get"
      className="flex flex-col gap-5"
      aria-label="Filtros"
    >
      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
      {filters.filtro ? (
        <input type="hidden" name="filtro" value={filters.filtro} />
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor={`${idPrefix}-ordem`} className="text-[15px] font-bold">
          Ordenar por
        </label>
        <select
          id={`${idPrefix}-ordem`}
          name="ordem"
          defaultValue={filters.ordem}
          className={fieldClass}
        >
          {SORT_OPTIONS.filter(
            (o) => filters.q || o.value !== "relevancia",
          ).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[15px] font-bold">Preço (R$)</legend>
        <div className="flex items-center gap-2">
          <label htmlFor={`${idPrefix}-min`} className="sr-only">
            Preço mínimo em reais
          </label>
          <input
            id={`${idPrefix}-min`}
            name="min"
            inputMode="decimal"
            placeholder="Mín."
            defaultValue={centsToReaisInput(filters.minCents)}
            className={fieldClass}
          />
          <span aria-hidden="true" className="text-texto-2">
            a
          </span>
          <label htmlFor={`${idPrefix}-max`} className="sr-only">
            Preço máximo em reais
          </label>
          <input
            id={`${idPrefix}-max`}
            name="max"
            inputMode="decimal"
            placeholder="Máx."
            defaultValue={centsToReaisInput(filters.maxCents)}
            className={fieldClass}
          />
        </div>
      </fieldset>

      {marcas.length > 0 ? (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-2 text-[15px] font-bold">Marca</legend>
          {/* Long brand lists scroll inside the box instead of stretching
              the sidebar (audit 11/10). */}
          <div className="-mx-1 flex max-h-[264px] flex-col gap-1 overflow-y-auto px-1">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
              <input
                type="radio"
                name="marca"
                value=""
                defaultChecked={!filters.marca}
                className="size-5 accent-ultramar"
              />
              Todas
            </label>
            {marcas.map((m) => (
              <label
                key={m.slug}
                className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]"
              >
                <input
                  type="radio"
                  name="marca"
                  value={m.slug}
                  defaultChecked={filters.marca === m.slug}
                  className="size-5 accent-ultramar"
                />
                {m.nome}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          className="min-h-[52px] rounded-[14px] bg-ultramar px-6 font-display text-base font-bold text-white hover:bg-ultramar-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
        >
          Aplicar filtros
        </button>
        <Link
          href={filtersHref(pathname, filters, {
            marca: undefined,
            minCents: undefined,
            maxCents: undefined,
            ordem: filters.q ? "relevancia" : "novidades",
            pagina: 1,
          })}
          className="flex min-h-11 items-center justify-center text-[15px] font-bold"
        >
          Limpar filtros
        </Link>
      </div>
    </form>
  );
}

function Pagination({
  pathname,
  filters,
  paginas,
}: {
  pathname: string;
  filters: CatalogFilters;
  paginas: number;
}) {
  if (paginas <= 1) return null;
  const atual = Math.min(filters.pagina, paginas);
  const linkClass =
    "flex min-h-11 min-w-11 items-center justify-center rounded-[14px] border border-borda bg-white px-4 font-bold text-noite hover:text-ultramar";
  return (
    <nav
      aria-label="Páginas"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {atual > 1 ? (
        <Link
          href={filtersHref(pathname, filters, { pagina: atual - 1 })}
          className={linkClass}
          rel="prev"
        >
          Anterior
        </Link>
      ) : null}
      <span className="px-3 text-[15px] text-texto-2" aria-current="page">
        Página {atual} de {paginas}
      </span>
      {atual < paginas ? (
        <Link
          href={filtersHref(pathname, filters, { pagina: atual + 1 })}
          className={linkClass}
          rel="next"
        >
          Próxima
        </Link>
      ) : null}
    </nav>
  );
}

/** Applied filters as removable chips: each link drops one filter. */
function ActiveFilters({
  pathname,
  filters,
  marcas,
}: Pick<CatalogResultsProps, "pathname" | "filters" | "marcas">) {
  const chips: { label: string; href: string }[] = [];
  if (filters.marca !== undefined) {
    const nome =
      marcas.find((m) => m.slug === filters.marca)?.nome ?? filters.marca;
    chips.push({
      label: `Marca: ${nome}`,
      href: filtersHref(pathname, filters, { marca: undefined, pagina: 1 }),
    });
  }
  if (filters.minCents !== undefined) {
    chips.push({
      label: `A partir de ${formatBRL(filters.minCents)}`,
      href: filtersHref(pathname, filters, { minCents: undefined, pagina: 1 }),
    });
  }
  if (filters.maxCents !== undefined) {
    chips.push({
      label: `Até ${formatBRL(filters.maxCents)}`,
      href: filtersHref(pathname, filters, { maxCents: undefined, pagina: 1 }),
    });
  }
  if (chips.length === 0) return null;
  return (
    <ul
      aria-label="Filtros em uso"
      className="m-0 flex list-none flex-wrap gap-2 p-0"
    >
      {chips.map((chip) => (
        <li key={chip.label}>
          <Link
            href={chip.href}
            aria-label={`Remover filtro ${chip.label}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-borda bg-white pr-3 pl-4 text-[15px] font-bold text-noite no-underline transition-colors duration-150 hover:border-noite hover:text-noite"
          >
            {chip.label}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CatalogResults({
  pathname,
  filters,
  result,
  marcas,
  vazio,
}: CatalogResultsProps) {
  const ativos = [filters.marca, filters.minCents, filters.maxCents].filter(
    (v) => v !== undefined,
  ).length;
  const temFiltro = ativos > 0;

  // Nothing found and no filter to undo: no sidebar next to an empty grid,
  // just a new try (audit 11/10).
  if (result.total === 0 && !temFiltro) {
    return (
      <EmptyState
        titulo={vazio.titulo}
        texto={vazio.texto}
        icone="busca"
        links={[
          { label: "Eletrônicos", href: "/c/eletronicos" },
          { label: "Cosméticos", href: "/c/cosmeticos" },
        ]}
      >
        {pathname === "/busca" ? (
          <form
            action="/busca"
            method="get"
            role="search"
            className="flex w-full max-w-[440px] gap-2"
          >
            <label htmlFor="busca-de-novo" className="sr-only">
              Buscar de novo
            </label>
            <input
              id="busca-de-novo"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Buscar outro produto"
              className={cn(fieldClass, "h-12")}
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-[14px] bg-lima px-5 font-display font-bold text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
            >
              Buscar
            </button>
          </form>
        ) : null}
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
      {/* Mobile: filters collapsed behind a native <details>. */}
      <details className="rounded-[22px] border border-borda bg-white md:hidden">
        <summary className="flex min-h-[52px] cursor-pointer items-center justify-between px-5 font-display font-bold">
          Filtrar e ordenar
          {temFiltro ? (
            <span className="rounded-full bg-lima px-2.5 py-0.5 text-xs text-noite">
              {ativos === 1 ? "1 filtro ativo" : `${ativos} filtros ativos`}
            </span>
          ) : null}
        </summary>
        <div className="px-5 pb-5">
          <FilterForm
            pathname={pathname}
            filters={filters}
            marcas={marcas}
            idPrefix="filtro-m"
          />
        </div>
      </details>

      <aside className="hidden w-[260px] flex-none rounded-[22px] border border-borda bg-white p-6 md:block">
        <FilterForm
          pathname={pathname}
          filters={filters}
          marcas={marcas}
          idPrefix="filtro-d"
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[15px] text-texto-2" aria-live="polite">
            {result.total === 1
              ? "1 produto encontrado"
              : `${result.total} produtos encontrados`}
          </p>
          <ActiveFilters
            pathname={pathname}
            filters={filters}
            marcas={marcas}
          />
        </div>

        {result.produtos.length === 0 ? (
          <EmptyState
            titulo={vazio.titulo}
            texto={vazio.texto}
            icone="busca"
            acao={
              temFiltro
                ? {
                    label: "Limpar filtros",
                    href: filtersHref(pathname, filters, {
                      marca: undefined,
                      minCents: undefined,
                      maxCents: undefined,
                      pagina: 1,
                    }),
                  }
                : { label: "Voltar para o início", href: "/" }
            }
          />
        ) : (
          <ul
            aria-label="Produtos"
            className={cn(
              "m-0 grid list-none grid-cols-2 gap-3 p-0",
              "md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] md:gap-5",
            )}
          >
            {result.produtos.map((p) => (
              <li key={p.id} className="ba-reveal flex">
                <ProductCard
                  href={`/p/${p.slug}`}
                  nome={p.nome}
                  categoria={p.categoria}
                  precoCents={p.precoCents}
                  precoDeCents={p.precoDeCents}
                  imagemUrl={p.imagemUrl ?? undefined}
                  imagemAlt={p.imagemAlt ?? undefined}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        )}

        <Pagination
          pathname={pathname}
          filters={filters}
          paginas={result.paginas}
        />
      </div>
    </div>
  );
}
