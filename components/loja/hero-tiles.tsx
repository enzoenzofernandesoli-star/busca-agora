"use client";

import { useEffect, useState, type ComponentType } from "react";

import {
  BatteryIcon,
  BottleIcon,
  DropIcon,
  HeadphonesIcon,
  HeartIcon,
  LeafIcon,
  LipstickIcon,
  MusicIcon,
  PhoneIcon,
  PlugIcon,
  SearchIcon,
  SparklesIcon,
  SpeakerIcon,
  ZapIcon,
} from "@/components/loja/icons";
import { cn } from "@/lib/utils";

type Tile = {
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  /** Background + icon colour; icons on saturated tiles stay noite. */
  cor: string;
};

/**
 * One set of four tiles per word of the Home slogan ("Buscou fone?",
 * "sérum?", "batom?", "cabo?"), in the same order as HERO_WORDS.
 */
export const HERO_WORDS = ["fone?", "sérum?", "batom?", "cabo?"];

/** Highlighter colour behind each word (matches its tiles). */
export const HERO_WORD_COLORS = ["bg-ciano", "bg-rosa", "bg-rosa", "bg-lima"];

const temas: Tile[][] = [
  [
    { Icon: HeadphonesIcon, cor: "bg-ciano text-noite" },
    { Icon: MusicIcon, cor: "bg-lima text-noite" },
    { Icon: SpeakerIcon, cor: "bg-ultramar text-white" },
    { Icon: SearchIcon, cor: "bg-ciano text-noite" },
  ],
  [
    { Icon: DropIcon, cor: "bg-rosa text-noite" },
    { Icon: BottleIcon, cor: "bg-lima text-noite" },
    { Icon: LeafIcon, cor: "bg-ultramar text-white" },
    { Icon: SparklesIcon, cor: "bg-rosa text-noite" },
  ],
  [
    { Icon: LipstickIcon, cor: "bg-rosa text-noite" },
    { Icon: HeartIcon, cor: "bg-ultramar text-white" },
    { Icon: SparklesIcon, cor: "bg-lima text-noite" },
    { Icon: SearchIcon, cor: "bg-rosa text-noite" },
  ],
  [
    { Icon: PlugIcon, cor: "bg-lima text-noite" },
    { Icon: ZapIcon, cor: "bg-ultramar text-white" },
    { Icon: BatteryIcon, cor: "bg-ciano text-noite" },
    { Icon: PhoneIcon, cor: "bg-lima text-noite" },
  ],
];

/**
 * The four decorative tiles next to the Home slogan. They follow the
 * rotating word (RotatingWord sends "ba:palavra"): each word brings its own
 * colours and symbols, and the tiles pop in one after the other. Without
 * motion (reduced motion) the word never changes, so the first set stays.
 */
export function HeroTiles({ compacto = false }: { compacto?: boolean }) {
  // vez counts word changes, so going back to the first word animates too.
  const [{ tema, vez }, setEstado] = useState({ tema: 0, vez: 0 });

  useEffect(() => {
    function onWord(event: Event) {
      const index = (event as CustomEvent<{ index?: number }>).detail?.index;
      if (typeof index !== "number") return;
      const proximo = index % temas.length;
      setEstado((atual) =>
        atual.tema === proximo ? atual : { tema: proximo, vez: atual.vez + 1 },
      );
    }
    window.addEventListener("ba:palavra", onWord);
    return () => window.removeEventListener("ba:palavra", onWord);
  }, []);

  const tiles = temas[tema] ?? temas[0] ?? [];
  if (compacto) {
    // Small row under the hero buttons (desktop), same sets and entrance.
    return (
      <div aria-hidden="true" className="hidden gap-2 md:flex">
        {tiles.map(({ Icon, cor }, i) => (
          <div
            key={`${vez}-${i}`}
            className={cn(
              "flex size-11 items-center justify-center rounded-[14px]",
              vez > 0 &&
                "motion-safe:animate-[ba-tile-in_460ms_cubic-bezier(.2,.8,.2,1)_both]",
              cor,
            )}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <Icon size={22} strokeWidth={2} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className="relative hidden flex-[0_1_300px] grid-cols-2 gap-4 md:grid"
    >
      {tiles.map(({ Icon, cor }, i) => (
        // Outer box keeps the staggered offset; the inner tile is keyed by
        // word, so a new word re-mounts it and replays its entrance.
        <div
          key={i}
          className={cn("aspect-square", i % 2 === 1 && "translate-y-6")}
        >
          <div
            key={vez}
            className={cn(
              "flex size-full items-center justify-center rounded-3xl",
              vez > 0 &&
                "motion-safe:animate-[ba-tile-in_460ms_cubic-bezier(.2,.8,.2,1)_both]",
              cor,
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <Icon size={60} strokeWidth={1.8} />
          </div>
        </div>
      ))}
    </div>
  );
}
