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
    const observer = new IntersectionObserver((entries) =>
      setSummaryVisible(entries.some((e) => e.isIntersecting)),
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
        className="fixed inset-x-0 bottom-[calc(56px+max(22px,env(safe-area-inset-bottom)))] z-30 flex items-center gap-3 border-t border-borda bg-white/95 px-4 py-2.5 backdrop-blur transition-[opacity,transform] duration-200 data-escondida:pointer-events-none data-escondida:translate-y-3 data-escondida:opacity-0 md:hidden"
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
