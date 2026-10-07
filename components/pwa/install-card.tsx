"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
type InstallMode = "android" | "ios" | "outro" | "instalado";
const DISMISS_KEY = "ba_instalar_dispensado";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;
const focus =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lima";

export function InstallCard({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<InstallMode | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const isStandalone = () =>
      media.matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const ua = navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    let cancelled = false;
    // Defer initialization until after hydration, including unavailable storage.
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const stored = localStorage.getItem(DISMISS_KEY);
        const time = stored ? Date.parse(stored) : NaN;
        if (
          Number.isFinite(time) &&
          time <= Date.now() &&
          Date.now() - time < DISMISS_MS
        )
          setDismissed(true);
      } catch {
        /* Installation remains optional when storage is blocked. */
      }
      setMode(isStandalone() ? "instalado" : ios && safari ? "ios" : "outro");
    });
    const onPrompt = (event: Event) => {
      if (!("prompt" in event) || !("userChoice" in event) || isStandalone())
        return;
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => {
      setMode("instalado");
      setInstallEvent(null);
    };
    const onDisplayChange = () => {
      if (isStandalone()) onInstalled();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", onDisplayChange);
    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onDisplayChange);
    };
  }, []);
  async function install() {
    if (!installEvent || busy) return;
    setBusy(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setMode("instalado");
      else setMode("outro");
    } catch {
      setMode("outro");
    } finally {
      setInstallEvent(null);
      setBusy(false);
    }
  }
  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      /* Still dismiss this instance. */
    }
    setDismissed(true);
  }
  if (mode === null || mode === "instalado" || dismissed) return null;
  return (
    <section
      aria-live="polite"
      className={`rounded-[22px] bg-ultramar p-6 text-white ${className}`}
    >
      <Image
        src="/brand/logo-e-branco.svg"
        alt=""
        width={46}
        height={46}
        unoptimized
      />
      <h2 className="mt-4 font-display text-xl font-extrabold">
        Coloque a Busca Agora na sua tela inicial
      </h2>
      <p className="mt-2 font-sans text-[16px] leading-relaxed text-lavanda">
        Abre em tela cheia e seus pedidos ficam sempre à mão.
      </p>
      {mode === "android" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void install()}
          className={`mt-5 min-h-12 rounded-[14px] bg-lima px-6 font-display font-bold text-noite disabled:opacity-60 ${focus}`}
        >
          {busy ? "Abrindo instalação…" : "Instalar app"}
        </button>
      )}
      {mode === "ios" && (
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-lavanda">
          <li>
            Toque em Compartilhar{" "}
            <svg
              aria-hidden="true"
              className="inline size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 9H5v12h14V9h-3M12 16V3m-4 4 4-4 4 4" />
            </svg>
          </li>
          <li>
            “Adicionar à Tela de Início”{" "}
            <svg
              aria-hidden="true"
              className="inline size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="4" width="16" height="16" rx="3" />
              <path d="M12 8v8m-4-4h8" />
            </svg>
          </li>
          <li>
            “Adicionar”{" "}
            <svg
              aria-hidden="true"
              className="inline size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          </li>
        </ol>
      )}
      {mode === "outro" && (
        // Phones whose browser did not offer the native prompt (yet): the
        // same manual path as docs/design/Celular-Home.dc.html.
        <p className="mt-4 text-lavanda">
          <span className="md:hidden">
            No menu <b className="text-white">⋮</b> do navegador, toque em{" "}
            <b className="text-white">Adicionar à tela inicial</b>.
          </span>
          <span className="hidden md:inline">
            Abra este site no celular para instalar.
          </span>
        </p>
      )}
      <button
        type="button"
        onClick={dismiss}
        className={`mt-3 block min-h-11 font-sans font-bold text-white underline underline-offset-4 ${focus}`}
      >
        Agora não
      </button>
    </section>
  );
}
