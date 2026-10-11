import Link from "next/link";
import type { ReactNode } from "react";
import {
  BoxIcon,
  CartIcon,
  PinIcon,
  SearchIcon,
} from "@/components/loja/icons";

type EmptyStateProps = {
  titulo: string;
  texto: string;
  acao?: { label: string; href: string };
  icone?: "busca" | "caixa" | "carrinho" | "pin";
  tom?: "ultramar" | "ciano" | "rosa";
  links?: { label: string; href: string }[];
  children?: ReactNode;
};

export function EmptyState({
  titulo,
  texto,
  acao,
  icone = "caixa",
  tom = "ultramar",
  links,
  children,
}: EmptyStateProps) {
  const Icon = {
    busca: SearchIcon,
    caixa: BoxIcon,
    carrinho: CartIcon,
    pin: PinIcon,
  }[icone];
  const toneClass = {
    ultramar: "bg-ultramar-50 text-ultramar",
    ciano: "bg-ciano-tile text-ciano-ink",
    rosa: "bg-rosa-tile text-rosa-ink",
  }[tom];
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4 rounded-[22px] border border-borda bg-white p-6 text-center font-sans motion-safe:animate-[page-in_200ms_ease-out] md:rounded-[28px] md:p-10">
      <div
        className={`flex size-[72px] shrink-0 items-center justify-center rounded-[20px] ${toneClass}`}
      >
        <Icon size={36} />
      </div>
      <h2 className="m-0 font-display text-2xl leading-[1.15] font-extrabold text-noite md:text-[28px]">
        {titulo}
      </h2>
      <p className="m-0 max-w-[420px] text-base leading-[1.5] text-texto-2">
        {texto}
      </p>
      {children}
      {acao && (
        <Link
          href={acao.href}
          className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-ultramar px-6 font-display text-base font-bold text-white no-underline hover:bg-ultramar-700 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
        >
          {acao.label}
        </Link>
      )}
      {links && links.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-2 p-0">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex min-h-11 items-center justify-center px-2 text-[15px] font-bold text-ultramar no-underline hover:underline focus-visible:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
