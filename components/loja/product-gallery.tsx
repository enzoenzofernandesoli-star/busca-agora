"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ChipIcon, DropIcon } from "@/components/loja/icons";

export type GalleryImage = { url: string; alt: string };
type ProductGalleryProps = {
  images: GalleryImage[];
  nome: string;
  categoria: "eletronicos" | "cosmeticos";
};

export function ProductGallery({
  images,
  nome,
  categoria,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = selectedIndex < images.length ? selectedIndex : 0;
  const image = images[activeIndex];
  const isElectronics = categoria === "eletronicos";
  const Icon = isElectronics ? ChipIcon : DropIcon;

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextIndex =
      (index + (event.key === "ArrowRight" ? 1 : -1) + images.length) %
      images.length;
    setSelectedIndex(nextIndex);
    buttonsRef.current[nextIndex]?.focus();
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-[28px] border border-borda bg-white p-6 md:flex-row">
      {images.length > 1 && (
        <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:max-h-[560px] md:shrink-0 md:flex-col md:overflow-x-hidden md:overflow-y-auto">
          {images.map((thumbnail, index) => (
            <button
              key={`${thumbnail.url}-${index}`}
              ref={(element) => {
                buttonsRef.current[index] = element;
              }}
              type="button"
              aria-label={`Ver foto ${index + 1} de ${images.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => setSelectedIndex(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`size-[76px] shrink-0 cursor-pointer overflow-hidden rounded-[16px] bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar ${index === activeIndex ? "border-[2.5px] border-ultramar" : "border-[1.5px] border-transparent"}`}
            >
              <Image
                src={thumbnail.url}
                alt={thumbnail.alt || nome}
                width={76}
                height={76}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
      <div
        className={`relative order-1 aspect-square max-h-[560px] w-full min-w-0 overflow-hidden rounded-[22px] md:order-2 md:flex-1 ${image ? "bg-white" : isElectronics ? "bg-ciano-tile text-ciano-ink" : "bg-rosa-tile text-rosa-ink"}`}
      >
        {image ? (
          <Image
            key={image.url}
            src={image.url}
            alt={image.alt || nome}
            fill
            sizes="(min-width: 768px) 560px, 100vw"
            preload={activeIndex === 0}
            className="object-contain"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <Icon size={96} />
            <p className="font-sans text-base">Foto em breve</p>
          </div>
        )}
      </div>
    </div>
  );
}
