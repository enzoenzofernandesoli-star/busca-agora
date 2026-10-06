"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { SearchIcon } from "@/components/loja/icons";
import { cn } from "@/lib/utils";

type SearchFormProps = {
  id: string;
  placeholder: string;
  variant: "desktop" | "mobile";
  className?: string;
};

type Sugestao = { slug: string; nome: string; categoria: string };

const MIN_CHARS = 2;
const DEBOUNCE_MS = 200;

// GET form to /busca: works without JavaScript. With JavaScript it also
// suggests products while typing (combobox pattern: arrows, Enter, Esc).
export function SearchForm({
  id,
  placeholder,
  variant,
  className,
}: SearchFormProps) {
  const desktop = variant === "desktop";
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const termo = query.trim();
    if (termo.length < MIN_CHARS) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/busca/sugestoes?q=${encodeURIComponent(termo)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const body = (await res.json()) as { sugestoes?: Sugestao[] };
        setSugestoes(body.sugestoes ?? []);
        setAtivo(-1);
      } catch {
        // Aborted or offline: suggestions are optional, the form still works.
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function fecharFora(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setAberto(false);
    }
    document.addEventListener("pointerdown", fecharFora);
    return () => document.removeEventListener("pointerdown", fecharFora);
  }, []);

  // Short input hides stale suggestions without clearing them in an effect.
  const mostrar =
    aberto && query.trim().length >= MIN_CHARS && sugestoes.length > 0;
  const optionId = (i: number) => `${listId}-opcao-${i}`;

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!mostrar) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setAtivo((i) => (i + 1) % sugestoes.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setAtivo((i) => (i <= 0 ? sugestoes.length - 1 : i - 1));
    } else if (event.key === "Escape") {
      setAberto(false);
      setAtivo(-1);
    } else if (event.key === "Enter" && ativo >= 0) {
      const escolhida = sugestoes[ativo];
      if (escolhida) {
        event.preventDefault();
        setAberto(false);
        router.push(`/p/${escolhida.slug}`);
      }
    }
  }

  return (
    <div ref={wrapperRef} className={cn("relative min-w-0", className)}>
      <form
        role="search"
        action="/busca"
        method="get"
        className={cn(
          // The input hides its own outline; the form shows the focus ring instead.
          "flex min-w-0 overflow-hidden rounded-[14px] bg-white has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-lima has-[input:focus-visible]:outline-solid",
          desktop && "shadow-[0_2px_0_rgba(10,15,61,.15)]",
        )}
        onSubmit={() => setAberto(false)}
      >
        <label htmlFor={id} className="sr-only">
          Buscar na loja
        </label>
        <input
          id={id}
          name="q"
          type="search"
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={mostrar}
          aria-controls={listId}
          aria-activedescendant={
            mostrar && ativo >= 0 ? optionId(ativo) : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent font-sans text-base text-noite outline-none focus-visible:outline-none",
            desktop ? "h-[52px] px-5" : "h-12 px-4",
          )}
        />
        <button
          type="submit"
          aria-label="Buscar"
          className={cn(
            "flex flex-none cursor-pointer items-center justify-center border-0 bg-lima text-noite hover:bg-lima-300",
            desktop ? "h-[52px] w-[60px]" : "h-12 w-[52px]",
          )}
        >
          <SearchIcon size={desktop ? 22 : 20} />
        </button>
      </form>

      <ul
        id={listId}
        role="listbox"
        aria-label="Sugestões"
        hidden={!mostrar}
        className="absolute inset-x-0 top-[calc(100%+8px)] z-50 m-0 list-none overflow-hidden rounded-[14px] border border-borda bg-white p-1.5 shadow-[0_16px_32px_rgba(10,15,61,.18)]"
      >
        {sugestoes.map((s, i) => (
          <li
            key={s.slug}
            id={optionId(i)}
            role="option"
            aria-selected={i === ativo}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-3 text-[15px] text-noite",
              i === ativo ? "bg-ultramar-50" : "hover:bg-fundo",
            )}
            onPointerDown={(event) => {
              // Keep focus in the input until navigation happens.
              event.preventDefault();
              setAberto(false);
              router.push(`/p/${s.slug}`);
            }}
          >
            <SearchIcon size={16} className="flex-none text-texto-2" />
            <span className="truncate">{s.nome}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
