import { formatBRL } from "@/lib/format";
import type { ProductMetricsRow, SortKey } from "@/lib/metrics/types";

const percent = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "percent",
        maximumFractionDigits: 2,
      }).format(value);
const columns: {
  key: SortKey;
  label: string;
  value: (row: ProductMetricsRow) => string;
}[] = [
  { key: "nome", label: "Produto", value: (row) => row.nome },
  {
    key: "views",
    label: "Views",
    value: (row) => row.views.toLocaleString("pt-BR"),
  },
  {
    key: "visitantes",
    label: "Visitantes",
    value: (row) => row.visitantes.toLocaleString("pt-BR"),
  },
  {
    key: "carrinho",
    label: "Carrinho",
    value: (row) =>
      `${row.carrinho.toLocaleString("pt-BR")} · ${percent(row.carrinhoTaxa)}`,
  },
  {
    key: "checkout",
    label: "Checkout",
    value: (row) =>
      `${row.checkout.toLocaleString("pt-BR")} · ${percent(row.checkoutTaxa)}`,
  },
  {
    key: "compras",
    label: "Compras",
    value: (row) => row.compras.toLocaleString("pt-BR"),
  },
  {
    key: "conversao",
    label: "Conversão",
    value: (row) => percent(row.conversao),
  },
  {
    key: "faturamento",
    label: "Faturamento",
    value: (row) => formatBRL(row.faturamentoCents),
  },
  {
    key: "margem",
    label: "Margem",
    value: (row) => formatBRL(row.margemCents),
  },
];

export function ProductsTable({
  rows,
  searchParams = new URLSearchParams(),
}: {
  rows: ProductMetricsRow[];
  searchParams?: URLSearchParams;
}) {
  const order = searchParams.get("ordem") ?? "views";
  const direction = searchParams.get("dir") === "asc" ? "asc" : "desc";
  function sortHref(key: SortKey): string {
    const params = new URLSearchParams(searchParams);
    params.set("ordem", key);
    params.set("dir", order === key && direction === "desc" ? "asc" : "desc");
    return `/admin/metricas?${params}`;
  }
  return (
    <section className="min-w-0 font-sans text-noite">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">
          Desempenho por produto
        </h2>
        <a
          href={`/admin/metricas/csv${searchParams.size ? `?${searchParams}` : ""}`}
          className="inline-flex min-h-11 items-center rounded-[14px] border border-ultramar px-4 text-sm font-bold text-ultramar hover:bg-lavanda"
        >
          Exportar CSV
        </a>
      </header>
      {!rows.length ? (
        <p className="rounded-[22px] border border-borda bg-fundo p-5 text-texto-2">
          Nenhum produto com dados neste período.
        </p>
      ) : (
        <>
          <nav
            aria-label="Ordenar produtos no celular"
            className="mb-4 flex flex-wrap gap-2 xl:hidden"
          >
            {columns.map((column) => (
              <a
                key={column.key}
                href={sortHref(column.key)}
                aria-current={order === column.key ? "true" : undefined}
                className={`inline-flex min-h-11 items-center rounded-[14px] border px-3 text-sm ${order === column.key ? "border-ultramar font-bold text-ultramar" : "border-borda text-texto-2"}`}
              >
                {column.label}
                {order === column.key
                  ? direction === "asc"
                    ? " ↑"
                    : " ↓"
                  : ""}
              </a>
            ))}
          </nav>
          <div className="hidden overflow-x-auto rounded-[22px] border border-borda xl:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Métricas por produto; carrinho sobre visitantes e checkout sobre
                carrinho.
              </caption>
              <thead className="bg-fundo text-texto-2">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        order === column.key
                          ? direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className="px-3 py-2"
                    >
                      <a
                        href={sortHref(column.key)}
                        className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap"
                      >
                        {column.label}
                        {order === column.key && (
                          <span aria-hidden="true">
                            {direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </a>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.productId} className="border-t border-borda">
                    {columns.map((column) => (
                      <td key={column.key} className="px-3 py-4 tabular-nums">
                        {column.key === "nome" ? (
                          <a
                            className="inline-flex min-h-11 items-center font-bold text-ultramar underline-offset-4 hover:underline"
                            href={`/admin/metricas/${encodeURIComponent(row.slug)}`}
                          >
                            {row.nome}
                          </a>
                        ) : (
                          column.value(row)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="grid gap-3 xl:hidden">
            {rows.map((row) => (
              <li
                key={row.productId}
                className="rounded-[22px] border border-borda bg-fundo p-5"
              >
                <a
                  href={`/admin/metricas/${encodeURIComponent(row.slug)}`}
                  className="inline-flex min-h-11 items-center font-display font-bold text-ultramar underline-offset-4 hover:underline"
                >
                  {row.nome}
                </a>
                <dl className="mt-3 grid grid-cols-2 gap-4">
                  {columns.slice(1).map((column) => (
                    <div key={column.key} className="min-w-0">
                      <dt className="text-xs text-texto-2">{column.label}</dt>
                      <dd className="mt-1 font-bold break-words tabular-nums">
                        {column.value(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-3 text-xs text-texto-2">
        Carrinho: % dos visitantes. Checkout: % dos carrinhos. Conversão:
        compras por visitante.
      </p>
    </section>
  );
}
