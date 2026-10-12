import Image from "next/image";

import { SplashController } from "@/components/loja/splash-controller";

/**
 * Opening animation of the Home. The markup is a Server Component (nothing
 * of it hydrates); SplashController, a tiny client piece, closes it after
 * 1.5 s, on "Pular" or Escape, locks the scroll and keeps the focus while it
 * is open, and hides it when the Home was not the page that opened the store.
 */
export function Splash() {
  return (
    <div
      id="ba-splash"
      role="dialog"
      aria-modal="true"
      aria-label="Abertura da Busca Agora"
      className="ba-splash fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-ultramar px-7 py-10 font-sans text-white md:px-6 md:py-12"
    >
      <div
        aria-hidden="true"
        className="ba-splash-ring pointer-events-none absolute -top-[130px] -right-[150px] size-[380px] rounded-full border-[56px] border-white/[0.06] md:-top-[220px] md:-right-[180px] md:size-[640px] md:border-[90px]"
      />
      <div
        aria-hidden="true"
        className="ba-splash-ring ba-splash-ring-secondary pointer-events-none absolute -bottom-[220px] -left-[200px] size-[460px] rounded-full border-2 border-white/[0.12] md:-bottom-[320px] md:-left-[260px] md:size-[760px]"
      />
      <div
        aria-hidden="true"
        className="absolute top-11 left-12 hidden gap-2 md:flex"
      >
        <span className="ba-splash-tag h-2.5 w-11 rounded-[3px] bg-ciano" />
        <span className="ba-splash-tag h-2.5 w-11 rounded-[3px] bg-rosa [animation-delay:140ms]" />
        <span className="ba-splash-tag h-2.5 w-11 rounded-[3px] bg-lima [animation-delay:200ms]" />
      </div>
      <div className="relative flex w-full max-w-[760px] flex-col items-center gap-7 text-center md:gap-9">
        <Image
          src="/brand/logo-d-branco.svg"
          alt="Busca Agora"
          width={600}
          height={95}
          unoptimized
          style={{ height: "auto" }}
          preload
          className="ba-splash-logo hidden h-auto w-[min(600px,86vw)] md:block"
        />
        <Image
          src="/brand/logo-e-branco.svg"
          alt="Busca Agora"
          width={240}
          height={240}
          unoptimized
          style={{ height: "auto" }}
          preload
          className="ba-splash-logo block h-auto w-[240px] md:hidden"
        />
        <p className="ba-splash-slogan m-0 font-display text-[38px] leading-[1.02] font-extrabold tracking-[-0.03em] md:text-[clamp(36px,5vw,64px)] md:leading-none">
          Buscou?
          <br className="md:hidden" />
          <span className="hidden md:inline"> </span>
          <span className="text-lima">Tá aqui.</span>
        </p>
        <p className="ba-splash-subtitle m-0 max-w-[280px] text-[17px] leading-[1.5] text-lavanda md:max-w-none md:text-xl">
          Eletrônicos e cosméticos, do clique até a sua porta.
        </p>
        <div
          aria-hidden="true"
          className="h-1 w-[180px] overflow-hidden rounded bg-white/[0.18] md:w-[240px]"
        >
          <div className="ba-splash-bar h-full w-full origin-left rounded bg-lima" />
        </div>
        <button
          type="button"
          data-splash-pular=""
          className="fixed right-7 bottom-12 left-7 inline-flex min-h-14 cursor-pointer items-center justify-center gap-2.5 rounded-[18px] bg-lima px-8 font-display text-[17px] font-bold text-noite hover:bg-lima-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:static md:gap-3 md:rounded-full md:text-lg"
        >
          Pular
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </div>
      <p className="ba-splash-subtitle absolute inset-x-0 bottom-8 m-0 hidden text-center text-sm tracking-[0.08em] text-lavanda-500 md:block">
        BUSCAAGORA.COM.BR
      </p>
      <style>{`
        @keyframes ba-splash-up {
          from { opacity: 0; transform: translateY(24px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ba-splash-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ba-splash-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes ba-splash-ring-in {
          from { opacity: 0; transform: scale(.7); }
          to { opacity: 1; transform: scale(1); }
        }
        /* visibility: hidden at the end, so a page without JavaScript is never blocked */
        @keyframes ba-splash-exit { from { opacity: 1; } to { opacity: 0; visibility: hidden; } }
        .ba-splash { animation: ba-splash-exit 200ms ease 1300ms both; }
        .ba-splash-ring { animation: ba-splash-ring-in 600ms cubic-bezier(.2,.8,.2,1) both; }
        .ba-splash-ring-secondary { animation-delay: 120ms; }
        .ba-splash-logo { animation: ba-splash-up 360ms cubic-bezier(.2,.8,.2,1) 60ms both; }
        .ba-splash-slogan { animation: ba-splash-up 320ms cubic-bezier(.2,.8,.2,1) 300ms both; }
        .ba-splash-subtitle { animation: ba-splash-fade-in 320ms ease 440ms both; }
        .ba-splash-bar { animation: ba-splash-grow 800ms cubic-bezier(.6,0,.2,1) 200ms both; }
        .ba-splash-tag { transform-origin: left center; animation: ba-splash-grow 280ms cubic-bezier(.2,.8,.2,1) 80ms both; }
        @media (prefers-reduced-motion: reduce) {
          .ba-splash { display: none; }
          .ba-splash, .ba-splash * { animation: none !important; }
        }
      `}</style>
      <SplashController />
    </div>
  );
}
