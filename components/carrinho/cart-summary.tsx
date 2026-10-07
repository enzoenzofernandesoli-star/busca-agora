import type { ReactNode } from "react";
import { formatBRL } from "@/lib/format";

export function CartSummary({
  subtotalCents,
  freteCents,
  quantidadeItens,
  children,
}: {
  subtotalCents: number;
  freteCents?: number | null;
  quantidadeItens: number;
  children?: ReactNode;
}) {
  const hasShipping = freteCents !== undefined && freteCents !== null;
  const totalCents = subtotalCents + (freteCents ?? 0);
  return (
    <div className="flex flex-col gap-5 rounded-[22px] border border-borda bg-white p-6 font-sans md:rounded-[28px]">
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
      </dl>
      <p className="text-sm text-texto-2">
        em até 12x no cartão · ou no Pix, aprovado na hora
      </p>
      {children}
    </div>
  );
}
