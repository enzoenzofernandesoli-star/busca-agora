"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CartIcon } from "@/components/loja/icons";
import { cn } from "@/lib/utils";

type CartButtonProps = {
  variant: "desktop" | "mobile";
};

function cartLabel(count: number) {
  if (count === 0) return "Carrinho vazio";
  return count === 1 ? "Carrinho com 1 item" : `Carrinho com ${count} itens`;
}

/**
 * Units in the cart, read in the browser (the cart lives on the server,
 * keyed by session or cookie) so store pages stay cacheable. Refreshes on
 * navigation and on the "ba:carrinho" event sent after adding a product.
 */
export function useCartCount(): number {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/carrinho/contagem", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { count?: number } | null) => {
        if (typeof body?.count === "number") setCount(body.count);
      })
      .catch(() => {
        // Offline or aborted: keep the last known count.
      });
    return () => controller.abort();
  }, [pathname]);

  useEffect(() => {
    function onChange(event: Event) {
      const detail = (event as CustomEvent<{ count?: number }>).detail;
      if (typeof detail?.count === "number") setCount(detail.count);
    }
    window.addEventListener("ba:carrinho", onChange);
    return () => window.removeEventListener("ba:carrinho", onChange);
  }, []);

  return count;
}

export function CartButton({ variant }: CartButtonProps) {
  const desktop = variant === "desktop";
  const count = useCartCount();
  return (
    <Link
      href="/carrinho"
      aria-label={cartLabel(count)}
      className={cn(
        "relative flex flex-none items-center justify-center bg-white/12 text-white hover:bg-white/20 hover:text-white",
        desktop ? "size-12 rounded-[14px]" : "size-11 rounded-xl",
      )}
    >
      <CartIcon size={desktop ? 24 : 22} />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute flex items-center justify-center bg-lima font-bold text-noite",
            desktop
              ? "-top-1.5 -right-1.5 h-[22px] min-w-[22px] rounded-[11px] px-1.5 text-xs"
              : "-top-[5px] -right-[5px] h-5 min-w-5 rounded-[10px] px-1 text-[11px]",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
