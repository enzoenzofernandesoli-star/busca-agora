import {
  ExchangeIcon,
  PixIcon,
  ReceiptIcon,
  TruckIcon,
} from "@/components/loja/icons";
import { cn } from "@/lib/utils";

// Store promises (not product claims): the same four for every product; the
// category only changes the look (docs/design/produto-prompts.md, G50).
const vantagens = [
  { titulo: "Nota fiscal", texto: "Em todo pedido", Icon: ReceiptIcon },
  { titulo: "Despacho em 24 h", texto: "Depois do pagamento", Icon: TruckIcon },
  {
    titulo: "Troca em 7 dias",
    texto: "Direito de arrependimento",
    Icon: ExchangeIcon,
  },
  { titulo: "Pix na hora", texto: "Aprovação imediata", Icon: PixIcon },
];

export function ProductPerks({
  categoria,
}: {
  categoria: "eletronicos" | "cosmeticos";
}) {
  const eletronicos = categoria === "eletronicos";
  return (
    <ul
      aria-label="Vantagens desta compra"
      className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 md:gap-3"
    >
      {vantagens.map(({ titulo, texto, Icon }, i) => (
        <li
          key={titulo}
          className={cn(
            // Phone: icon above the text (two narrow columns); wider: side by side.
            "flex flex-col items-start gap-2 rounded-[18px] border-[1.5px] bg-white p-3 motion-safe:animate-[ba-reveal_420ms_cubic-bezier(.2,.8,.2,1)_both] sm:flex-row sm:items-center sm:gap-3 sm:p-3.5",
            eletronicos ? "border-ciano" : "border-rosa",
          )}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-[14px]",
              eletronicos
                ? "bg-ciano-tile text-ciano-ink"
                : "bg-rosa-tile text-rosa-ink",
            )}
          >
            <Icon size={22} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[15px] leading-tight font-bold text-noite">
              {titulo}
            </span>
            <span className="text-[13px] leading-snug text-texto-2">
              {texto}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
