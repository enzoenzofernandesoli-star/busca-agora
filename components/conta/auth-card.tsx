import type { ReactNode } from "react";

type AuthCardProps = {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
};

// Centered card for /entrar, /cadastro and password pages. No dedicated
// design file: same card, radius and type scale as the approved screens.
export function AuthCard({ titulo, subtitulo, children }: AuthCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6 rounded-[22px] border border-borda bg-white p-6 md:rounded-[28px] md:p-10">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-[26px] font-extrabold tracking-[-0.02em] md:text-[30px]">
          {titulo}
        </h1>
        {subtitulo ? (
          <p className="m-0 text-[15px] text-texto-2">{subtitulo}</p>
        ) : null}
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
