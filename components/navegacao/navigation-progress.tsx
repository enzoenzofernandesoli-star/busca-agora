"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { NAV_START_EVENT } from "@/lib/navigation-events";

type Navegacao =
  | { fase: "parado" }
  | { fase: "carregando"; alvo: string; partida: string; desde: number }
  | { fase: "terminando" };

/**
 * Thin bar at the top of the screen from the click until the new page is on
 * screen, so a slow network or a cold server never looks like a frozen site.
 * Starts on Next.js' own navigation signal (instrumentation-client.ts).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const atual = pathname + (searchParams.size ? `?${searchParams}` : "");
  const [nav, setNav] = useState<Navegacao>({ fase: "parado" });
  const barra = useRef<HTMLDivElement>(null);

  // Route on screen, for the event handler (updated after each commit).
  const atualRef = useRef(atual);
  useEffect(() => {
    atualRef.current = atual;
  }, [atual]);

  useEffect(() => {
    function onStart(event: Event) {
      let destino: URL;
      try {
        destino = new URL(
          (event as CustomEvent<string>).detail,
          window.location.href,
        );
      } catch {
        return;
      }
      const alvo = destino.pathname + destino.search;
      // Same page (only the #hash changes): nothing to wait for.
      if (alvo === atualRef.current) return;
      setNav({
        fase: "carregando",
        alvo,
        partida: atualRef.current,
        desde: performance.now(),
      });
    }
    window.addEventListener(NAV_START_EVENT, onStart);
    // Listening: links now navigate on the client (tests wait for this).
    barra.current?.setAttribute("data-pronto", "1");
    return () => window.removeEventListener(NAV_START_EVENT, onStart);
  }, []);

  // Arrived: the target is on screen, or the route changed at all since the
  // click (a redirect lands somewhere else). Covers navigations that finish
  // before the start event is even handled.
  if (
    nav.fase === "carregando" &&
    (atual === nav.alvo || atual !== nav.partida)
  ) {
    setNav({ fase: "terminando" });
  }

  // Arrived without a URL change (the server redirected back to the page we
  // were on, e.g. /conta -> /entrar while already on /entrar): the target's
  // data request (RSC fetch, "_rsc" query) finished, so the router has what
  // it needs. A short delay lets it paint first.
  useEffect(() => {
    if (nav.fase !== "carregando" || typeof PerformanceObserver === "undefined")
      return;
    const alvoPath = nav.alvo.split("?")[0];
    let t: number | undefined;
    const obs = new PerformanceObserver((lista) => {
      const chegou = lista.getEntries().some((e) => {
        if (e.startTime < nav.desde - 50) return false;
        try {
          const u = new URL(e.name);
          return u.searchParams.has("_rsc") && u.pathname === alvoPath;
        } catch {
          return false;
        }
      });
      if (chegou && t === undefined) {
        t = window.setTimeout(() => setNav({ fase: "terminando" }), 150);
      }
    });
    obs.observe({ type: "resource", buffered: false });
    return () => {
      obs.disconnect();
      window.clearTimeout(t);
    };
  }, [nav]);

  useEffect(() => {
    if (nav.fase === "parado") return;
    // Fade out after finishing. 15 s is only the last resort for a
    // navigation that never answers.
    const t = window.setTimeout(
      () => setNav({ fase: "parado" }),
      nav.fase === "terminando" ? 300 : 15_000,
    );
    return () => window.clearTimeout(t);
  }, [nav]);

  const fase = nav.fase;
  return (
    <div
      ref={barra}
      aria-hidden="true"
      data-testid="barra-navegacao"
      data-fase={fase}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] transition-opacity duration-300 ${
        fase === "parado" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`relative h-full overflow-hidden bg-lima shadow-[0_0_8px_rgba(198,255,61,.8)] ${
          fase === "carregando"
            ? "w-[85%] transition-[width] duration-[8000ms] ease-[cubic-bezier(.1,.7,.2,1)]"
            : fase === "terminando"
              ? "w-full transition-[width] duration-200 ease-out"
              : "w-0"
        }`}
      >
        <span className="absolute inset-0 animate-[nav-shimmer_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      </div>
    </div>
  );
}
