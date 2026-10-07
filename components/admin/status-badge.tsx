export const STATUS_LABEL = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  invoiced: "Nota emitida",
  label_ready: "Etiqueta pronta",
  printed: "Impresso",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Estornado",
} as const;

export function StatusBadge({ status }: { status: keyof typeof STATUS_LABEL }) {
  const color =
    status === "pending_payment"
      ? "bg-[#FFF7E0] text-[#8A5A00]"
      : status === "shipped"
        ? "bg-ciano-tile text-ciano-ink"
        : status === "delivered"
          ? "bg-[#ECFDF3] text-estoque"
          : status === "canceled" || status === "refunded"
            ? "bg-rosa-tile text-rosa-ink"
            : "bg-ultramar-50 text-ultramar";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 font-sans text-[13px] font-bold ${color}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
