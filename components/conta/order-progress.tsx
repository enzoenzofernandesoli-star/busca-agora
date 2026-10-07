import type { Database } from "@/lib/db/types";
type OrderStatus = Database["public"]["Enums"]["order_status"];
export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "canceled" || status === "refunded")
    return (
      <div className="flex items-start gap-3 rounded-[22px] bg-rosa-tile p-6 font-sans text-rosa-ink">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6m0-6-6 6" />
        </svg>
        <p>
          {status === "canceled"
            ? "Pedido cancelado. Se você pagou, o valor volta pela mesma forma de pagamento."
            : "Pagamento estornado. O valor volta pela mesma forma de pagamento em até 2 faturas (cartão) ou na hora (Pix)."}
        </p>
      </div>
    );
  const current =
    status === "delivered"
      ? 3
      : status === "shipped"
        ? 2
        : status === "pending_payment"
          ? 0
          : 1;
  return (
    <ol
      aria-label="Andamento do pedido"
      className="flex flex-col gap-0 rounded-[22px] border border-borda bg-white p-6 font-sans sm:flex-row"
    >
      {["Pedido feito", "Pagamento aprovado", "Enviado", "Entregue"].map(
        (label, index) => (
          <li
            key={label}
            aria-current={index === current ? "step" : undefined}
            className="relative flex min-h-20 items-start gap-3 pl-0 sm:min-h-0 sm:flex-1 sm:flex-col sm:items-center sm:text-center"
          >
            {index < 3 && (
              <span
                aria-hidden="true"
                className={`absolute top-10 bottom-0 left-[19px] w-0.5 sm:top-[19px] sm:bottom-auto sm:left-1/2 sm:h-0.5 sm:w-full ${index < current ? "bg-ultramar" : "bg-borda"}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full ${index <= current ? "bg-ultramar text-white" : "border-2 border-borda bg-white text-texto-2"} ${index === current ? "ring-4 ring-ultramar-50" : ""}`}
            >
              {index < current ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4 10-10" />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`pt-2 text-sm ${index === current ? "font-bold text-noite" : "text-texto-2"}`}
            >
              {label}
              <span className="sr-only">
                :{" "}
                {index < current
                  ? "concluída"
                  : index === current
                    ? "etapa atual"
                    : "pendente"}
              </span>
            </span>
          </li>
        ),
      )}
    </ol>
  );
}
