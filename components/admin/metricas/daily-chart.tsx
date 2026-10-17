import type { DailyPoint } from "@/lib/metrics/types";

export function DailyChart({ days }: { days: DailyPoint[] }) {
  const sorted = [...days].sort((a, b) => a.data.localeCompare(b.data));
  // At least 2 and even, so the three grid labels (0, half, top) differ.
  const peak = Math.max(2, ...sorted.flatMap((day) => [day.views, day.vendas]));
  const maximum = Math.ceil(peak / 2) * 2;
  const label = (date: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(`${date}T12:00:00-03:00`));
  const x = (index: number) =>
    sorted.length === 1
      ? 340
      : 40 + (index * 600) / Math.max(1, sorted.length - 1);
  const y = (value: number) => 210 - (value * 180) / maximum;
  return (
    <section className="min-w-0 rounded-[22px] border border-borda bg-fundo p-5 text-noite md:p-7">
      <h2 className="font-display text-lg font-bold">
        Views e compras por dia
      </h2>
      <p className="mt-2 text-sm text-texto-2">
        <span className="font-bold text-ultramar">Linha contínua: views</span> ·{" "}
        <span className="font-bold text-rosa-ink">
          Linha tracejada: compras
        </span>
      </p>
      {!sorted.length ? (
        <p className="mt-6 text-sm text-texto-2">
          Nenhum dado diário neste período.
        </p>
      ) : (
        <>
          <svg
            viewBox="0 0 680 250"
            role="img"
            aria-label="Views e compras por dia. Valores disponíveis na tabela abaixo."
            className="mt-5 h-auto w-full overflow-visible"
          >
            {[0, 0.5, 1].map((fraction) => (
              <g key={fraction}>
                <line
                  x1={40}
                  x2={640}
                  y1={y(maximum * fraction)}
                  y2={y(maximum * fraction)}
                  className="stroke-borda"
                />
                <text
                  x={32}
                  y={y(maximum * fraction) + 4}
                  textAnchor="end"
                  className="fill-texto-2 text-[12px]"
                >
                  {Math.round(maximum * fraction).toLocaleString("pt-BR")}
                </text>
              </g>
            ))}
            {(["views", "vendas"] as const).map((key) => (
              <g
                key={key}
                className={
                  key === "views" ? "stroke-ultramar" : "stroke-rosa-ink"
                }
              >
                <polyline
                  points={sorted
                    .map((day, index) => `${x(index)},${y(day[key])}`)
                    .join(" ")}
                  fill="none"
                  strokeWidth={3}
                  strokeDasharray={key === "vendas" ? "6 4" : undefined}
                />
                {sorted.map((day, index) => (
                  <circle
                    key={day.data}
                    cx={x(index)}
                    cy={y(day[key])}
                    r={3}
                    className={
                      key === "views" ? "fill-ultramar" : "fill-rosa-ink"
                    }
                  >
                    <title>
                      {`${label(day.data)}: ${day[key].toLocaleString("pt-BR")} ${key === "views" ? "views" : "compras"}`}
                    </title>
                  </circle>
                ))}
              </g>
            ))}
            {sorted
              .filter(
                (_, index) =>
                  index === 0 ||
                  index === sorted.length - 1 ||
                  index % Math.max(1, Math.ceil(sorted.length / 5)) === 0,
              )
              .map((day) => (
                <text
                  key={day.data}
                  x={x(sorted.indexOf(day))}
                  y={238}
                  textAnchor="middle"
                  className="fill-texto-2 text-[12px]"
                >
                  {label(day.data)}
                </text>
              ))}
          </svg>
          <details className="mt-3 text-sm">
            <summary className="flex min-h-11 cursor-pointer items-center font-bold text-ultramar">
              Ver dados por dia
            </summary>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-left">
                <caption className="sr-only">
                  Valores diários de views e compras
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="py-2">
                      Dia
                    </th>
                    <th scope="col">Views</th>
                    <th scope="col">Compras</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((day) => (
                    <tr key={day.data} className="border-t border-borda">
                      <th scope="row" className="py-2">
                        {label(day.data)}
                      </th>
                      <td>{day.views.toLocaleString("pt-BR")}</td>
                      <td>{day.vendas.toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
