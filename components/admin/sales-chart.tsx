import { formatBRL } from "@/lib/format";

export type SalesDay = { dia: string; totalCents: number; pedidos: number };
function dayLabel(day: string, weekday = false): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...(weekday ? { weekday: "short" as const } : {}),
    day: "2-digit",
    month: "2-digit",
  })
    .format(new Date(`${day}T12:00:00-03:00`))
    .replace(".", "");
}
export function SalesChart({
  dias,
  titulo = "Vendas dos últimos 14 dias",
}: {
  dias: SalesDay[];
  titulo?: string;
}) {
  let total = 0;
  for (const day of dias) {
    if (
      !Number.isSafeInteger(day.totalCents) ||
      day.totalCents < 0 ||
      !Number.isSafeInteger(total + day.totalCents)
    )
      throw new TypeError("Vendas devem ser centavos inteiros seguros");
    total += day.totalCents;
  }
  const best = dias.reduce<SalesDay | null>(
    (winner, day) =>
      !winner || day.totalCents > winner.totalCents ? day : winner,
    null,
  );
  const maximum = best?.totalCents ?? 0;
  const summary = `${titulo}: total ${formatBRL(total)}${maximum > 0 && best ? `, melhor dia ${dayLabel(best.dia)} com ${formatBRL(maximum)}` : ", ainda sem vendas nesse período"}`;
  return (
    <section className="min-w-0 rounded-[22px] border border-borda bg-white p-5 text-noite shadow-[0_1px_2px_rgba(10,15,61,.06)] md:rounded-[28px] md:p-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{titulo}</h2>
        <p className="font-display text-xl font-extrabold">
          {formatBRL(total)}
        </p>
      </header>
      <div
        role="img"
        aria-label={summary}
        className="relative mt-8 flex h-[220px] items-end gap-1 sm:gap-2"
      >
        {maximum === 0 && (
          <p className="pointer-events-none absolute inset-x-0 top-12 text-center text-sm text-texto-2">
            Ainda sem vendas nesse período.
          </p>
        )}
        {dias.map((day, index) => (
          <div
            key={day.dia}
            tabIndex={0}
            aria-label={`${dayLabel(day.dia, true)}: ${formatBRL(day.totalCents)}, ${day.pedidos} pedidos`}
            className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end rounded-t-[6px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
          >
            <div
              className={`pointer-events-none absolute bottom-[140px] z-10 w-40 rounded-[14px] bg-noite p-3 text-center text-xs text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100 ${index < 3 ? "left-0" : index >= dias.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
            >
              <p className="font-bold">{dayLabel(day.dia, true)}</p>
              <p className="mt-1">{formatBRL(day.totalCents)}</p>
              <p>
                {day.pedidos} {day.pedidos === 1 ? "pedido" : "pedidos"}
              </p>
            </div>
            <div
              aria-hidden="true"
              style={{
                height:
                  day.totalCents > 0
                    ? Math.max(4, (day.totalCents / maximum) * 168)
                    : 1,
              }}
              className={`w-full rounded-t-[6px] ${day.totalCents === 0 ? "bg-borda" : index === dias.length - 1 ? "border border-noite bg-lima" : "bg-ultramar"}`}
            />
            <span
              aria-hidden="true"
              className={`mt-3 h-5 font-sans text-[10px] whitespace-nowrap text-texto-2 sm:text-xs ${index % 2 !== 0 ? "invisible sm:visible" : ""}`}
            >
              {dayLabel(day.dia)}
            </span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Valor</th>
            <th scope="col">Pedidos</th>
          </tr>
        </thead>
        <tbody>
          {dias.map((day) => (
            <tr key={day.dia}>
              <th scope="row">{dayLabel(day.dia, true)}</th>
              <td>{formatBRL(day.totalCents)}</td>
              <td>{day.pedidos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
