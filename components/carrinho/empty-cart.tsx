import Link from "next/link";
import { BottleIcon, HeadphonesIcon, ZapIcon } from "@/components/loja/icons";

const shortcuts = [
  {
    label: "Eletrônicos",
    href: "/c/eletronicos",
    Icon: HeadphonesIcon,
    style: "border-ciano bg-ciano-tile text-noite hover:text-noite",
    iconStyle: "text-ciano-ink",
  },
  {
    label: "Cosméticos",
    href: "/c/cosmeticos",
    Icon: BottleIcon,
    style: "border-rosa bg-rosa-tile text-noite hover:text-noite",
    iconStyle: "text-rosa-ink",
  },
  {
    label: "Ofertas",
    href: "/busca?filtro=ofertas",
    Icon: ZapIcon,
    style: "border-oferta bg-oferta text-white hover:text-white",
    iconStyle: "text-white",
  },
];

export function EmptyCart() {
  return (
    <section className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-5 rounded-[22px] border border-borda bg-white p-6 text-center font-sans md:rounded-[28px] md:p-10">
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 200 140"
        className="ba-entra h-auto w-[200px] max-w-full"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g stroke="var(--color-ultramar)" strokeWidth="3">
          <path d="M48 48h88l-8 66H56Z" />
          <path d="M72 50V38a20 20 0 0 1 40 0v12" />
          <path d="M76 80h32" />
        </g>
        <g className="ba-scan">
          <circle
            cx="104"
            cy="59"
            r="26"
            stroke="var(--color-lima)"
            strokeWidth="9"
          />
          <path d="m123 78 25 25" stroke="var(--color-noite)" strokeWidth="8" />
        </g>
        <circle
          className="ba-float"
          cx="30"
          cy="38"
          r="5"
          fill="var(--color-ciano)"
        />
        <circle
          className="ba-float [animation-delay:-2s]"
          cx="163"
          cy="47"
          r="4"
          fill="var(--color-rosa)"
        />
        <circle
          className="ba-float [animation-delay:-4s]"
          cx="154"
          cy="119"
          r="5"
          fill="var(--color-lima)"
        />
      </svg>
      <div
        className="ba-entra flex flex-col gap-3"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="m-0 font-display text-[26px] font-extrabold text-noite md:text-[32px]">
          Seu carrinho está vazio
        </h2>
        <p className="m-0 text-[15px] text-texto-2">
          Buscou? Tá aqui. Comece pelos mais procurados da loja.
        </p>
      </div>
      <nav
        aria-label="Buscar produtos para o carrinho"
        className="ba-entra w-full"
        style={{ animationDelay: "160ms" }}
      >
        <ul className="m-0 flex list-none flex-col gap-3 p-0 md:flex-row">
          {shortcuts.map(({ label, href, Icon, style, iconStyle }) => (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[16px] border-[1.5px] px-3 text-[15px] font-bold no-underline hover:border-ultramar focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 ${style}`}
              >
                <Icon size={22} className={`shrink-0 ${iconStyle}`} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
