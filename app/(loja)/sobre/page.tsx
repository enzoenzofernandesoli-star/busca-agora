import Link from "next/link";

import { StoreIdentity } from "@/components/legal/legal-page";
import {
  BoxIcon,
  ExchangeIcon,
  ShieldCheckIcon,
  TruckIcon,
  UserIcon,
} from "@/components/loja/icons";
import { getStoreInfo } from "@/lib/store-info";

export const metadata = {
  title: "Sobre a Busca Agora",
  description:
    "A Busca Agora encurta a distância entre o que você procura e o que chega na sua porta: eletrônicos e cosméticos, do clique até a entrega.",
};

const promessas = [
  {
    titulo: "Produto escolhido, não empilhado.",
    texto: "Eletrônicos e cosméticos selecionados antes de entrar no catálogo.",
    Icon: BoxIcon,
  },
  {
    titulo: "Preço e prazo antes de pagar.",
    texto: "Frete e prazo calculados no seu CEP, sem surpresa no final.",
    Icon: TruckIcon,
  },
  {
    titulo: "Compra protegida.",
    texto: "Pagamento processado pelo Mercado Pago, com Pix aprovado na hora.",
    Icon: ShieldCheckIcon,
  },
  {
    titulo: "Troca sem burocracia.",
    texto: "Arrependeu? Você tem 7 dias para devolver, e a gente resolve.",
    Icon: ExchangeIcon,
    href: "/trocas",
  },
  {
    titulo: "Gente de verdade no atendimento.",
    texto: "Quem responde é uma pessoa, não um robô.",
    Icon: UserIcon,
  },
];

const limeButton =
  "inline-flex min-h-12 items-center rounded-[14px] bg-lima px-[22px] font-display text-[15px] font-bold text-noite no-underline hover:bg-lima-300 hover:text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lima md:min-h-[52px] md:px-7 md:text-base";

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
            Buscou? <span className="text-lima">Tá aqui.</span>
          </h1>
          <p className="m-0 max-w-[560px] text-[16px] leading-relaxed text-pretty text-lavanda md:text-[18px]">
            A Busca Agora existe para encurtar a distância entre o que você
            procura e o que chega na sua porta.
          </p>
        </div>
      </header>

      <section
        aria-labelledby="por-que"
        className="flex flex-col gap-4 rounded-[24px] border border-borda bg-white p-6 md:p-8"
      >
        <h2
          id="por-que"
          className="m-0 font-display text-[22px] font-bold text-balance md:text-[26px]"
        >
          Por que a gente existe
        </h2>
        <p className="m-0 text-[16px] leading-relaxed text-pretty">
          Todo mundo já passou por isso: você procura um fone, um sérum, um
          carregador. Aparecem mil anúncios iguais, o preço muda no carrinho, o
          prazo ninguém cumpre e o vendedor some depois da compra.
        </p>
        <p className="m-0 text-[16px] leading-relaxed text-pretty">
          A Busca Agora nasceu em São Paulo para acabar com isso. Em vez de
          vender de tudo, a gente escolhe o que entra na loja e cuida de cada
          pedido do clique até a entrega.
        </p>
      </section>

      <section aria-labelledby="esperar" className="flex flex-col gap-4">
        <h2
          id="esperar"
          className="m-0 font-display text-[22px] font-bold text-balance md:text-[26px]"
        >
          O que você pode esperar da gente
        </h2>
        <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
          {promessas.map(({ titulo, texto, Icon, href }) => (
            <li
              key={titulo}
              className="flex items-start gap-4 rounded-[22px] border border-borda bg-white p-5"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-ultramar-50 text-ultramar">
                <Icon size={24} />
              </div>
              <p className="m-0 text-[15px] leading-relaxed text-pretty">
                <strong className="block font-bold">{titulo}</strong>
                {texto}
                {href ? (
                  <>
                    {" "}
                    <Link
                      href={href}
                      className="inline-flex min-h-11 items-center font-bold text-ultramar hover:underline focus-visible:underline"
                    >
                      Como trocar
                    </Link>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="busca-agora"
        className="flex flex-col items-start gap-4 rounded-[24px] bg-noite p-6 text-white md:p-10"
      >
        <h2
          id="busca-agora"
          className="m-0 font-display text-[28px] font-extrabold md:text-[36px]"
        >
          Busca Agora
        </h2>
        <p className="m-0 text-[16px] leading-relaxed text-lavanda md:text-[18px]">
          Eletrônicos e cosméticos, do clique até a sua porta.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/busca?filtro=ofertas" className={limeButton}>
            Ver ofertas
          </Link>
          <Link
            href="/busca?filtro=mais-buscados"
            className="inline-flex min-h-12 items-center rounded-[14px] border-[1.5px] border-white/40 px-6 text-base font-bold text-white no-underline hover:bg-white/12 hover:text-white md:min-h-[52px]"
          >
            Mais buscados
          </Link>
        </div>
      </section>

      <section aria-labelledby="dados" className="flex flex-col gap-4">
        <h2
          id="dados"
          className="m-0 font-display text-[20px] font-bold text-balance"
        >
          Dados da empresa
        </h2>
        <div className="rounded-[22px] border border-borda bg-white p-5 text-[15px] leading-[1.6] md:p-8 [&_a]:inline-block [&_a]:min-h-11 [&_a]:max-w-full [&_a]:font-bold [&_a]:break-all [&_a]:text-ultramar [&_a]:hover:underline [&_a]:focus-visible:underline [&_li]:mb-1.5 [&_li:last-child]:mb-0">
          <StoreIdentity info={info} />
        </div>
      </section>
    </article>
  );
}
