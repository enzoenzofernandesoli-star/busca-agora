import type { ReactNode } from "react";

import { AuthBackdrop } from "@/components/conta/auth-backdrop";
import {
  PinIcon,
  PixIcon,
  ShieldCheckIcon,
  TruckIcon,
  UserIcon,
} from "@/components/loja/icons";

type AuthCardProps = {
  titulo: string;
  subtitulo?: string;
  icone?: "conta" | "novo" | "chave" | "termos";
  children: ReactNode;
};

function KeyIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m11.5 11.5 9-9L23 5l-3 3-2-2-3 3 2 2-2 2" />
    </svg>
  );
}

// Account entry pages (/entrar, /cadastro, password pages, terms): a dark
// stage with the store's moving backdrop and a solid white card on top
// (decision of 13/10). On desktop the left column carries the slogan; white
// text there sits on plain noite (the backdrop keeps light shapes faint).
export function AuthCard({
  titulo,
  subtitulo,
  icone,
  children,
}: AuthCardProps) {
  const Icon =
    icone === "chave"
      ? KeyIcon
      : icone === "termos"
        ? ShieldCheckIcon
        : UserIcon;

  return (
    <section className="relative isolate -mx-4 -mt-3 grid min-h-[calc(100svh-180px)] items-center gap-6 overflow-hidden bg-noite px-4 pt-8 pb-[132px] md:mx-0 md:mt-0 md:min-h-[680px] md:gap-8 md:rounded-[28px] md:p-12 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-12 xl:px-20">
      <AuthBackdrop />
      <div className="flex flex-col gap-3 text-white md:gap-5">
        <p
          style={{ animationDelay: "0ms" }}
          className="ba-entra m-0 inline-flex items-center gap-2 text-[13px] font-bold tracking-[.1em] text-lavanda uppercase"
        >
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-lima" />
          Busca Agora
        </p>
        <p
          style={{ animationDelay: "80ms" }}
          className="ba-entra m-0 font-display text-[30px] leading-[1.02] font-extrabold tracking-[-0.03em] md:text-[44px] lg:text-[clamp(44px,4.6vw,72px)]"
        >
          Buscou? <span className="text-lima">Tá aqui.</span>
        </p>
        <ul
          style={{ animationDelay: "160ms" }}
          className="ba-entra m-0 hidden list-none flex-col gap-3 p-0 text-base font-medium text-lavanda lg:flex"
        >
          {[
            { text: "Seus pedidos e o rastreio num lugar só", Icon: TruckIcon },
            {
              text: "Endereços salvos para comprar mais rápido",
              Icon: PinIcon,
            },
            { text: "Pix aprovado na hora", Icon: PixIcon },
          ].map(({ text, Icon: ItemIcon }) => (
            <li key={text} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-white/10 text-lima"
              >
                <ItemIcon size={20} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      <div
        style={{ animationDelay: "120ms" }}
        className="ba-entra relative mx-auto flex w-full max-w-[480px] flex-col gap-6 overflow-hidden rounded-[22px] bg-white p-6 shadow-[0_24px_60px_-20px_rgba(10,15,61,.6)] md:rounded-[28px] md:p-10"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#3324F5,#7ADFFF_50%,#FF9AC8)]"
        />
        <div className="flex flex-col gap-4">
          {icone ? (
            <div className="flex size-12 items-center justify-center rounded-[14px] bg-ultramar-50 text-ultramar">
              <Icon />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <h1 className="m-0 font-display text-[26px] font-extrabold tracking-[-0.02em] text-noite md:text-[30px]">
              {titulo}
            </h1>
            {subtitulo ? (
              <p className="m-0 text-[15px] text-texto-2">{subtitulo}</p>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

/** "ou" divider between e-mail login and Google. */
export function OrDivider({ texto = "ou" }: { texto?: string }) {
  return (
    <div
      className="flex items-center gap-3 text-sm text-texto-2"
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-borda" />
      {texto}
      <span className="h-px flex-1 bg-borda" />
    </div>
  );
}
