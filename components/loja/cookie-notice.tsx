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
      className="fixed inset-x-4 bottom-[calc(64px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-[900px] flex-col gap-4 rounded-[22px] bg-noite p-5 text-lavanda shadow-lg motion-safe:animate-[cookie-notice-in_200ms_ease-out_both] md:bottom-4 md:flex-row md:items-center"
    >
      <p className="flex-1 font-sans text-sm leading-relaxed">
        Usamos só cookies necessários para o site funcionar (login, carrinho).
        Nada de anúncios.{" "}
        <Link
          href="/privacidade#cookies"
          className="inline-flex min-h-11 items-center font-bold text-lima underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lima"
        >
          Saiba mais
        </Link>
      </p>
      <button
        type="button"
        onClick={acknowledge}
        className="min-h-11 shrink-0 rounded-[14px] bg-lima px-6 font-display font-bold text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lima"
      >
        Entendi
      </button>
      <style>{`@keyframes cookie-notice-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </section>
  );
}
