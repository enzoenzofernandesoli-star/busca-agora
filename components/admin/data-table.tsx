import type { ReactNode } from "react";

export function DataTable<T>({
  colunas,
  linhas,
  chave,
  vazio,
}: {
  colunas: {
    titulo: string;
    render: (linha: T) => ReactNode;
    className?: string;
  }[];
  linhas: T[];
  chave: (linha: T) => string;
  vazio: string;
}) {
  if (!linhas.length)
    return (
      <p className="rounded-[22px] border border-borda bg-white p-6 font-sans text-texto-2">
        {vazio}
      </p>
    );
  return (
    <table className="w-full border-separate border-spacing-0 font-sans">
      <caption className="sr-only">Lista de registros</caption>
      <thead className="sr-only md:not-sr-only md:table-header-group">
        <tr>
          {colunas.map((column, index) => (
            <th
              key={`${column.titulo}-${index}`}
              scope="col"
              className={`border-b border-borda bg-white px-5 py-4 text-left text-[13px] font-bold text-texto-2 ${column.className ?? ""}`}
            >
              {column.titulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="block md:table-row-group">
        {linhas.map((row) => (
          <tr
            key={chave(row)}
            className="mb-3 block overflow-hidden rounded-[22px] border border-borda bg-white md:table-row md:rounded-none md:border-0"
          >
            {colunas.map((column, index) => (
              <td
                key={`${column.titulo}-${index}`}
                className={`flex min-w-0 flex-wrap items-start justify-between gap-2 border-b border-borda px-5 py-4 text-[15px] text-noite last:border-0 md:table-cell md:last:border-b ${column.className ?? ""}`}
              >
                <span className="text-[13px] font-bold text-texto-2 md:hidden">
                  {column.titulo}:
                </span>
                <div className="min-w-0 break-words">{column.render(row)}</div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
