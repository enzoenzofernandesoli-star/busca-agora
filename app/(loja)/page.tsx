import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";

import { EmptyState } from "@/components/loja/empty-state";
import {
  BottleIcon,
  CardIcon,
  ExchangeIcon,
  HeadphonesIcon,
  PixIcon,
  SearchIcon,
  TruckIcon,
  WatchIcon,
} from "@/components/loja/icons";
import { ProductCard } from "@/components/loja/product-card";
import { SectionHeader } from "@/components/loja/section-header";
import { Splash } from "@/components/loja/splash";
import { getHomeShowcase, type ProductSummary } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Home from docs/design/Home.dc.html (desktop) and Celular-Home.dc.html (390 px).

const vantagens = [
  {
    titulo: "Pix na hora",
    texto: "Pagamento aprovado em segundos",
    Icon: PixIcon,
  },
  {
    titulo: "Até 12x no cartão",
    texto: "Com a segurança do Mercado Pago",
    Icon: CardIcon,
  },
  {
    titulo: "Frete no seu CEP",
    texto: "Prazo e valor antes de pagar",
    Icon: TruckIcon,
  },
  {
    titulo: "Troca em até 7 dias",
    texto: "Arrependeu? A gente resolve",
    Icon: ExchangeIcon,
  },
];

const limeButton =
  "relative inline-flex items-center rounded-[14px] bg-lima font-display font-bold text-noite no-underline hover:bg-lima-300 hover:text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lima";

function Hero() {
  return (
    <div className="relative flex min-w-0 flex-col items-start gap-4 overflow-hidden rounded-3xl bg-noite px-6 py-7 text-white md:min-h-[440px] md:flex-[2_1_600px] md:flex-row md:flex-wrap md:items-center md:gap-10 md:rounded-[28px] md:p-14">
      <div
        aria-hidden="true"
        className="absolute -top-[90px] -right-20 size-60 rounded-full border-[40px] border-ultramar opacity-60 md:-top-[140px] md:-right-[120px] md:size-[420px] md:border-[64px] md:opacity-55"
      />
      <div className="relative flex flex-col items-start gap-4 md:flex-[1_1_340px] md:gap-6">
        <span className="inline-flex rounded-full bg-lima px-3 py-[5px] text-xs font-bold tracking-[.06em] text-noite md:px-3.5 md:py-1.5 md:text-[13px]">
          NOVIDADES TODA SEMANA
        </span>
        <h1 className="m-0 font-display text-[40px] leading-none font-extrabold tracking-[-0.03em] md:text-[clamp(44px,5.4vw,76px)] md:leading-[.98] md:tracking-[-0.035em]">
          Buscou?
          <br />
          <span className="text-lima">Tá aqui.</span>
        </h1>
        <p className="m-0 max-w-[420px] text-[15px] leading-normal text-lavanda md:text-lg md:leading-[1.55]">
          <span className="hidden md:inline">
            Eletrônicos e cosméticos selecionados, com frete calculado no seu
            CEP e nota fiscal em todo pedido.
          </span>
          <span className="md:hidden">
            Frete calculado no seu CEP e nota fiscal em todo pedido.
          </span>
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/busca?filtro=ofertas"
            className={`${limeButton} min-h-12 px-[22px] text-[15px] md:min-h-[52px] md:px-7 md:text-base`}
          >
            Ver ofertas
          </Link>
          <Link
            href="/busca?filtro=mais-buscados"
            className="hidden min-h-[52px] items-center rounded-[14px] border-[1.5px] border-white/40 px-6 text-base font-bold text-white no-underline hover:bg-white/12 hover:text-white md:inline-flex"
          >
            Mais buscados
          </Link>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="relative hidden flex-[0_1_300px] grid-cols-2 gap-4 md:grid"
      >
        <div className="flex aspect-square items-center justify-center rounded-3xl bg-ciano text-noite">
          <HeadphonesIcon size={64} />
        </div>
        <div className="flex aspect-square translate-y-6 items-center justify-center rounded-3xl bg-rosa text-noite">
          <BottleIcon size={60} />
        </div>
        <div className="flex aspect-square items-center justify-center rounded-3xl bg-ultramar text-white">
          <WatchIcon size={60} />
        </div>
        <div className="flex aspect-square translate-y-6 items-center justify-center rounded-3xl bg-lima text-noite">
          <SearchIcon size={60} strokeWidth={1.6} />
        </div>
      </div>
    </div>
  );
}

