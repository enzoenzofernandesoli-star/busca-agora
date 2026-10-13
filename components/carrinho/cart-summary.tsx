import type { ReactNode } from "react";
import { ExchangeIcon, ReceiptIcon, TruckIcon } from "@/components/loja/icons";
import { formatBRL } from "@/lib/format";

export function CartSummary({
  subtotalCents,
  freteCents,
  quantidadeItens,
  economiaCents,
  children,
}: {
  subtotalCents: number;
  freteCents?: number | null;
  quantidadeItens: number;
  economiaCents?: number;
  children?: ReactNode;
}) {
  const hasShipping = freteCents !== undefined && freteCents !== null;
  const totalCents = subtotalCents + (freteCents ?? 0);
  return (
    <div className="relative isolate flex flex-col gap-5 overflow-hidden rounded-[22px] border border-borda bg-white p-6 font-sans md:rounded-[28px]">
      {/* Colour bar on top and a pale ring in the corner (same mark as the
          product buy card); dark text on the pale ring keeps its contrast. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-ultramar"
      />
      <span
        aria-hidden="true"
        className="ba-drift pointer-events-none absolute -top-24 -right-24 -z-10 size-44 rounded-full border-[28px] border-ultramar-50"
      />
      <h2 className="font-display text-2xl font-bold text-noite">Resumo</h2>
      <dl className="flex flex-col gap-3 text-[15px] text-noite">
        <div className="flex items-center justify-between gap-3">
          <dt>Produtos ({quantidadeItens})</dt>
          <dd>{formatBRL(subtotalCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt>Frete</dt>
          <dd className={hasShipping ? "text-noite" : "text-texto-2"}>
            {hasShipping ? formatBRL(freteCents) : "Calcule abaixo"}
          </dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-borda pt-4">
          <dt className="font-display font-bold">Total</dt>
          <dd className="font-display text-[28px] font-extrabold">
            {formatBRL(totalCents)}
            {!hasShipping && (
              <span className="ml-2 font-sans text-sm font-normal text-texto-2">
                + frete
              </span>
            )}
          </dd>
        </div>
        {economiaCents !== undefined && economiaCents > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 font-bold text-oferta">
            <dt>Você economiza</dt>
            <dd>{formatBRL(economiaCents)}</dd>
          </div>
        )}
      </dl>
      <ul
        aria-label="Garantias da loja"
        className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-texto-2"
      >
        {[
          { text: "Nota fiscal em todo pedido", Icon: ReceiptIcon },
          { text: "Despacho em até 24 h", Icon: TruckIcon },
          { text: "Troca em até 7 dias", Icon: ExchangeIcon },
        ].map(({ text, Icon }) => (
          <li key={text} className="flex items-center gap-2">
            <Icon size={18} className="shrink-0 text-ultramar" />
            {text}
          </li>
        ))}
      </ul>
      <p className="text-sm text-texto-2">
        em até 12x no cartão · ou no Pix, aprovado na hora
      </p>
      {children}
    </div>
  );
}
