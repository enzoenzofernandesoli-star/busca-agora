"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

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

export function useTypingPlaceholder(
  base: string,
  exemplos: string[],
  ativo: boolean,
): string {
  const environmentEnabled = useSyncExternalStore(
    subscribeEnvironment,
    canAnimate,
    serverCanAnimate,
  );
  // Content identity keeps equivalent inline arrays from restarting the timer on every frame.
  const examplesKey = JSON.stringify(exemplos);
  const enabled = ativo && environmentEnabled;
  const run = useMemo(() => {
    const examples = JSON.parse(examplesKey) as string[];
    return {
      enabled,
      base,
      examples: examples.filter((example) => example.length > 0),
    };
  }, [enabled, base, examplesKey]);
  const [frame, setFrame] = useState<{ run: object; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (!run.enabled || run.examples.length === 0) return;

    let timer: ReturnType<typeof setTimeout>;
    let canceled = false;
    let exampleIndex = 0;
    let frameIndex = 0;
    let frames = typingFrames(run.examples[exampleIndex] ?? "");

    function step() {
      if (canceled || !canAnimate()) return;
      setFrame({ run, text: frames[frameIndex] ?? run.base });
      const fullFrameIndex = frames.length / 2 - 1;
      const delay =
        frameIndex === fullFrameIndex
          ? 1600
          : frameIndex < fullFrameIndex
            ? 55
            : 30;
      frameIndex++;
      if (frameIndex === frames.length) {
        exampleIndex = (exampleIndex + 1) % run.examples.length;
        frames = typingFrames(run.examples[exampleIndex] ?? "");
        frameIndex = 0;
      }
      timer = setTimeout(step, delay);
    }

    timer = setTimeout(step, 1500);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [run]);

  return enabled && frame?.run === run ? frame.text : base;
}
