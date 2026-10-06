import Image from "next/image";
import Link from "next/link";

import { ChipIcon, DropIcon } from "@/components/loja/icons";
import { Price } from "@/components/loja/price";
import { categoryStyles, type CategorySlug } from "@/lib/site";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  href: string;
  nome: string;
  categoria: CategorySlug;
  /** Integer cents. */
  precoCents: number;
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
  imagemUrl,
  imagemAlt,
  mostrarCategoria = false,
  className,
}: ProductCardProps) {
  const cat = categoryStyles[categoria];
  const Placeholder = categoria === "eletronicos" ? ChipIcon : DropIcon;

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col overflow-hidden rounded-[18px] border border-borda bg-white text-noite no-underline transition-[transform,box-shadow] duration-200 ease-out hover:text-noite md:rounded-[22px] md:hover:-translate-y-1 md:hover:shadow-[0_16px_32px_rgba(10,15,61,.10)]",
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
            className="object-contain"
          />
        ) : (
          <Placeholder className="size-[52px] md:size-[72px]" />
        )}
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
