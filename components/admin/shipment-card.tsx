type ShipmentCardProps = {
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
  servico: string | null;
  transportadora: string | null;
  rastreio: string | null;
  rastreioUrl: string | null;
  meStatus: string | null;
  etiquetaUrl: string | null;
  resumoUrl: string | null;
  notaManual: boolean;
  erroEtiqueta: string | null;
};
const steps = ["Etiqueta comprada", "Impresso", "Postado", "Entregue"];
const completed: Record<ShipmentCardProps["status"], number> = {
  pending_payment: 0,
  paid: 0,
  invoiced: 0,
  label_ready: 1,
  printed: 2,
  shipped: 3,
  delivered: 4,
  canceled: 0,
  refunded: 0,
};
const providerStatus: Record<string, string> = {
  pending: "Aguardando pagamento no Melhor Envio",
  released: "Etiqueta liberada",
  posted: "Postado",
  delivered: "Entregue",
  canceled: "Cancelado",
};
function safeUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}
const linkClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-ultramar px-5 font-display text-sm font-bold text-white hover:bg-ultramar-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar";
export function ShipmentCard(props: ShipmentCardProps) {
  const canceled = props.status === "canceled" || props.status === "refunded";
  const tracking = safeUrl(props.rastreioUrl),
    label = safeUrl(props.etiquetaUrl),
    summary = safeUrl(props.resumoUrl);
  return (
    <section className="rounded-[22px] border border-borda bg-white p-5 text-noite md:p-7">
      <h2 className="flex items-center gap-3 font-display text-xl font-extrabold">
        <svg
          aria-hidden="true"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h12v12H3V6Zm12 4h4l3 4v4h-7" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
        Envio
      </h2>
      <p className="mt-3 text-texto-2">
        {props.servico ?? "Serviço não informado"} ·{" "}
        {props.transportadora ?? "Transportadora não informada"}
      </p>
      {canceled && (
        <p className="mt-4 rounded-[14px] bg-rosa-tile p-4 font-bold text-rosa-ink">
          Pedido cancelado: não envie.
        </p>
      )}
      <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const done = !canceled && index < completed[props.status];
          return (
            <li
              key={step}
              className={`flex items-center gap-2 rounded-[14px] border p-3 text-sm ${done ? "border-ultramar bg-ultramar-50 font-bold text-ultramar" : "border-borda text-texto-2"}`}
            >
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center"
              >
                {done ? (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span>
                {step}
                <span className="sr-only">
                  {done ? ": concluído" : ": não concluído"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      {props.notaManual && (
        <p className="mt-4 rounded-[14px] border border-rosa-ink bg-rosa-tile p-4 font-bold text-rosa-ink">
          Emita a nota fiscal deste pedido à mão antes de despachar.
        </p>
      )}
      {props.meStatus && (
        <p className="mt-4 text-sm text-texto-2">
          {providerStatus[props.meStatus] ?? props.meStatus}
        </p>
      )}
      {props.rastreio && (
        <p className="mt-5 font-display text-xl font-bold break-all select-text">
          {props.rastreio}
        </p>
      )}
      {tracking && (
        <a
          className="mt-2 inline-flex min-h-11 items-center font-bold text-ultramar underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
          href={tracking}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver rastreio<span className="sr-only"> (abre em nova aba)</span>
        </a>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        {label ? (
          <a
            className={linkClass}
            href={label}
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            Baixar etiqueta (PDF)
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        ) : (
          <p className="text-texto-2">Etiqueta ainda não gerada</p>
        )}
        {summary && (
          <a
            className={linkClass}
            href={summary}
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            Baixar resumo (PDF)
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        )}
      </div>
      {props.erroEtiqueta && (
        <div className="mt-5 rounded-[14px] bg-rosa-tile p-4 text-rosa-ink">
          <p className="font-bold break-words">
            A etiqueta não saiu: {props.erroEtiqueta}
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            Confira o saldo da carteira do Melhor Envio e use Tentar de novo na
            fila abaixo.
          </p>
        </div>
      )}
    </section>
  );
}
