"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeEnvironment(onChange: () => void) {
  const media = window.matchMedia(MOTION_QUERY);
  media.addEventListener("change", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function canAnimate() {
  return (
    document.visibilityState === "visible" &&
    !window.matchMedia(MOTION_QUERY).matches
  );
}

function serverCanAnimate() {
  return false;
}

/** Builds complete Unicode characters in both directions, without splitting surrogate pairs. */
export function typingFrames(exemplo: string, prefixo = "Busque "): string[] {
  const letters = Array.from(exemplo);
  const frames: string[] = [];
  for (let length = 1; length <= letters.length; length++) {
    frames.push(prefixo + letters.slice(0, length).join(""));
  }
  for (let length = letters.length - 1; length >= 0; length--) {
    frames.push(prefixo + letters.slice(0, length).join(""));
  }
  return frames;
}

/**
 * Types store examples into the field's placeholder while it is idle.
 * Writes the DOM attribute directly (no React state): re-rendering the form
 * every 55 ms cost the Home ~500 ms of main-thread time on phones. Only a
 * visible field animates (the header renders a phone and a desktop copy).
 * The server and hydration HTML keep `base`.
 */
export function useTypingPlaceholder(
  ref: RefObject<HTMLInputElement | null>,
  base: string,
  exemplos: string[],
  ativo: boolean,
): void {
  const environmentEnabled = useSyncExternalStore(
    subscribeEnvironment,
    canAnimate,
    serverCanAnimate,
  );
  // Content identity keeps equivalent inline arrays from restarting the timer.
  const examplesKey = JSON.stringify(exemplos);
  const enabled = ativo && environmentEnabled;

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.placeholder = base;
    const examples = (JSON.parse(examplesKey) as string[]).filter(
      (example) => example.length > 0,
    );
    // offsetParent is null while the field is display:none.
    if (!enabled || examples.length === 0 || input.offsetParent === null)
      return;

    let timer: ReturnType<typeof setTimeout>;
    let canceled = false;
    let exampleIndex = 0;
    let frameIndex = 0;
    let frames = typingFrames(examples[exampleIndex] ?? "");

    function step() {
      if (canceled || !canAnimate() || !input) return;
      input.placeholder = frames[frameIndex] ?? base;
      const fullFrameIndex = frames.length / 2 - 1;
      const delay =
        frameIndex === fullFrameIndex
          ? 1600
          : frameIndex < fullFrameIndex
            ? 55
            : 30;
      frameIndex++;
      if (frameIndex === frames.length) {
        exampleIndex = (exampleIndex + 1) % examples.length;
        frames = typingFrames(examples[exampleIndex] ?? "");
        frameIndex = 0;
      }
      timer = setTimeout(step, delay);
    }

    // Starts after the page has settled, not during the first seconds.
    timer = setTimeout(step, 3000);
    return () => {
      canceled = true;
      clearTimeout(timer);
      input.placeholder = base;
    };
  }, [ref, base, examplesKey, enabled]);
}
