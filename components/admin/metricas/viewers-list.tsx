import { PhoneIcon, UserIcon } from "@/components/loja/icons";
import type { ViewerRow } from "@/lib/metrics/types";

export function ViewersList({ rows }: { rows: ViewerRow[] }) {
  return (
    <section className="rounded-[22px] border border-borda bg-fundo p-5 text-noite md:p-7">
      <h2 className="font-display text-lg font-bold">Quem viu</h2>
      {!rows.length ? (
        <p className="mt-4 text-sm text-texto-2">
          Nenhuma visita registrada neste período.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-borda">
          {rows.map((row) => (
            <li
              key={row.sessionId}
              className="grid min-w-0 gap-3 py-4 sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-bold">
                  <UserIcon size={18} className="shrink-0 text-ultramar" />
                  {row.cliente ? (
                    <a
                      href={`/admin/clientes/${encodeURIComponent(row.cliente.id)}`}
                      className="inline-flex min-h-11 items-center break-words text-ultramar underline-offset-4 hover:underline"
                    >
                      {row.cliente.nome}
                    </a>
                  ) : (
                    `Visitante #${row.sessionId.slice(0, 6)}`
                  )}
                </p>
                <p className="mt-1 text-sm break-words text-texto-2">
                  Origem: {row.origem || "Direto"} ·{" "}
                  {row.visitas.toLocaleString("pt-BR")}{" "}
                  {row.visitas === 1 ? "visita" : "visitas"}
                </p>
                <p className="mt-1 text-xs text-texto-2">
                  Primeira visita:{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(row.primeiraVisita))}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1 rounded-full border border-borda px-3 py-2">
                  {row.device === "mobile" && <PhoneIcon size={14} />}
                  {row.device === "mobile" ? "Celular" : "Computador"}
                </span>
                <span className="rounded-full bg-lavanda px-3 py-2">
                  {row.voltou ? "Voltou" : "Não voltou"}
                </span>
                <span className="rounded-full border border-borda px-3 py-2">
                  {row.comprou ? "Comprou" : "Não comprou"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
