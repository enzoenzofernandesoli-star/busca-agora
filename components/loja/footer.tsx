import Link from "next/link";

import { LogoD } from "@/components/loja/logo";
import { legal } from "@/lib/site";

const institucional = [
  { label: "Sobre a Busca Agora", href: "/sobre" },
  { label: "Contato", href: "/contato" },
  { label: "Termos de uso", href: "/termos" },
  { label: "Política de privacidade", href: "/privacidade" },
];

const ajuda = [
  { label: "Rastrear pedido", href: "/rastreio" },
  { label: "Meus pedidos", href: "/conta/pedidos" },
  { label: "Trocas e devoluções", href: "/trocas" },
  { label: "Formas de pagamento", href: "/trocas#pagamento" },
];

const pagamentos = ["Pix", "Cartão de crédito", "Boleto"];

const footLink = "text-lavanda-500 no-underline hover:text-white";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-3 text-[15px]">
      <span className="font-display font-bold text-white">{title}</span>
      {links.map((l) => (
        <Link key={l.label} href={l.href} className={footLink}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

/** Desktop footer (>= md), per docs/design/Home.dc.html. */
function FooterDesktop() {
  return (
    <footer className="hidden bg-noite text-lavanda md:block">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-8 pt-14 pb-7">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8">
          <div className="flex flex-col gap-4">
            <LogoD height={32} className="self-start" />
            <p className="m-0 font-display text-lg font-bold text-white">
              Buscou? <span className="text-lima">Tá aqui.</span>
            </p>
          </div>
          <FooterColumn title="Institucional" links={institucional} />
          <FooterColumn title="Ajuda" links={ajuda} />
          <div className="flex flex-col gap-3 text-[15px]">
            <span className="font-display font-bold text-white">Pague com</span>
            <ul className="flex flex-wrap gap-2">
              {pagamentos.map((p) => (
                <li
                  key={p}
                  className="rounded-lg border border-noite-500 px-3 py-1.5 text-[13px] font-bold text-white"
                >
                  {p}
                </li>
              ))}
            </ul>
            <span className="text-[13px] text-lavanda-500">
              Pagamento processado com segurança pelo Mercado Pago.
            </span>
          </div>
        </div>
        <p
          className="m-0 border-t border-noite-600 pt-[22px] text-[13px] leading-[1.6] text-lavanda-600"
          data-testid="dados-legais"
        >
          {legal.marca} · {legal.razaoSocial} · CNPJ {legal.cnpj} ·{" "}
          {legal.endereco} · {legal.email}
        </p>
      </div>
    </footer>
  );
}

/** Compact legal line on mobile, per docs/design/Celular-Home.dc.html. */
function FooterMobile() {
  return (
    <footer className="px-4 pt-2 pb-6 text-center text-xs leading-[1.6] text-texto-2 md:hidden">
      {legal.marca} · CNPJ {legal.cnpj}
      <br />
      <Link href="/termos" className="text-ultramar">
        Termos
      </Link>{" "}
      ·{" "}
      <Link href="/privacidade" className="text-ultramar">
        Privacidade
      </Link>{" "}
      ·{" "}
      <Link href="/trocas" className="text-ultramar">
        Trocas
      </Link>
    </footer>
  );
}

export function Footer() {
  return (
    <>
      <FooterMobile />
      <FooterDesktop />
    </>
  );
}
