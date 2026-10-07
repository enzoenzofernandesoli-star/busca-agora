"use client";

import { useState } from "react";

import { AddToCart } from "@/components/loja/add-to-cart";
import { Price } from "@/components/loja/price";
import { ShippingQuote } from "@/components/loja/shipping-quote";
import { addToCart } from "@/lib/cart/actions";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export type BuyBoxVariant = {
  id: string;
  sku: string;
  nome: string;
  precoCents: number;
  precoDeCents: number | null;
  estoque: number;
};

type ProductBuyBoxProps = {
  variantes: BuyBoxVariant[];
};

const MAX_QTD = 10;

// Known color names -> swatch. Unknown names fall back to a text chip.
const swatches: Record<string, string> = {
  preto: "#15182B",
  branco: "#F6F7FB",
  azul: "#3324F5",
  rosa: "#FF9AC8",
  vermelho: "#D93A3A",
  verde: "#2E9D5B",
  cinza: "#9A9FB5",
};

function swatchFor(nome: string): string | undefined {
  return swatches[nome.trim().toLowerCase()];
}

// Variant, quantity, stock and buy buttons (docs/design/Produto.dc.html).
// Prices shown here are display only: the server recalculates everything at
// checkout (CLAUDE.md rule 2): the cart stores variant and quantity only.
export function ProductBuyBox({ variantes }: ProductBuyBoxProps) {
  const firstInStock = variantes.findIndex((v) => v.estoque > 0);
  const [index, setIndex] = useState(Math.max(firstInStock, 0));
  const [qtd, setQtd] = useState(1);

  const variante = variantes[index] ?? variantes[0];
  if (!variante) return null;

  const max = Math.min(MAX_QTD, Math.max(variante.estoque, 1));
  const emEstoque = variante.estoque > 0;
  const temOpcoes = variantes.length > 1;
  const comSwatch = temOpcoes && variantes.every((v) => swatchFor(v.nome));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 border-y border-borda py-5">
        {variante.precoDeCents &&
        variante.precoDeCents > variante.precoCents ? (
          <span className="text-[15px] text-texto-2">
            <span className="sr-only">Preço anterior: </span>
            <s>{formatBRL(variante.precoDeCents)}</s>
          </span>
        ) : null}
        <Price cents={variante.precoCents} size="xl" />
        <span className="text-[15px] text-texto-2">
          em até 12x no cartão · ou no Pix, aprovado na hora
        </span>
      </div>

      {temOpcoes ? (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[15px]">
            <b>{comSwatch ? "Cor" : "Opção"}:</b> {variante.nome}
          </legend>
          <div className="flex flex-wrap gap-3">
            {variantes.map((v, i) => {
              const ativo = i === index;
              const hex = swatchFor(v.nome);
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={ativo}
                  aria-label={v.estoque > 0 ? v.nome : `${v.nome} (esgotado)`}
                  onClick={() => {
                    setIndex(i);
                    setQtd(1);
                  }}
                  className={cn(
                    "cursor-pointer bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar",
                    comSwatch
                      ? "size-12 rounded-full p-1"
                      : "min-h-11 rounded-[14px] px-4 text-[15px] font-bold",
                    ativo
                      ? "border-[2.5px] border-ultramar"
                      : "border-[1.5px] border-borda-forte",
                    v.estoque === 0 && "opacity-50",
                  )}
                >
                  {comSwatch && hex ? (
                    <span
                      aria-hidden="true"
                      className="block size-full rounded-full shadow-[inset_0_0_0_1px_rgba(10,15,61,.15)]"
                      style={{ background: hex }}
                    />
                  ) : (
                    v.nome
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <span id="qtd-label" className="text-[15px] font-bold">
          Quantidade
        </span>
        <div
          role="group"
          aria-labelledby="qtd-label"
          className="flex items-center overflow-hidden rounded-[14px] border-[1.5px] border-borda-forte"
        >
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={!emEstoque || qtd <= 1}
            onClick={() => setQtd((q) => Math.max(1, q - 1))}
            className="size-11 cursor-pointer border-0 bg-white text-xl text-noite disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <output
            aria-live="polite"
            className="min-w-9 text-center font-display text-[17px] font-bold"
          >
            {qtd}
          </output>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={!emEstoque || qtd >= max}
            onClick={() => setQtd((q) => Math.min(max, q + 1))}
            className="size-11 cursor-pointer border-0 bg-white text-xl text-noite disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
        {emEstoque ? (
          <span className="text-sm font-bold text-estoque">
            {variante.estoque <= 3
              ? `Só ${variante.estoque} em estoque`
              : "Em estoque"}
          </span>
        ) : (
          <span className="text-sm font-bold text-rosa-ink">Esgotado</span>
        )}
      </div>

      <ShippingQuote
        itens={[{ variantId: variante.id, quantidade: emEstoque ? qtd : 1 }]}
      />

      <AddToCart
        variantId={variante.id}
        quantidade={qtd}
        disponivel={emEstoque}
        addToCart={addToCart}
      />
    </div>
  );
}
