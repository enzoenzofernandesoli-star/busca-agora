import type { ReactNode } from "react";

import { ShieldCheckIcon, UserIcon } from "@/components/loja/icons";

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

// Centered card for /entrar, /cadastro and password pages. No dedicated
// design file: same card, radius and type scale as the approved screens.
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
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6 rounded-[22px] border border-borda bg-white p-6 md:rounded-[28px] md:p-10">
      <div className="flex flex-col gap-4">
        {icone ? (
          <div className="flex size-12 items-center justify-center rounded-[14px] bg-ultramar-50 text-ultramar">
            <Icon />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <h1 className="m-0 font-display text-[26px] font-extrabold tracking-[-0.02em] md:text-[30px]">
            {titulo}
          </h1>
          {subtitulo ? (
            <p className="m-0 text-[15px] text-texto-2">{subtitulo}</p>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

/** "ou" divider between e-mail login and Google. */
export function OrDivider() {
  return (
    <div
      className="flex items-center gap-3 text-sm text-texto-2"
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-borda" />
      ou
      <span className="h-px flex-1 bg-borda" />
    </div>
  );
}