const categorias = [
  {
    href: "/c/eletronicos",
    nome: "Eletrônicos",
    texto: "Fones, relógios, caixas de som e carregadores",
    bg: "bg-ciano",
    Icon: HeadphonesIcon,
  },
  {
    href: "/c/cosmeticos",
    nome: "Cosméticos",
    texto: "Skincare, cabelo, corpo e proteção solar",
    bg: "bg-rosa",
    Icon: BottleIcon,
  },
];

function CategoryCards() {
  return (
    <nav
      aria-label="Categorias da loja"
      className="grid grid-cols-2 gap-3 md:flex md:flex-[1_1_300px] md:flex-col md:gap-6"
    >
      {categorias.map(({ href, nome, texto, bg, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-[22px] p-[18px] text-noite no-underline hover:text-noite md:min-h-[208px] md:flex-1 md:rounded-[28px] md:p-8 ${bg}`}
        >
          <Icon size={34} strokeWidth={1.6} className="md:hidden" />
          <Icon
            size={150}
            strokeWidth={1.2}
            className="absolute -right-2.5 -bottom-3.5 hidden opacity-[.22] md:block"
          />
          <span className="hidden text-[13px] font-bold tracking-[.08em] md:inline">
            CATEGORIA
          </span>
          <span className="flex flex-col gap-1.5">
            <span className="font-display text-[19px] font-extrabold md:text-[32px] md:tracking-[-0.02em]">
              {nome}
            </span>
            <span className="hidden max-w-[220px] text-[15px] leading-[1.4] md:block">
              {texto}
            </span>
          </span>
          <span className="hidden text-[15px] font-bold md:inline">
            Ver tudo →
          </span>
        </Link>
      ))}
    </nav>
  );
}

function Vantagens() {
  return (
    <section aria-label="Vantagens">
      {/* Mobile: scrolling chips. */}
      <ul className="m-0 -mx-4 scrollbar-none flex list-none gap-2.5 overflow-x-auto px-4 md:hidden">
        {vantagens
          .filter((v) => v.titulo !== "Frete no seu CEP")
          .map((v) => (
            <li
              key={v.titulo}
              className="inline-flex flex-none items-center gap-2 rounded-[14px] border border-borda bg-white px-3.5 py-2.5 text-[13px] font-bold"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-ultramar"
              />
              {v.titulo}
            </li>
          ))}
      </ul>
      {/* Desktop: four cards. */}
      <ul className="m-0 hidden list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 p-0 md:grid">
        {vantagens.map(({ titulo, texto, Icon }) => (
          <li
            key={titulo}
            className="flex items-center gap-4 rounded-[20px] border border-borda bg-white px-[22px] py-5"
          >
            <span className="flex size-12 flex-none items-center justify-center rounded-[14px] bg-ultramar-50 text-ultramar">
              <Icon />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-display text-base font-bold">{titulo}</span>
              <span className="text-sm text-texto-2">{texto}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductGrid({
  produtos,
  mostrarCategoria,
}: {
  produtos: ProductSummary[];
  mostrarCategoria?: boolean;
}) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] md:gap-5">
      {produtos.map((p, i) => (
        // Mobile shows 4 cards (2 rows), desktop up to 5 (design).
        <li key={p.id} className={i === 4 ? "hidden md:flex" : "flex"}>
          <ProductCard
            href={`/p/${p.slug}`}
            nome={p.nome}
            categoria={p.categoria}
            precoCents={p.precoCents}
            imagemUrl={p.imagemUrl ?? undefined}
            imagemAlt={p.imagemAlt ?? undefined}
            mostrarCategoria={mostrarCategoria}
            className="w-full"
          />
        </li>
      ))}
    </ul>
  );
}

function InstallApp() {
  return (
    <section
      aria-labelledby="instalar"
      className="relative flex flex-col gap-3.5 overflow-hidden rounded-3xl bg-ultramar p-[22px] text-white md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-8 md:rounded-[28px] md:px-14 md:py-11"
    >
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-[90px] hidden size-[340px] rounded-full border-[48px] border-white/7 md:block"
      />
      <div className="relative flex max-w-[560px] flex-col gap-3.5">
        <div className="flex items-center gap-3.5">
          <span className="flex size-[60px] flex-none items-center justify-center rounded-2xl bg-noite md:hidden">
            <Image
              src="/brand/logo-e-branco.svg"
              alt=""
              width={46}
              height={46}
              unoptimized
              style={{ height: "auto" }}
              className="h-auto w-[46px]"
            />
          </span>
          <h2
            id="instalar"
            className="m-0 font-display text-lg leading-[1.2] font-extrabold md:text-[34px] md:leading-[1.1] md:tracking-[-0.02em]"
          >
            <span className="md:hidden">
              Coloque a Busca Agora na sua tela inicial
            </span>
            <span className="hidden md:inline">
              A Busca Agora no seu celular,{" "}
              <span className="text-lima">sem baixar nada.</span>
            </span>
          </h2>
        </div>
        <p className="m-0 hidden text-[17px] leading-[1.55] text-lavanda md:block">
          Ícone na tela inicial, abre em tela cheia e seus pedidos sempre à mão.
        </p>
        <ol className="m-0 pl-5 text-sm leading-[1.7] text-lavanda md:text-[15px]">
          <li>
            Toque em <b className="text-white">Compartilhar</b> (iPhone) ou no
            menu <b className="text-white">⋮</b> (Android)
          </li>
          <li>
            Escolha <b className="text-white">Adicionar à tela inicial</b>
          </li>
        </ol>
      </div>
      <div className="relative hidden size-[168px] items-center justify-center rounded-[40px] bg-noite shadow-[0_20px_40px_rgba(10,15,61,.35)] md:flex">
        <Image
          src="/brand/logo-e-branco.svg"
          alt="Ícone do app Busca Agora"
          width={124}
          height={124}
          unoptimized
          style={{ height: "auto" }}
          className="h-auto w-[124px]"
        />
      </div>
    </section>
  );
}

export default async function HomePage(props: PageProps<"/">) {
  const [{ maisBuscados, cosmeticos }, cookieStore, searchParams] =
    await Promise.all([getHomeShowcase(), cookies(), props.searchParams]);

  // Opening animation: first visit (no cookie) or opened as the installed
  // app (start_url ?origem=pwa). Never on deep links: only this page has it.
  const showSplash =
    !cookieStore.has("ba_visto") || searchParams.origem === "pwa";

  return (
    <>
      {showSplash ? <Splash /> : null}

      <section
        aria-label="Destaques"
        className="flex flex-col gap-6 md:flex-row md:flex-wrap"
      >
        <Hero />
        <CategoryCards />
      </section>

      <Vantagens />

      <section
        aria-labelledby="mais-buscados"
        className="flex flex-col gap-3.5 md:gap-5"
      >
        <SectionHeader
          id="mais-buscados"
          eyebrow="O que todo mundo está buscando"
          title="Mais buscados"
          link={
            maisBuscados.length > 0
              ? { href: "/busca?filtro=mais-buscados", label: "Ver todos" }
              : undefined
          }
        />
        {maisBuscados.length > 0 ? (
          <ProductGrid produtos={maisBuscados} mostrarCategoria />
        ) : (
          <EmptyState
            icone="caixa"
            titulo="Prateleiras sendo montadas"
            texto="Os primeiros eletrônicos e cosméticos chegam em breve. Volte logo: novidades toda semana."
          />
        )}
      </section>

      <InstallApp />

      {cosmeticos.length > 0 ? (
        <section
          aria-labelledby="cosmeticos"
          className="flex flex-col gap-3.5 md:gap-5"
        >
          <SectionHeader
            id="cosmeticos"
            eyebrow="Cosméticos"
            eyebrowColor="text-rosa-ink"
            eyebrowSquare="bg-rosa"
            title="Sua rotina de cuidados"
            mobileTitle="Cosméticos"
            link={{ href: "/c/cosmeticos", label: "Ver cosméticos" }}
            mobileLinkLabel="Ver todos"
          />
          <ProductGrid produtos={cosmeticos} />
        </section>
      ) : null}
    </>
  );
}
