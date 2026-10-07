"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { DragEvent } from "react";

export type AdminImage = {
  id?: string;
  url: string;
  path: string;
  alt: string;
};
type ImageUploaderProps = {
  value: AdminImage[];
  onChange: (images: AdminImage[]) => void;
  requestUpload: (file: {
    name: string;
    type: string;
    size: number;
  }) => Promise<
    | { ok: true; path: string; signedUrl: string; publicUrl: string }
    | { ok: false; message: string }
  >;
  max?: number;
  nomeProduto: string;
};
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ImageUploader({
  value,
  onChange,
  requestUpload,
  max = 8,
  nomeProduto,
}: ImageUploaderProps) {
  const [progress, setProgress] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const imagesRef = useRef(value);
  const busyRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const draggingRef = useRef<number | null>(null);
  const id = useId();
  useEffect(() => {
    imagesRef.current = value;
  }, [value]);
  useEffect(() => () => requestRef.current?.abort(), []);
  function publish(images: AdminImage[]) {
    imagesRef.current = images;
    onChange(images);
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= imagesRef.current.length || from === to) return;
    const next = [...imagesRef.current];
    const [image] = next.splice(from, 1);
    if (!image) return;
    next.splice(to, 0, image);
    publish(next);
  }
  async function upload(files: File[]) {
    if (busyRef.current || !files.length) return;
    busyRef.current = true;
    setBusy(true);
    setErrors([]);
    const controller = new AbortController();
    requestRef.current = controller;
    const failures: string[] = [];
    for (const [index, file] of files.entries()) {
      if (controller.signal.aborted) return;
      setProgress(`Enviando ${index + 1} de ${files.length}...`);
      if (imagesRef.current.length >= max) {
        failures.push(`Máximo de ${max} fotos`);
        break;
      }
      if (!allowedTypes.has(file.type)) {
        failures.push(`${file.name}: use fotos JPG, PNG ou WEBP.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        failures.push(`${file.name}: a foto deve ter até 5 MB.`);
        continue;
      }
      try {
        const result = await requestUpload({
          name: file.name,
          type: file.type,
          size: file.size,
        });
        if (controller.signal.aborted) return;
        if (!result.ok) {
          failures.push(`${file.name}: ${result.message}`);
          continue;
        }
        const response = await fetch(result.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error("Upload failed");
        if (imagesRef.current.length < max)
          publish([
            ...imagesRef.current,
            { url: result.publicUrl, path: result.path, alt: nomeProduto },
          ]);
        else failures.push(`Máximo de ${max} fotos`);
      } catch {
        if (!controller.signal.aborted)
          failures.push(
            `${file.name}: não foi possível enviar. Tente de novo.`,
          );
      }
    }
    if (!controller.signal.aborted) {
      setErrors(failures);
      setProgress("");
      setBusy(false);
      busyRef.current = false;
    }
  }
  function dropFiles(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (event.dataTransfer.files.length)
      void upload(Array.from(event.dataTransfer.files));
  }
  return (
    <div className="flex flex-col gap-4 font-sans" aria-busy={busy}>
      {value.length < max ? (
        <label
          htmlFor={`${id}-files`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={dropFiles}
          className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-borda-forte bg-white p-6 text-center text-base text-noite has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ultramar"
        >
          <span>Arraste fotos aqui ou clique para escolher</span>
          <span className="text-sm text-texto-2">
            JPG, PNG ou WEBP, até 5 MB por foto.
          </span>
          <input
            id={`${id}-files`}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              void upload(files);
            }}
          />
        </label>
      ) : (
        <p className="text-sm text-texto-2">Máximo de {max} fotos</p>
      )}
      <p role="status" aria-live="polite" className="text-sm text-texto-2">
        {progress}
      </p>
      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-rosa-ink">
          {errors.map((message, index) => (
            <li key={`${message}-${index}`}>{message}</li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {value.map((image, index) => (
          <div
            key={image.id ?? image.path}
            draggable
            onDragStart={(event) => {
              if ((event.target as HTMLElement).closest("input,button")) {
                event.preventDefault();
                return;
              }
              draggingRef.current = index;
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(index));
            }}
            onDragEnd={() => {
              draggingRef.current = null;
            }}
            onDragOver={(event) => {
              if (draggingRef.current !== null) event.preventDefault();
            }}
            onDrop={(event) => {
              if (draggingRef.current === null) return;
              event.preventDefault();
              event.stopPropagation();
              move(draggingRef.current, index);
              draggingRef.current = null;
            }}
            className="flex flex-col gap-3 rounded-[22px] border border-borda bg-white p-4"
          >
            <div className="relative size-28">
              <Image
                src={image.url}
                alt={image.alt || nomeProduto}
                width={112}
                height={112}
                unoptimized
                draggable={false}
                className="size-28 rounded-[16px] object-cover"
              />
              {index === 0 && (
                <span className="absolute top-1 left-1 rounded-full bg-lima px-2 py-1 text-xs font-bold text-noite">
                  Capa
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
                aria-label={`Mover para a esquerda a foto ${index + 1}`}
                className="flex size-11 items-center justify-center rounded-[14px] border border-borda-forte text-ultramar focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:opacity-40"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                disabled={index === value.length - 1}
                onClick={() => move(index, index + 1)}
                aria-label={`Mover para a direita a foto ${index + 1}`}
                className="flex size-11 items-center justify-center rounded-[14px] border border-borda-forte text-ultramar focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:opacity-40"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() =>
                  publish(
                    imagesRef.current.filter(
                      (_, position) => position !== index,
                    ),
                  )
                }
                aria-label={`Remover foto ${index + 1}`}
                className="min-h-11 rounded-[14px] px-3 text-sm font-bold text-rosa-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
              >
                Remover
              </button>
            </div>
            <label
              htmlFor={`${id}-alt-${index}`}
              className="text-sm font-bold text-noite"
            >
              Descrição da foto {index + 1}
            </label>
            <input
              id={`${id}-alt-${index}`}
              value={image.alt}
              onChange={(event) =>
                publish(
                  imagesRef.current.map((current, position) =>
                    position === index
                      ? { ...current, alt: event.target.value }
                      : current,
                  ),
                )
              }
              className="h-12 rounded-[14px] border-[1.5px] border-borda-forte px-3 text-base text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
