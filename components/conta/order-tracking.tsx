import type { Database } from "@/lib/db/types";
type OrderStatus = Database["public"]["Enums"]["order_status"];
export function OrderTracking({
  transportadora,
  servico,
  rastreio,
  rastreioUrl,
  status,
}: {
  transportadora: string | null;
  servico: string | null;
  rastreio: string | null;
  rastreioUrl: string | null;
  status: OrderStatus;
}) {
  if (status === "canceled" || status === "refunded") return null;
  if (!rastreio)
    return (
      <div className="flex items-start gap-3 rounded-[22px] border border-borda bg-white p-6 font-sans text-texto-2">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M1 3h13v14H1zM14 8h4l4 4v5h-8" />
          <circle cx="5" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
        <p>
          {status === "delivered" || status === "shipped"
            ? "Entrega feita pela transportadora."
            : "O código de rastreio aparece aqui quando o pedido sair."}
        </p>
      </div>
    );
  const safeUrl =
    rastreioUrl && /^https?:\/\//i.test(rastreioUrl) ? rastreioUrl : null;
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-ciano-tile p-6 font-sans text-ciano-ink">
      <h2 className="font-display text-lg font-bold">Rastreio</h2>
      <p>{[transportadora, servico].filter(Boolean).join(" · ")}</p>
      <p className="font-display text-xl font-bold break-all select-all">
        {rastreio}
      </p>
      {safeUrl && (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center self-start rounded-[14px] bg-ultramar px-5 font-display font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
        >
          Rastrear na transportadora
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      )}
    </section>
  );
}
