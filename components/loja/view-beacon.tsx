"use client";

import { useEffect } from "react";

/**
 * Tells the server a product page was opened (metrics). Fire and forget:
 * sendBeacon never delays the page; the server filters robots and repeats.
 */
export function ViewBeacon({ productId }: { productId: string }) {
  useEffect(() => {
    const body = JSON.stringify({ productId });
    const sent =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(
        "/api/eventos/view",
        new Blob([body], { type: "application/json" }),
      );
    if (!sent) {
      void fetch("/api/eventos/view", {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  }, [productId]);
  return null;
}
