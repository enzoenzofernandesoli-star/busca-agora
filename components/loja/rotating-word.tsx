"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function reducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function visibilitySnapshot() {
  return document.visibilityState === "visible";
}

type WordState = {
  wordsKey: string;
  index: number;
  phase: "idle" | "exit" | "enter";
  cycle: number;
};

export function RotatingWord({
  palavras,
  intervaloMs = 2200,
  className,
}: {
  palavras: string[];
  intervaloMs?: number;
  className?: string;
}) {
  // Equivalent inline arrays must not restart the timer on every render.
  const wordsKey = JSON.stringify(palavras);
  const count = palavras.length;
  const interval = Number.isFinite(intervaloMs)
    ? Math.max(480, intervaloMs)
    : 2200;
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    reducedMotionSnapshot,
    () => false,
  );
  const visible = useSyncExternalStore(
    subscribeVisibility,
    visibilitySnapshot,
    () => true,
  );
  const [state, setState] = useState<WordState>(() => ({
    wordsKey,
    index: 0,
    phase: "idle",
    cycle: 0,
  }));

  useEffect(() => {
    if (reducedMotion || !visible || count < 2) return;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    function schedule(callback: () => void, delay: number) {
      timer = setTimeout(() => {
        if (!cancelled && visibilitySnapshot() && !reducedMotionSnapshot()) {
          callback();
        }
      }, delay);
    }

    function leave() {
      setState((previous) => ({ ...previous, phase: "exit" }));
      schedule(() => {
        setState((previous) => ({
          wordsKey,
          index: (previous.index + 1) % count,
          phase: "enter",
          cycle: previous.cycle + 1,
        }));
        schedule(() => {
          setState((previous) => ({ ...previous, phase: "idle" }));
          schedule(leave, interval - 480);
        }, 260);
      }, 220);
    }

    // Also restores a readable word after pausing midway through an exit.
    schedule(() => {
      setState((previous) =>
        previous.wordsKey === wordsKey && previous.phase === "idle"
          ? previous
          : {
              wordsKey,
              index: previous.wordsKey === wordsKey ? previous.index : 0,
              phase: "idle",
              cycle: previous.cycle,
            },
      );
      schedule(leave, interval);
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [wordsKey, count, interval, reducedMotion, visible]);

  if (count === 0) return null;
  const matches = state.wordsKey === wordsKey;
  const index = reducedMotion || !matches ? 0 : state.index;
  const phase = reducedMotion || !visible || !matches ? "idle" : state.phase;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "ba-rotating-word relative inline-grid text-left",
        className,
      )}
    >
      {palavras.map((word, wordIndex) => {
        const current = wordIndex === index;
        return (
          <span
            key={wordIndex}
            className={cn(
              "relative justify-self-start whitespace-nowrap [grid-area:1/1]",
              !current && "invisible",
            )}
          >
            <span
              key={`${wordIndex}-${state.cycle}`}
              className={cn(
                "ba-rotating-word-highlight pointer-events-none absolute -inset-x-1 bottom-[6%] z-0 h-[38%] origin-left rounded-[6px] bg-lima",
                current &&
                  state.cycle > 0 &&
                  !reducedMotion &&
                  "ba-rotating-word-highlight-in",
              )}
            />
            <span
              key={`text-${wordIndex}-${state.cycle}`}
              className={cn(
                "ba-rotating-word-text relative z-10 inline-block text-white",
                current && phase === "exit" && "ba-rotating-word-out",
                current && phase === "enter" && "ba-rotating-word-in",
              )}
            >
              {word}
            </span>
          </span>
        );
      })}
      <style>{`
        .ba-rotating-word-text {
          /* A dark halo keeps white glyphs legible over the lime underline. */
          -webkit-text-stroke: .06em #0A0F3D;
          paint-order: stroke fill;
        }
        .ba-rotating-word-out { animation: ba-rotating-word-out 220ms ease-in both; }
        .ba-rotating-word-in { animation: ba-rotating-word-in 260ms cubic-bezier(.2,.8,.2,1) both; }
        .ba-rotating-word-highlight-in { animation: ba-rotating-word-highlight 320ms ease-out both; }
        @keyframes ba-rotating-word-out {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-60%); opacity: 0; }
        }
        @keyframes ba-rotating-word-in {
          from { transform: translateY(60%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes ba-rotating-word-highlight {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ba-rotating-word-text, .ba-rotating-word-highlight {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </span>
  );
}
