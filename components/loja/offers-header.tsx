import { Marquee } from "@/components/loja/marquee";

/**
 * Header of /busca?filtro=ofertas (decision of 12/10): offer colours
 * (oferta red to oferta-sol yellow), floating price tags, "%" marks and a
 * bolt, plus a red running band. Decorations are aria-hidden and only move
 * with motion allowed (ba-float / ba-drift).
 */
export function OffersHeader({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="relative isolate grid items-center gap-6 overflow-hidden rounded-[24px] bg-oferta p-6 text-white md:min-h-[216px] md:grid-cols-[3fr_2fr] md:gap-8 md:bg-[linear-gradient(110deg,#D7261E_0%,#D7261E_52%,#F2611B_76%,#FFB020_100%)] md:p-8">
        {/* Phone: the yellow lives only in the corner behind the art, so
            white text always sits on red (contrast 5.2:1). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -bottom-14 -z-10 size-40 rounded-full bg-oferta-sol/70 blur-2xl md:hidden"
        />
        <div
          aria-hidden="true"
          className="ba-drift pointer-events-none absolute -top-24 -right-16 -z-10 size-72 rounded-full border-[48px] border-white/20 md:-top-40 md:right-[30%] md:size-[420px] md:border-[64px]"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[.1em] uppercase">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-[3px] bg-white"
            />
            Preço riscado
          </span>
          <h1 className="m-0 font-display text-[34px] leading-none font-extrabold tracking-[-0.03em] md:text-[52px]">
            Ofertas
          </h1>
          <p className="m-0 max-w-[460px] text-[15px] font-medium md:text-base">
            Preço baixo de verdade: tudo aqui tem preço riscado.
          </p>
          <p className="m-0 mt-1 inline-flex self-start rounded-full bg-noite px-3 py-1 text-[13px] font-bold text-white">
            {total === 1 ? "1 oferta" : `${total} ofertas`} agora
          </p>
        </div>
        <OffersArt />
      </header>
      <Marquee
        itens={[
          "Ofertas",
          "Preço riscado",
          "Pix aprovado na hora",
          "Despacho em até 24 h",
          "Troca em até 7 dias",
        ]}
        className="-mx-4 w-[calc(100%+2rem)] bg-oferta text-white md:mx-0 md:w-full md:rounded-[22px]"
      />
    </div>
  );
}

/** Price tags, "%" marks and a bolt on the right of the header. */
function OffersArt() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 160"
      className="pointer-events-none absolute right-3 bottom-3 h-auto w-[46%] max-w-[200px] opacity-90 md:relative md:right-auto md:bottom-auto md:w-full md:max-w-[320px] md:justify-self-end md:opacity-100"
      fill="none"
      stroke="#0A0F3D"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Big tag with "-%", swinging on its string. */}
      <g className="ba-float" style={{ transformOrigin: "200px 20px" }}>
        <path d="M200 12v22" />
        <path
          d="M156 52h88l24 34-24 34h-88a10 10 0 0 1-10-10V62a10 10 0 0 1 10-10Z"
          fill="#fff"
        />
        <circle cx="240" cy="86" r="6" fill="#FFB020" />
        <text
          x="196"
          y="98"
          textAnchor="middle"
          fontFamily="var(--font-display), sans-serif"
          fontWeight="800"
          fontSize="34"
          fill="#D7261E"
          stroke="none"
        >
          -%
        </text>
      </g>
      {/* Small tag. */}
      <g className="ba-float" style={{ animationDelay: "-2s" }}>
        <path
          d="M44 96h50l14 20-14 20H44a6 6 0 0 1-6-6v-28a6 6 0 0 1 6-6Z"
          fill="#C6FF3D"
        />
        <circle cx="92" cy="116" r="4" fill="#0A0F3D" stroke="none" />
      </g>
      {/* Percent marks and a bolt. */}
      <g
        fill="#fff"
        stroke="none"
        fontFamily="var(--font-display), sans-serif"
        fontWeight="800"
      >
        <text
          className="ba-drift"
          x="58"
          y="62"
          fontSize="40"
          transform="rotate(-12 70 50)"
        >
          %
        </text>
        <text
          className="ba-drift"
          style={{ animationDelay: "-4s" }}
          x="286"
          y="150"
          fontSize="24"
          transform="rotate(10 294 142)"
        >
          %
        </text>
      </g>
      <path
        className="ba-float"
        style={{ animationDelay: "-1s" }}
        d="M128 18 112 44h12l-6 22 20-30h-12l6-18Z"
        fill="#C6FF3D"
      />
    </svg>
  );
}
