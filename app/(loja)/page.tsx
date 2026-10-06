import Link from "next/link";

import { Button } from "@/components/ui/button";

// Provisional Home for phase 0. The real Home (banners, showcases) is phase 2.
export default function HomePage() {
  return (
    <section className="relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl bg-noite px-6 py-7 text-white md:gap-6 md:rounded-[28px] md:p-14">
      <div
        aria-hidden="true"
        className="absolute -top-[90px] -right-20 size-60 rounded-full border-[40px] border-ultramar opacity-60 md:-top-[140px] md:-right-[120px] md:size-[420px] md:border-[64px] md:opacity-55"
      />
      <h1 className="relative m-0 font-display text-[40px] leading-none font-extrabold tracking-[-0.03em] md:text-[clamp(44px,5.4vw,76px)] md:leading-[.98] md:tracking-[-0.035em]">
        Buscou?
        <br />
        <span className="text-lima">Tá aqui.</span>
      </h1>
      <p className="relative m-0 max-w-[420px] text-[15px] leading-normal text-lavanda md:text-lg md:leading-[1.55]">
        Estamos preparando as prateleiras. Em breve, eletrônicos e cosméticos
        selecionados, com frete calculado no seu CEP e nota fiscal em todo
        pedido.
      </p>
      <Button asChild variant="lima" className="relative">
        <Link href="/rastreio">Rastrear pedido</Link>
      </Button>
    </section>
  );
}
