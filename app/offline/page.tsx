/* eslint-disable @next/next/no-html-link-for-pages -- Offline recovery requires a full navigation without client routing. */
import Image from "next/image";

export const dynamic = "force-static";
export const metadata = {
  title: "Sem conexão",
  description: "Confira sua internet para continuar na Busca Agora.",
  robots: { index: false, follow: false },
};
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-fundo px-6 py-12 text-center font-sans text-noite">
      <Image
        src="/brand/logo-e-escuro.svg"
        alt=""
        width={120}
        height={120}
        unoptimized
      />
      <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
        Sem conexão
      </h1>
      <p className="max-w-sm text-[16px] leading-relaxed text-texto-2">
        Confira sua internet. Assim que voltar, é só tentar de novo.
      </p>
      <a
        href="/"
        className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-ultramar px-7 font-display font-bold text-white hover:bg-ultramar-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
      >
        Tentar de novo
      </a>
      <p className="mt-4 font-display text-sm font-bold">Buscou? Tá aqui.</p>
    </main>
  );
}
