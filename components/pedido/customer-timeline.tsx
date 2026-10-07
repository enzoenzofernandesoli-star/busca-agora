import type { CustomerEvent } from "@/lib/orders/customer";

const quando = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

/** Customer-facing history (already filtered by lib/orders/customer). */
export function CustomerTimeline({ eventos }: { eventos: CustomerEvent[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {eventos.map((e) => (
        <li key={e.id} className="flex flex-wrap items-baseline gap-x-3">
          <b className="text-[15px] text-noite">{e.texto}</b>
          <time dateTime={e.quando} className="text-sm text-texto-2">
            {quando.format(new Date(e.quando))}
          </time>
        </li>
      ))}
    </ol>
  );
}
