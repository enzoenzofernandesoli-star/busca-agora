import Link from "next/link";

import { SearchForm } from "@/components/loja/search-form";

// 404 with the brand: same dark banner as the Home hero.
export default function NotFound() {
  return (
    <section className="relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl bg-noite px-6 py-8 text-white md:gap-6 md:rounded-[28px] md:p-14">
      <div
        aria-hidden="true"
        className="absolute -top-[90px] -right-20 size-60 rounded-full border-[40px] border-ultramar opacity-60 md:-top-[140px] md:-right-[120px] md:size-[420px] md:border-[64px] md:opacity-55"
      />
      <span className="relative inline-flex rounded-full bg-lima px-3 py-[5px] text-xs font-bold tracking-[.06em] text-noite md:text-[13px]">
        ERRO 404
      </span>
      <h1 className="relative m-0 font-display text-[36px] leading-none font-extrabold tracking-[-0.03em] md:text-[56px]">
        Buscou?
        <br />
        <span className="text-lima">Aqui não tá.</span>
      </h1>
      <p className="relative m-0 max-w-[460px] text-[15px] leading-normal text-lavanda md:text-lg">
        Essa página não existe ou o produto saiu da vitrine. Tente buscar de
        novo:
      </p>
      <SearchForm
        id="busca-404"
        variant="desktop"
        placeholder="Busque fones, smartwatches, skincare..."
        className="relative w-full max-w-[520px]"
      />
      <Link
        href="/"
        className="relative inline-flex min-h-12 items-center rounded-[14px] bg-lima px-[22px] font-display text-[15px] font-bold text-noite no-underline hover:bg-lima-300 hover:text-noite md:min-h-[52px] md:px-7 md:text-base"
      >
        Voltar para o início
      </Link>
    </section>
  );
}
