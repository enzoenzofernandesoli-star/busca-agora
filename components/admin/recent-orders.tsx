import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatBRL } from "@/lib/format";

export type RecentOrder = {
  numero: string;
  cliente: string;
  totalCents: number;
  status:
    | "pending_payment"
    | "paid"
    | "invoiced"
    | "label_ready"
    | "printed"
    | "shipped"
    | "delivered"
    | "canceled"
    | "refunded";
  criadoEm: string;
  itens: number;
};
const localDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function calendarDay(date: Date): number {
  const parts = localDate.formatToParts(date);
  const value = (key: string) =>
    Number(parts.find((part) => part.type === key)?.value);
  return Date.UTC(value("year"), value("month") - 1, value("day")) / 86400000;
}
export function tempoRelativo(criadoEm: string, agora: string): string {
  const created = new Date(criadoEm),
    now = new Date(agora);
  const elapsed = now.getTime() - created.getTime();
  if (!Number.isFinite(elapsed)) return "Data indisponível";
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const days = calendarDay(now) - calendarDay(created);
  if (days === 0) return `há ${Math.floor(minutes / 60)} h`;
  if (days === 1) return "ontem";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  }).format(created);
}
export function RecentOrders({
  pedidos,
  agora,
}: {
  pedidos: RecentOrder[];
  agora: string;
}) {
  return (
    <section className="min-w-0 rounded-[22px] border border-borda bg-white p-5 text-noite md:rounded-[28px] md:p-7">
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Últimos pedidos</h2>
        <Link
          href="/admin/pedidos"
          className="inline-flex min-h-11 items-center font-bold text-ultramar underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
        >
          Ver todos
        </Link>
      </header>
      {pedidos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-texto-2">
          <svg
            aria-hidden="true"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10M7.5 4.5l9 5" />
          </svg>
          <p>
            Nenhum pedido ainda. Quando alguém comprar, aparece aqui na hora.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {pedidos.map((order) => {
            const elapsed = Date.parse(agora) - Date.parse(order.criadoEm);
            const fresh =
              Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 10 * 60000;
            const firstName = order.cliente.trim().split(/\s+/)[0] || "Cliente";
            return (
              <li key={order.numero}>
                <Link
                  href={`/admin/pedidos/${encodeURIComponent(order.numero)}`}
                  className={`flex min-h-14 flex-col gap-x-3 gap-y-2 rounded-[14px] p-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar lg:grid lg:grid-cols-[minmax(100px,1fr)_minmax(60px,1fr)_auto_auto_auto_auto] lg:items-center ${fresh ? "bg-lima/20" : "bg-fundo hover:bg-ultramar-50"}`}
                >
                  <div className="flex items-center justify-between gap-3 lg:contents">
                    <span className="flex min-w-0 items-center gap-2 font-display text-sm font-bold lg:order-1">
                      {fresh && (
                        <>
                          <span
                            aria-hidden="true"
                            className="size-2 shrink-0 rounded-full bg-lima motion-safe:animate-pulse"
                          />
                          <span className="sr-only">(novo) </span>
                        </>
                      )}
                      {order.numero}
                    </span>
                    <span className="shrink-0 text-[10px] text-texto-2 lg:order-3 lg:text-xs">
                      {order.itens} {order.itens === 1 ? "item" : "itens"}
                    </span>
                    <span className="font-display text-sm font-bold lg:order-4">
                      {formatBRL(order.totalCents)}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 lg:contents">
                    <span className="min-w-0 flex-1 truncate text-xs lg:order-2 lg:text-sm">
                      {firstName}
                    </span>

                    <span className="shrink-0 lg:order-5">
                      <StatusBadge status={order.status} />
                    </span>
                    <time
                      dateTime={order.criadoEm}
                      className="shrink-0 text-[10px] text-texto-2 lg:order-6 lg:justify-self-end lg:text-xs"
                    >
                      {tempoRelativo(order.criadoEm, agora)}
                    </time>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
