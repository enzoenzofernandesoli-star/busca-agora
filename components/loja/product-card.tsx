import Image from "next/image";
import Link from "next/link";

import { ChipIcon, DropIcon } from "@/components/loja/icons";
import { Price } from "@/components/loja/price";
import { formatBRL } from "@/lib/format";
import { categoryStyles, type CategorySlug } from "@/lib/site";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  href: string;
  nome: string;
  categoria: CategorySlug;
  /** Integer cents. */
  precoCents: number;
  /** Crossed-out price (cents); shown with a discount tag only when higher. */
  precoDeCents?: number | null;
  imagemUrl?: string;
  imagemAlt?: string;
  /** Show the category tag above the name (desktop "Mais buscados"). */
  mostrarCategoria?: boolean;
  className?: string;
};

export function ProductCard({
  href,
  nome,
  categoria,
  precoCents,
  precoDeCents,
  imagemUrl,
  imagemAlt,
  mostrarCategoria = false,
  className,
}: ProductCardProps) {
  const cat = categoryStyles[categoria];
  const Placeholder = categoria === "eletronicos" ? ChipIcon : DropIcon;
  const emOferta =
    typeof precoDeCents === "number" && precoDeCents > precoCents;
  // Whole percent, rounded down (integer maths: never promise more).
  const desconto = emOferta
    ? Math.floor(((precoDeCents - precoCents) * 100) / precoDeCents)
    : 0;

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[18px] border border-borda bg-white text-noite no-underline transition-[transform,box-shadow,border-color] duration-200 ease-out hover:text-noite motion-safe:active:scale-[.98] md:rounded-[22px] md:hover:shadow-[0_16px_32px_rgba(10,15,61,.10)] md:focus-visible:shadow-[0_16px_32px_rgba(10,15,61,.10)] motion-safe:md:hover:-translate-y-1",
        // Border takes the category colour on hover (13/10 polish).
        categoria === "eletronicos"
          ? "md:hover:border-ciano"
          : "md:hover:border-rosa",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex h-[150px] items-center justify-center md:h-[210px]",
          cat.tile,
          cat.ink,
        )}
      >
        {imagemUrl ? (
          <Image
            src={imagemUrl}
            alt={imagemAlt ?? nome}
            fill
            sizes="(min-width: 768px) 240px, 50vw"
            className="object-contain transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.06]"
          />
        ) : (
          <Placeholder className="ba-float size-[52px] md:size-[72px]" />
        )}
        {emOferta && desconto > 0 ? (
          <span className="ba-reveal absolute top-2 left-2 rounded-full bg-oferta px-2.5 py-1 font-display text-[13px] leading-none font-extrabold text-white shadow-[0_4px_10px_rgba(215,38,30,.35)] md:top-3 md:left-3 md:text-sm">
            -{desconto}%<span className="sr-only"> de desconto</span>
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5 px-3 pt-3 pb-3.5 md:gap-2 md:px-[18px] md:pt-4 md:pb-5">
        {mostrarCategoria ? (
          <span className="hidden items-center gap-1.5 text-xs font-bold text-texto-2 md:inline-flex">
            <span
              aria-hidden="true"
              className={cn("size-2 rounded-[2px]", cat.cor)}
            />
            {cat.nome}
          </span>
        ) : null}
        <span className="line-clamp-2 min-h-[38px] text-sm leading-[1.35] md:min-h-[43px] md:text-base">
          {nome}
        </span>
        {emOferta ? (
          <span className="-mb-1 text-xs text-texto-2 line-through md:text-[13px]">
            <span className="sr-only">Preço anterior: </span>
            {formatBRL(precoDeCents)}
          </span>
        ) : null}
        <Price
          cents={precoCents}
          size="sm"
          className="md:text-2xl md:tracking-[-0.02em]"
        />
        <span className="text-xs text-texto-2 md:text-[13px]">
          em até 12x no cartão
        </span>
      </div>
    </Link>
  );
}
