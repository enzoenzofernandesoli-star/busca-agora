"use client";

import { useLayoutEffect } from "react";

// Plays when the browser opens the store on the Home (new tab, typed URL,
// F5, installed app). Never when the visitor reaches the Home by a link
// inside the store: module state survives client navigations, and a page
// load that started elsewhere (a product link) is not an opening.
let shownThisPageLoad = false;
// The overlay this page load opened with: React may run the effect twice for
// the same element (dev Strict Mode); that re-run must keep it open.
let openedElement: Element | null = null;

function openedOnHome(): boolean {
  const entry = performance.getEntriesByType("navigation")[0];
  if (!entry) return false;
  return new URL(entry.name).pathname === "/";
}

function focusBody() {
  const body = document.body;
  const previousTabIndex = body.getAttribute("tabindex");
  body.setAttribute("tabindex", "-1");
  body.focus({ preventScroll: true });
  if (previousTabIndex === null) body.removeAttribute("tabindex");
  else body.setAttribute("tabindex", previousTabIndex);
}

/**
 * Behaviour of the server-rendered Splash (#ba-splash). Renders nothing; it
 * only hides the overlay (the `hidden` attribute) and manages scroll lock,
 * focus and keys while it is open. Layout effect: on a client navigation to
 * the Home the overlay is hidden before the browser paints it.
 */
export function SplashController() {
  useLayoutEffect(() => {
    const splash = document.getElementById("ba-splash");
    if (!splash) return;
    const skip = splash.querySelector<HTMLButtonElement>("[data-splash-pular]");
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const rerun = splash === openedElement;
    if (!rerun && (shownThisPageLoad || !openedOnHome() || reduced)) {
      shownThisPageLoad = true;
      splash.hidden = true;
      focusBody();
      return;
    }
    shownThisPageLoad = true;
    openedElement = splash;

    const body = document.body;
    const previousOverflow = body.style.getPropertyValue("overflow");
    const previousPriority = body.style.getPropertyPriority("overflow");
    body.style.setProperty("overflow", "hidden", "important");
    skip?.focus({ preventScroll: true });

    let open = true;
    function release() {
      if (!open) return;
      open = false;
      window.clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown, true);
      skip?.removeEventListener("click", fecharSplash);
      if (previousOverflow)
        body.style.setProperty("overflow", previousOverflow, previousPriority);
      else body.style.removeProperty("overflow");
      focusBody();
    }
    function fecharSplash() {
      splash?.setAttribute("hidden", "");
      release();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        fecharSplash();
      } else if (event.key === "Tab") {
        event.preventDefault();
        skip?.focus({ preventScroll: true });
      }
    }
    // 1.5 s from the page load, like the CSS fade, not from hydration: on a
    // slow phone the page must not stay locked after the splash faded out.
    const timeoutId = window.setTimeout(
      fecharSplash,
      Math.max(0, 1500 - performance.now()),
    );
    document.addEventListener("keydown", handleKeyDown, true);
    skip?.addEventListener("click", fecharSplash);
    return release;
  }, []);

  return null;
}
