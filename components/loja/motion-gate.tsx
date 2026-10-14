"use client";

import { useEffect } from "react";

const BLOCKS = "#conteudo > * > *, #conteudo > :not(div), #conteudo ~ footer";

/**
 * Pauses the looping decorations (bands, floating art, waves) of every page
 * block that is off screen, so the phone only animates what can be seen.
 * Blocks are the page's top-level children plus the footer; each gets
 * `.ba-fora` while it is more than 200 px away from the screen. Blocks that
 * arrive later (streamed after a loading screen, or swapped by a filter on
 * the same route) are picked up by watching the page's child list.
 */
export function MotionGate() {
  useEffect(() => {
    const main = document.getElementById("conteudo");
    if (!main) return;
    const intersection = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          e.target.classList.toggle("ba-fora", !e.isIntersecting);
      },
      { rootMargin: "200px 0px" },
    );
    let observed = new Set<Element>();
    const sync = () => {
      const current = new Set(document.querySelectorAll(BLOCKS));
      for (const el of observed)
        if (!current.has(el)) {
          intersection.unobserve(el);
          el.classList.remove("ba-fora");
        }
      for (const el of current) if (!observed.has(el)) intersection.observe(el);
      observed = current;
    };
    let frame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    });
    // Only the two levels that hold the blocks, not the whole subtree.
    mutations.observe(main, { childList: true });
    const watchWrappers = () => {
      for (const child of main.children)
        mutations.observe(child, { childList: true });
    };
    watchWrappers();
    const wrappers = new MutationObserver(watchWrappers);
    wrappers.observe(main, { childList: true });
    sync();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      wrappers.disconnect();
      intersection.disconnect();
      for (const el of observed) el.classList.remove("ba-fora");
    };
  }, []);

  return null;
}
