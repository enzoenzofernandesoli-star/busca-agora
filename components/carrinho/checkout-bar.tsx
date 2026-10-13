"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatBRL } from "@/lib/format";

/**
 * Phone-only bar above the bottom nav with the cart total and the way to the
 * checkout, so it is always one tap away. It hides while the summary's own
 * button (`#carrinho-continuar`) is on screen, so the two never show at once.
 * Display only: the server recalculates everything at checkout.
 */
export function CheckoutBar({ subtotalCents }: { subtotalCents: number }) {
  const [summaryVisible, setSummaryVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("carrinho-continuar");
    if (!target) return;
    // Only the part of the screen above the fixed bottom nav counts, and the
    // button must be fully there: a button half behind the nav is not usable.
    const nav = document.querySelector<HTMLElement>(
      'nav[aria-label="Navegação principal"]',
    );
    const navHeight = nav?.offsetHeight ?? 0;
    const observer = new IntersectionObserver(
      (entries) =>
        setSummaryVisible(
          entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.99),
        ),
      { rootMargin: `0px 0px -${navHeight}px 0px`, threshold: [0, 0.99, 1] },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Room at the end of the page so the bar never covers the content. */}
      <div aria-hidden="true" className="h-16 md:hidden" />
      <div
        data-escondida={summaryVisible ? "" : undefined}
        className="fixed inset-x-0 bottom-[calc(56px+max(22px,env(safe-area-inset-bottom)))] z-30 flex items-center gap-3 border-t border-borda bg-white px-4 py-2.5 shadow-[0_-8px_24px_-12px_rgba(10,15,61,.25)] data-escondida:pointer-events-none data-escondida:opacity-0 motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:data-escondida:translate-y-3 md:hidden"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] text-texto-2">Total + frete</span>
          <span className="font-display text-xl leading-tight font-extrabold text-noite">
            {formatBRL(subtotalCents)}
          </span>
        </div>
        <Link
          href="/checkout"
          tabIndex={summaryVisible ? -1 : undefined}
          aria-hidden={summaryVisible ? true : undefined}
          className="flex min-h-12 items-center justify-center rounded-[14px] bg-ultramar px-5 font-display text-base font-bold text-white no-underline hover:bg-ultramar-700 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
        >
          Continuar
        </Link>
      </div>
    </>
  );
}
