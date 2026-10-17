import { formatBRL } from "@/lib/format";
import type { OriginGroup, OriginRow } from "@/lib/metrics/types";

const groups: { key: OriginGroup; label: string }[] = [
  { key: "redes", label: "Redes sociais" },
  { key: "influenciador", label: "Influenciador / ref" },
  { key: "anuncio", label: "Anúncio" },
  { key: "direto", label: "Direto" },
  { key: "outros", label: "Outros" },
];

export function OriginsBreakdown({ rows }: { rows: OriginRow[] }) {
  return (
    <section className="rounded-[22px] border border-borda bg-fundo p-5 text-noite md:p-7">
      <h2 className="font-display text-lg font-bold">
        Origens das visitas e das vendas
      </h2>
      {!rows.length ? (
        <p className="mt-4 text-sm text-texto-2">
          Nenhuma origem registrada neste período.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {groups.map(({ key, label }) => {
            const sources = rows.filter((row) => row.grupo === key);
            const totals = sources.reduce(
              (sum, row) => ({
                visitas: sum.visitas + row.visitas,
                vendas: sum.vendas + row.vendas,
                revenue: sum.revenue + row.faturamentoCents,
              }),
              { visitas: 0, vendas: 0, revenue: 0 },
            );
            return (
              <section
                key={key}
                className="min-w-0 rounded-[16px] border border-borda p-4"
              >
                <h3 className="font-bold">{label}</h3>
                <p className="mt-2 text-sm text-texto-2">
                  {totals.visitas.toLocaleString("pt-BR")} visitas ·{" "}
                  {totals.vendas.toLocaleString("pt-BR")} vendas
                </p>
                <p className="mt-1 font-display font-bold">
                  {formatBRL(totals.revenue)}
                </p>
                <ul className="mt-3 space-y-3 text-sm">
                  {sources.map((row, index) => (
                    <li
                      key={`${row.detalhe}-${index}`}
                      className="border-t border-borda pt-3 break-words"
                    >
                      <p className="font-bold">{row.detalhe}</p>
                      <p className="mt-1 text-texto-2">
                        {row.visitas.toLocaleString("pt-BR")} visitas ·{" "}
                        {row.vendas.toLocaleString("pt-BR")} vendas ·{" "}
                        {formatBRL(row.faturamentoCents)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
