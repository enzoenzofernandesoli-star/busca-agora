import { Marquee } from "@/components/loja/marquee";

/**
 * Header of /busca?filtro=mais-buscados (decision of 12/10), same shape as
 * the Ofertas one: ultramar band, a magnifier sweeping over the store's
 * products and a rising "em alta" line, plus a lime running band. White text
 * sits on plain ultramar (7.7:1); the light ring stays behind the art.
 */
export function SearchedHeader({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="relative isolate grid items-center gap-6 overflow-hidden rounded-[24px] bg-ultramar p-6 text-white md:min-h-[216px] md:grid-cols-[3fr_2fr] md:gap-8 md:bg-[linear-gradient(110deg,#3324F5_0%,#3324F5_55%,#2416D6_78%,#0A0F3D_100%)] md:p-8">
        <div
          aria-hidden="true"
          className="ba-drift pointer-events-none absolute -top-28 -right-28 -z-10 hidden size-[340px] rounded-full border-[56px] border-white/12 md:block"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[.1em] text-lavanda uppercase">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-[3px] bg-lima"
            />
            Em alta
          </span>
          <h1 className="m-0 font-display text-[34px] leading-none font-extrabold tracking-[-0.03em] md:text-[52px]">
            {/* Two lines on phones, so the corner art never touches it. */}
            Mais <br className="md:hidden" />
            buscados
          </h1>
          <p className="m-0 max-w-[460px] text-[15px] font-medium md:text-base">
            O que todo mundo está buscando agora.{" "}
            <span className="text-lima">Buscou? Tá aqui.</span>
          </p>
          <p className="m-0 mt-1 inline-flex self-start rounded-full bg-noite px-3 py-1 text-[13px] font-bold text-white">
            {total === 1 ? "1 produto" : `${total} produtos`} em alta
          </p>
        </div>
        <SearchedArt />
      </header>
      <Marquee
        itens={[
          "Mais buscados",
          "O que todo mundo procura",
          "Pix aprovado na hora",
          "Despacho em até 24 h",
          "Troca em até 7 dias",
        ]}
        className="-mx-4 w-[calc(100%+2rem)] md:mx-0 md:w-full md:rounded-[22px]"
      />
    </div>
  );
}

/** Magnifier sweeping over three product icons, and a rising trend line. */
function SearchedArt() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 160"
      className="pointer-events-none absolute top-3 right-3 h-auto w-[34%] max-w-[150px] md:relative md:top-auto md:right-auto md:w-full md:max-w-[320px] md:justify-self-end"
      fill="none"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Rising "em alta" line with its arrow. */}
      <path
        className="ba-trilha-desenha"
        pathLength={1}
        d="M20 138 70 112 112 124 168 82 214 96 286 34"
        stroke="#C6FF3D"
        strokeWidth="4"
      />
      <path d="M262 32h26v26" stroke="#C6FF3D" strokeWidth="4" />
      {/* Products the magnifier passes over. */}
      <g className="ba-float" style={{ animationDelay: "-1s" }}>
        <path d="M58 76v-8a16 16 0 0 1 32 0v8" />
        <rect x="54" y="72" width="9" height="16" rx="4" />
        <rect x="85" y="72" width="9" height="16" rx="4" />
      </g>
      <g className="ba-float" style={{ animationDelay: "-2.5s" }}>
        <path d="M146 40v-6h12v6" />
        <rect x="140" y="40" width="24" height="34" rx="6" />
        <path d="M146 54h12" />
      </g>
      <g className="ba-float" style={{ animationDelay: "-4s" }}>
        <rect x="222" y="58" width="22" height="30" rx="7" />
        <path d="M227 58v-6h12v6M227 88v6h12v-6" />
      </g>
      {/* Magnifier: lime lens, white handle, sweeping across. */}
      <g className="ba-scan">
        <circle
          cx="150"
          cy="70"
          r="34"
          stroke="#C6FF3D"
          strokeWidth="7"
          fill="#fff"
          fillOpacity=".12"
        />
        <path d="M175 95 205 125" strokeWidth="10" />
        <path d="M136 58a16 16 0 0 1 14-6" stroke="#fff" strokeOpacity=".8" />
      </g>
    </svg>
  );
}
