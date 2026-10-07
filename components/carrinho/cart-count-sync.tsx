"use client";

import { useEffect } from "react";

/**
 * The cart page is re-rendered by the server after every quantity change
 * or removal; this tells the header badge the new count (same event the
 * "Adicionar ao carrinho" button sends).
 */
export function CartCountSync({ count }: { count: number }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ba:carrinho", { detail: { count } }));
  }, [count]);
  return null;
}
