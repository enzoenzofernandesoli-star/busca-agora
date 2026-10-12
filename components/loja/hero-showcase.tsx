"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Product photo on the right of the Home hero, following the slogan word
 * (RotatingWord sends "ba:palavra"). On each word the old photo slides out,
 * the new one rises in, and a decoration of that word draws itself from the
 * title, behind everything, until it reaches the product. Photos are
 * illustrative compositions (public/hero), not catalogue items.
 */
const fotos = [
  { src: "/hero/fone.webp", glow: "rgba(122,223,255,.45)" },
  { src: "/hero/serum.webp", glow: "rgba(255,154,200,.45)" },
  { src: "/hero/batom.webp", glow: "rgba(255,154,200,.5)" },
  { src: "/hero/cabo.webp", glow: "rgba(220,223,255,.22)" },
];

type Estado = { atual: number; anterior: number | null; vez: number };

/**
 * True once the page has loaded and the browser is idle: the trail and the
 * next photo wait for it, so they never compete with the first paint and
 * hydration (Lighthouse TBT rose when everything started at once).
 */
function usePagePronta(): boolean {
  const [pronta, setPronta] = useState(false);
  useEffect(() => {
    let cancelado = false;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const marcar = () => {
      if (!cancelado) setPronta(true);
    };
    const agendar = () => {
      if ("requestIdleCallback" in window)
        idle = window.requestIdleCallback(marcar, { timeout: 2500 });
      else timer = setTimeout(marcar, 1200);
    };
    if (document.readyState === "complete") agendar();
    else window.addEventListener("load", agendar, { once: true });
    return () => {
      cancelado = true;
      window.removeEventListener("load", agendar);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);
  return pronta;
}

export function HeroShowcase() {
  const [{ atual, anterior, vez }, setEstado] = useState<Estado>({
    atual: 0,
    anterior: null,
    vez: 0,
  });
  const pronta = usePagePronta();

  useEffect(() => {
    function onWord(event: Event) {
      const index = (event as CustomEvent<{ index?: number }>).detail?.index;
      if (typeof index !== "number") return;
      const proximo = index % fotos.length;
      setEstado((e) =>
        e.atual === proximo
          ? e
          : { atual: proximo, anterior: e.atual, vez: e.vez + 1 },
      );
    }
    window.addEventListener("ba:palavra", onWord);
    return () => window.removeEventListener("ba:palavra", onWord);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute right-1 bottom-2 aspect-square w-[44%] max-w-[180px] md:relative md:right-auto md:bottom-auto md:w-full md:max-w-[400px] md:justify-self-end lg:max-w-[440px] 2xl:max-w-[480px] 2xl:justify-self-center"
    >
      {pronta || vez > 0 ? (
        <HeroTrail tema={atual % trilhas.length} vez={vez} />
      ) : null}
      {/* Soft glow in the word's colour, so dark products read on navy. */}
      <div
        className="absolute inset-[8%] rounded-full blur-3xl transition-[background-color] duration-700"
        style={{ backgroundColor: fotos[atual]?.glow }}
      />
      {fotos.map((foto, i) => {
        const proxima = (atual + 1) % fotos.length;
        const estado = i === atual ? "in" : i === anterior ? "out" : "hidden";
        // Mount only what is on screen plus, once the page is idle, the next
        // photo (hidden) so it is already loaded when the word changes.
        if (estado === "hidden" && !(pronta && i === proxima)) return null;
        return (
          <Image
            // Re-mount the incoming photo so its entrance replays.
            key={i === atual ? `in-${vez}` : `f-${i}`}
            src={foto.src}
            alt=""
            fill
            sizes="(min-width: 1536px) 480px, (min-width: 1024px) 440px, (min-width: 768px) 400px, 180px"
            preload={i === 0}
            className={cn(
              "object-contain",
              // The shadow filter is costly to paint: only on the shown photo.
              estado === "in" && "drop-shadow-[0_24px_40px_rgba(0,0,0,.35)]",
              estado === "hidden" && "opacity-0",
              estado === "in" &&
                vez > 0 &&
                "motion-safe:animate-[ba-hero-in_700ms_cubic-bezier(.2,.8,.2,1)_160ms_both]",
              estado === "out" &&
                "motion-safe:animate-[ba-hero-out_260ms_ease-in_both] motion-reduce:opacity-0",
            )}
          />
        );
      })}
    </div>
  );
}

/**
 * Line art of each word. It lives in the photo box and reaches 60% of the
 * photo width to its left (the gap after the title), so it never crosses the
 * text; viewBox 160x120 matches that box (photo = x 60–160), no stretching.
 */
const trilhas: {
  caminho: string;
  cor: string;
  largura: number;
  tracejado?: string;
  enfeites: React.ReactNode;
  viajante: React.ReactNode;
}[] = [
  {
    // fone: a sound wave reaching the headphones, which answer with rings.
    caminho: "M2 42 C 9 30, 16 54, 24 42 S 39 30, 47 44 S 60 62, 70 56",
    cor: "#7ADFFF",
    largura: 1.1,
    enfeites: (
      <g fill="none" stroke="#7ADFFF" strokeWidth="1" strokeLinecap="round">
        <path className="ba-onda ba-onda-1" d="M76 46 a14 14 0 0 0 0 28" />
        <path className="ba-onda ba-onda-2" d="M70 40 a22 22 0 0 0 0 40" />
        <path className="ba-onda ba-onda-3" d="M64 34 a30 30 0 0 0 0 52" />
      </g>
    ),
    viajante: <circle r="1.8" fill="#C6FF3D" />,
  },
  {
    // sérum: a trail of drops falling along a curve to the bottle.
    caminho: "M2 30 C 20 18, 38 22, 50 40 S 64 70, 74 64",
    cor: "#FF9AC8",
    largura: 2.4,
    tracejado: "0.004 0.03",
    enfeites: (
      <g fill="#FF9AC8">
        <path
          className="ba-gota ba-gota-1"
          d="M42 70 c0 0 -2.6 3.2 -2.6 4.8 a2.6 2.6 0 0 0 5.2 0 c0 -1.6 -2.6 -4.8 -2.6 -4.8z"
        />
        <path
          className="ba-gota ba-gota-2"
          d="M52 84 c0 0 -1.8 2.2 -1.8 3.3 a1.8 1.8 0 0 0 3.6 0 c0 -1.1 -1.8 -3.3 -1.8 -3.3z"
        />
      </g>
    ),
    viajante: (
      <path
        d="M0 -3.2 c0 0 -2.2 2.7 -2.2 4 a2.2 2.2 0 0 0 4.4 0 c0 -1.3 -2.2 -4 -2.2 -4z"
        fill="#FF9AC8"
      />
    ),
  },
  {
    // batom: a lipstick swatch brushed behind the product.
    caminho: "M2 54 C 20 38, 40 78, 60 60 S 98 42, 124 68",
    cor: "#FF9AC8",
    largura: 7,
    enfeites: null,
    viajante: <circle r="1.6" fill="#fff" />,
  },
  {
    // cabo: a cable with an energy bolt running to the charger.
    caminho: "M2 46 C 18 46, 18 78, 36 78 S 52 48, 62 56 S 72 78, 78 72",
    cor: "#E3E5F2",
    largura: 1.5,
    enfeites: null,
    viajante: (
      <path d="M0.6 -3.6 -2.4 0.6h2.1l-0.8 3.2 3.1-4.2h-2.1z" fill="#C6FF3D" />
    ),
  },
];

/** Driven by HeroShowcase's state: mounting late still shows the current word. */
function HeroTrail({ tema, vez }: { tema: number; vez: number }) {
  const motionRef = useRef<SVGAnimateMotionElement>(null);

  useEffect(() => {
    // SMIL begin times are document-relative: start each new run by hand.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    motionRef.current?.beginElement();
  }, [vez]);

  const t = trilhas[tema] ?? trilhas[0];
  if (!t) return null;
  const id = `ba-trilha-${tema}`;
  return (
    <svg
      key={vez}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 160 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -inset-y-[10%] right-0 -left-[60%] hidden h-[120%] w-[160%] overflow-visible md:block"
    >
      <path
        id={id}
        d={t.caminho}
        pathLength={1}
        fill="none"
        stroke={t.cor}
        strokeWidth={t.largura}
        strokeLinecap="round"
        strokeDasharray={t.tracejado}
        className={cn(
          "ba-trilha",
          !t.tracejado && "ba-trilha-desenha",
          tema === 2 ? "opacity-60" : "opacity-90",
        )}
      />
      <g className="ba-trilha-enfeites">{t.enfeites}</g>
      <g className="ba-trilha-viajante">
        {t.viajante}
        <animateMotion
          ref={motionRef}
          dur="1.1s"
          begin="indefinite"
          fill="freeze"
          keyPoints="0;1"
          keyTimes="0;1"
          calcMode="spline"
          keySplines=".3 0 .2 1"
        >
          <mpath href={`#${id}`} />
        </animateMotion>
      </g>
    </svg>
  );
}
