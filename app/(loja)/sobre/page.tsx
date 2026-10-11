import Link from "next/link";

import { StoreIdentity } from "@/components/legal/legal-page";
import {
  ArrowRightIcon,
  BottleIcon,
  ExchangeIcon,
  HeadphonesIcon,
  PixIcon,
  TruckIcon,
} from "@/components/loja/icons";
import { getStoreInfo } from "@/lib/store-info";

export const metadata = {
  title: "Sobre a Busca Agora",
  description: "Uma loja de família, com eletrônicos e cosméticos para você.",
};

export default async function AboutPage() {
  const info = await getStoreInfo();

  return (
    <article className="mx-auto flex w-full max-w-[960px] flex-col gap-6 text-noite md:gap-10">
      <header className="relative overflow-hidden rounded-[28px] bg-noite p-6 text-white md:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 size-[400px] rounded-full border-[32px] border-white/[0.06]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 size-[280px] rounded-full border border-white/[0.12]"
        />
        <div className="relative flex flex-col gap-4">
          <p className="m-0 text-[13px] font-bold tracking-[0.1em] text-lavanda">
            SOBRE A BUSCA AGORA
          </p>
          <h1 className="m-0 font-display text-[32px] leading-[1.05] font-extrabold text-balance md:text-[44px]">
            Uma loja de família.
            <br />
            <span className="text-lima">Uma escolha de cada vez.</span>
          </h1>
          <p className="m-0 max-w-[560px] text-[16px] leading-relaxed text-pretty text-lavanda md:text-[18px]">
            Somos uma loja online de eletrônicos e cosméticos. Aqui, você compra
            de um único vendedor: a Busca Agora. Somos um negócio de família.
            Cuidamos da escolha dos produtos, do atendimento e do envio para sua
            casa.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col items-start gap-4 rounded-[24px] bg-ciano-tile p-6">
          <div className="flex size-14 items-center justify-center rounded-[16px] bg-white text-ciano-ink">
            <HeadphonesIcon size={28} />
          </div>
          <h2 className="m-0 font-display text-[20px] font-bold text-balance">
            Eletrônicos
          </h2>
          <p className="m-0 text-[16px] leading-relaxed text-pretty">
            Fones, relógios, caixas de som e carregadores.
          </p>
          <Link
            href="/c/eletronicos"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg font-bold text-noite hover:underline focus-visible:underline"
          >
            Ver eletrônicos <ArrowRightIcon size={18} />
          </Link>
        </section>
        <section className="flex flex-col items-start gap-4 rounded-[24px] bg-rosa-tile p-6">
          <div className="flex size-14 items-center justify-center rounded-[16px] bg-white text-rosa-ink">
            <BottleIcon size={28} />
          </div>
          <h2 className="m-0 font-display text-[20px] font-bold text-balance">
            Cosméticos
          </h2>
          <p className="m-0 text-[16px] leading-relaxed text-pretty">
            Skincare, cabelo, corpo e proteção solar.
          </p>
          <Link
            href="/c/cosmeticos"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg font-bold text-noite hover:underline focus-visible:underline"
          >
            Ver cosméticos <ArrowRightIcon size={18} />
          </Link>
        </section>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Pix aprovado na hora", Icon: PixIcon },
          { label: "Despacho em até 24 h", Icon: TruckIcon },
          { label: "Troca em até 7 dias", Icon: ExchangeIcon, href: "/trocas" },
        ].map(({ label, Icon, href }) => (
          <div
            key={label}
            className="flex flex-col items-start gap-4 rounded-[22px] border border-borda bg-white p-5"
          >
            <div className="flex size-11 items-center justify-center rounded-[14px] bg-ultramar-50 text-ultramar">
              <Icon size={24} />
            </div>
            <strong className="text-[16px] font-bold">
              {href ? (
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center rounded-lg hover:underline focus-visible:underline"
                >
                  {label}
                </Link>
              ) : (
                label
              )}
            </strong>
          </div>
        ))}
      </div>

      <p className="m-0 rounded-[22px] bg-noite p-6 font-display text-[28px] font-extrabold text-white md:text-[36px]">
        Buscou? <span className="text-lima">Tá aqui.</span>
      </p>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 font-display text-[20px] font-bold text-balance">
          Quem está por trás da loja
        </h2>
        <div className="rounded-[22px] border border-borda bg-white p-5 text-[15px] leading-[1.6] md:p-8 [&_a]:inline-block [&_a]:min-h-11 [&_a]:max-w-full [&_a]:font-bold [&_a]:break-all [&_a]:text-ultramar [&_a]:hover:underline [&_a]:focus-visible:underline [&_li]:mb-1.5 [&_li:last-child]:mb-0">
          <StoreIdentity info={info} />
        </div>
      </section>
    </article>
  );
}
