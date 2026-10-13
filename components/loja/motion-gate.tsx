"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Pauses the looping decorations (bands, floating art, waves) of every page
 * block that is off screen, so the phone only animates what can be seen.
 * Blocks are the page's top-level children plus the footer; each gets
 * `.ba-fora` while it is more than 200 px away from the screen.
 */
export function MotionGate() {
  const pathname = usePathname();

  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLElement>(
      "#conteudo > * > *, #conteudo > :not(div), body footer",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          e.target.classList.toggle("ba-fora", !e.isIntersecting);
      },
      { rootMargin: "200px 0px" },
    );
    blocks.forEach((b) => observer.observe(b));
    return () => {
      observer.disconnect();
      blocks.forEach((b) => b.classList.remove("ba-fora"));
    };
  }, [pathname]);

  return null;
}
