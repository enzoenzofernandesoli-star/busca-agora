import Link from "next/link";
import { BoxIcon, SearchIcon } from "@/components/loja/icons";

type EmptyStateProps = {
  titulo: string;
  texto: string;
  acao?: { label: string; href: string };
  icone?: "busca" | "caixa";
};

export function EmptyState({
  titulo,
  texto,
  acao,
  icone = "caixa",
}: EmptyStateProps) {
  const Icon = icone === "busca" ? SearchIcon : BoxIcon;
  return (
    <div className="flex flex-col items-center gap-5 rounded-[22px] border border-borda bg-white p-7 text-center font-sans md:rounded-[28px] md:p-12">
      <div className="flex size-16 items-center justify-center rounded-[18px] bg-ultramar-50 text-ultramar">
        <Icon size={32} />
      </div>
      <h2 className="font-display text-2xl font-extrabold text-noite md:text-[28px]">
        {titulo}
      </h2>
      <p className="max-w-[420px] text-base leading-relaxed text-texto-2">
        {texto}
      </p>
      {acao && (
        <Link
          href={acao.href}
          className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] bg-ultramar px-7 font-display text-base font-bold text-white hover:bg-ultramar-700"
        >
          {acao.label}
        </Link>
      )}
    </div>
  );
}
