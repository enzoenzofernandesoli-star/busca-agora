import { STATUS_LABEL } from "@/components/admin/status-badge";

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
function statusLabel(value: unknown) {
  if (typeof value !== "string") return "Não informado";
  return Object.prototype.hasOwnProperty.call(STATUS_LABEL, value)
    ? STATUS_LABEL[value as keyof typeof STATUS_LABEL]
    : value.replace(/_/g, " ");
}
export function OrderTimeline({
  eventos,
}: {
  eventos: {
    id: string;
    evento: string;
    detalhe: Record<string, unknown>;
    created_at: string;
  }[];
}) {
  const sorted = [...eventos].sort(
    (left, right) => Date.parse(left.created_at) - Date.parse(right.created_at),
  );
  return (
    <ol className="flex flex-col font-sans">
      {sorted.map((event, index) => {
        const date = new Date(event.created_at);
        const validDate = !Number.isNaN(date.getTime());
        const title =
          event.evento === "status_changed"
            ? `Status: ${statusLabel(event.detalhe.de ?? event.detalhe.from)} → ${statusLabel(event.detalhe.para ?? event.detalhe.to)}`
            : event.evento
                .replace(/_/g, " ")
                .replace(/^./, (letter) => letter.toUpperCase());
        const notes = [event.detalhe.motivo, event.detalhe.observacao].filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        );
        return (
          <li key={event.id} className="relative pb-6 pl-7 last:pb-0">
            <span
              aria-hidden="true"
              className="absolute top-1 left-0 size-3 rounded-full bg-ultramar"
            />
            {index < sorted.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-4 bottom-0 left-[5px] w-0.5 bg-borda"
              />
            )}
            <time
              dateTime={validDate ? date.toISOString() : undefined}
              className="text-sm text-texto-2"
            >
              {validDate
                ? dateFormat.format(date).replace(",", "")
                : "Data indisponível"}
            </time>
            <p className="mt-1 text-[15px] font-bold text-noite">{title}</p>
            {notes.map((note, position) => (
              <p
                key={position}
                className="mt-1 text-sm whitespace-pre-wrap text-texto-2"
              >
                {note}
              </p>
            ))}
          </li>
        );
      })}
    </ol>
  );
}
