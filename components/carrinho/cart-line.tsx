"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ChipIcon, DropIcon } from "@/components/loja/icons";
import { formatBRL } from "@/lib/format";

type CartLineProps = {
  item: {
    id: string;
    slug: string;
    nome: string;
    varianteNome: string;
    precoCents: number;
    precoDeCents?: number | null;
    quantidade: number;
    estoque: number;
    imagemUrl: string | null;
    categoria: "eletronicos" | "cosmeticos";
  };
  setQuantity: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
};

export function CartLine({ item, setQuantity, remove }: CartLineProps) {
  const [quantity, setOptimisticQuantity] = useOptimistic(item.quantidade);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // The line fades and shrinks while it is being removed; the refreshed cart
  // then drops it (restored if the removal fails).
  const [removing, setRemoving] = useState(false);
  const max = Math.min(item.estoque, 10);
  const Icon = item.categoria === "eletronicos" ? ChipIcon : DropIcon;

  function changeQuantity(formData: FormData) {
    const next = Number(formData.get("quantidade"));
    setError(null);
    startTransition(async () => {
      setOptimisticQuantity(next);
      try {
        await setQuantity(formData);
      } catch {
        setError("Não foi possível atualizar a quantidade. Tente de novo.");
      }
    });
  }
  function removeItem(formData: FormData) {
    setError(null);
    setRemoving(true);
    startTransition(async () => {
      try {
        await remove(formData);
      } catch {
        setRemoving(false);
        setError("Não foi possível remover o produto. Tente de novo.");
      }
    });
  }

  return (
    <div
      aria-busy={pending}
      className={`flex flex-col gap-4 rounded-[22px] border border-borda bg-white p-4 font-sans transition-[opacity,transform] duration-300 md:flex-row md:items-center md:p-5 ${removing ? "opacity-40 motion-safe:scale-[.97]" : ""}`}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <div
          className={`flex size-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[16px] border p-1 ${item.categoria === "eletronicos" ? "border-ciano bg-ciano-tile text-ciano-ink" : "border-rosa bg-rosa-tile text-rosa-ink"}`}
        >
          {item.imagemUrl ? (
            <Image
              src={item.imagemUrl}
              alt={item.nome}
              width={88}
              height={88}
              className="h-full w-full object-contain"
            />
          ) : (
            <Icon size={48} />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link
            href={`/p/${item.slug}`}
            className="line-clamp-2 text-[15px] font-bold text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
          >
            {item.nome}
          </Link>
          <p className="text-sm text-texto-2">{item.varianteNome}</p>
          {item.precoDeCents != null && item.precoDeCents > item.precoCents && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-texto-2">
              <span className="sr-only">Preço anterior: </span>
              <s>{formatBRL(item.precoDeCents)}</s>
              <span className="rounded-full bg-oferta px-2 py-1 font-display text-xs font-bold text-white">
                -
                {Math.floor(
                  ((item.precoDeCents - item.precoCents) * 100) /
                    item.precoDeCents,
                )}
                %<span className="sr-only"> de desconto</span>
              </span>
            </p>
          )}
          <p className="text-sm text-noite">{formatBRL(item.precoCents)}</p>
          {item.estoque === 0 ? (
            <p className="text-sm font-bold text-rosa-ink">Esgotado</p>
          ) : quantity > item.estoque ? (
            <p className="text-sm text-rosa-ink">
              Só {item.estoque} em estoque
            </p>
          ) : null}
        </div>
      </div>
      {/* Mobile: quantity on the left, line total on the right, one row
          (audit 11/10). Desktop keeps the single row via md:contents. */}
      <div className="flex items-start justify-between gap-3 md:contents">
        <div className="flex flex-col gap-1 md:shrink-0">
          <div
            role="group"
            aria-label={`Quantidade de ${item.nome}`}
            className="flex self-start rounded-[14px] border-[1.5px] border-borda-forte"
          >
            <form action={changeQuantity}>
              <input type="hidden" name="itemId" value={item.id} />
              <input
                type="hidden"
                name="quantidade"
                value={Math.max(1, Math.min(quantity - 1, max))}
              />
              <button
                type="submit"
                disabled={pending || item.estoque === 0 || quantity <= 1}
                aria-label={`Diminuir quantidade de ${item.nome}`}
                className="size-11 rounded-l-[12px] bg-white text-xl text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>
            </form>
            <output
              aria-live="polite"
              className="flex min-w-9 items-center justify-center font-display text-[17px] font-bold text-noite"
            >
              {quantity}
            </output>
            <form action={changeQuantity}>
              <input type="hidden" name="itemId" value={item.id} />
              <input
                type="hidden"
                name="quantidade"
                value={Math.min(max, quantity + 1)}
              />
              <button
                type="submit"
                disabled={pending || item.estoque === 0 || quantity >= max}
                aria-label={`Aumentar quantidade de ${item.nome}`}
                className="size-11 rounded-r-[12px] bg-white text-xl text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </form>
          </div>
          <form action={removeItem}>
            <input type="hidden" name="itemId" value={item.id} />
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 px-2 text-sm font-bold text-rosa-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:opacity-50"
            >
              Remover
            </button>
          </form>
        </div>
        <p
          key={quantity}
          className="pt-2 font-display text-xl font-extrabold text-noite motion-safe:animate-[ba-cart-total_220ms_ease-out] md:ml-auto md:shrink-0 md:pt-0 md:text-lg md:font-bold"
        >
          {formatBRL(item.precoCents * quantity)}
        </p>
      </div>
      <style>{`@keyframes ba-cart-total { from { opacity: .65; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {error && (
        <p role="alert" className="text-sm text-rosa-ink">
          {error}
        </p>
      )}
    </div>
  );
}
