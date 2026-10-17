import { formatBRL } from "@/lib/format";
import type { ForecastResult } from "@/lib/metrics/types";

export function ForecastPanel({
  result,
  horizonDays = 7,
  searchParams = new URLSearchParams(),
  action = "/admin/metricas",
}: {
  result: ForecastResult;
  horizonDays?: number;
  searchParams?: URLSearchParams;
  action?: string;
}) {
  const number = (value: number) =>
    new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
  return (
    <section className="rounded-[22px] border border-borda bg-fundo p-5 text-noite md:p-7">
      <h2 className="font-display text-lg font-bold">Previsão</h2>
      <form
        method="get"
        action={action}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        {Array.from(searchParams.entries())
          .filter(([key]) => key !== "prever")
          .map(([key, value], index) => (
            <input
              key={`${key}-${index}`}
              type="hidden"
              name={key}
              value={value}
            />
          ))}
        <label className="flex flex-wrap items-center gap-2 text-sm font-bold">
          Prever os próximos
          <input
            name="prever"
            type="number"
            min={1}
            max={365}
            step={1}
            required
            defaultValue={horizonDays}
            className="min-h-11 w-20 rounded-[14px] border border-borda bg-fundo px-3"
          />
          dias
        </label>
        <button className="min-h-11 rounded-[14px] bg-ultramar px-4 text-sm font-bold text-lavanda hover:bg-ultramar-700">
          Calcular previsão
        </button>
      </form>
      {!result.suficiente ? (
        <div className="mt-5 rounded-[16px] border border-borda p-4">
          <p className="font-bold">Dados insuficientes para estimar</p>
          <p className="mt-1 text-sm text-texto-2">{result.motivo}</p>
        </div>
      ) : (
        <>
          <dl className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { label: "Views previstas", range: result.views, format: number },
              {
                label: "Vendas previstas",
                range: result.vendas,
                format: number,
              },
              {
                label: "Faturamento previsto",
                range: result.faturamento,
                format: formatBRL,
              },
            ].map(({ label, range, format }) => (
              <div
                key={label}
                className="min-w-0 rounded-[16px] border border-borda p-4"
              >
                <dt className="text-sm text-texto-2">{label}</dt>
                <dd className="mt-2 font-display text-2xl font-extrabold break-words">
                  {format(range.previsto)}
                </dd>
                <dd className="mt-2 text-xs text-texto-2">
                  Faixa: {format(range.minimo)} a {format(range.maximo)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-texto-2">
            Estimativa para {result.dias} dias, baseada nas médias de dias úteis
            e fins de semana. Faixa de um desvio padrão; não é garantia de
            resultado.
          </p>
        </>
      )}
    </section>
  );
}
