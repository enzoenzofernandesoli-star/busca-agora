"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export const COOKIE_NOTICE_NAME = "ba_cookies_ok";
export function shouldShowNotice(cookieHeader: string): boolean {
  return !cookieHeader.split(";").some((part) => {
    const index = part.indexOf("=");
    return index >= 0 && part.slice(0, index).trim() === COOKIE_NOTICE_NAME;
  });
}
export function CookieNotice() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setVisible(shouldShowNotice(document.cookie));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  function acknowledge() {
    document.cookie = `${COOKIE_NOTICE_NAME}=1; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setVisible(false);
  }
  if (!visible) return null;
  return (
    <section
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-[calc(86px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-[900px] flex-row items-center gap-3 rounded-[18px] bg-noite py-2 pr-2 pl-4 text-lavanda shadow-lg motion-safe:animate-[cookie-notice-in_200ms_ease-out_both] md:bottom-4 md:gap-4 md:rounded-[22px] md:p-5"
    >
      <p className="flex-1 font-sans text-[13px] leading-snug md:text-sm md:leading-relaxed">
        Só cookies necessários (login, carrinho).{" "}
        <span className="hidden md:inline">Nada de anúncios. </span>
        <Link
          href="/privacidade#cookies"
          className="inline-flex min-h-11 items-center align-middle font-bold text-lima underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lima"
        >
          Saiba mais
        </Link>
      </p>
      <button
        type="button"
        onClick={acknowledge}
        className="min-h-11 shrink-0 rounded-[14px] bg-lima px-4 font-display font-bold text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lima md:px-6"
      >
        Entendi
      </button>
      <style>{`@keyframes cookie-notice-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </section>
  );
}
