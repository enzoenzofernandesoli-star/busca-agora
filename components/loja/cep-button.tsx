"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { PinIcon } from "@/components/loja/icons";
import { cepSchema, formatCep } from "@/lib/br/cep";
import { getStoredCep, saveCep, subscribeStoredCep } from "@/lib/br/stored-cep";
import { cn } from "@/lib/utils";

type CepButtonProps = {
  variant: "desktop" | "mobile";
};

function getServerCep() {
  return "";
}

/** Header "Enviar para" button: saves the CEP the freight quotes start from. */
export function CepButton({ variant }: CepButtonProps) {
  const desktop = variant === "desktop";
  const stored = useSyncExternalStore(
    subscribeStoredCep,
    getStoredCep,
    getServerCep,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  function open() {
    setValue(formatCep(stored));
    setError(null);
    dialogRef.current?.showModal();
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = cepSchema.safeParse(value);
    if (!parsed.success) {
      setError("CEP inválido. Confira os 8 números.");
      return;
    }
    saveCep(parsed.data);
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={cn(
          "inline-flex cursor-pointer items-center bg-transparent font-sans text-sm text-white",
          desktop
            ? // 40px visual (design); 3px hit area above/below the 38px padding box = 44px
              "relative min-h-10 gap-2 rounded-[10px] border border-white/28 pr-3.5 pl-2.5 before:absolute before:inset-x-0 before:-inset-y-[3px] hover:bg-white/10"
            : "min-h-11 gap-1.5 self-start border-0 p-0",
        )}
      >
        <PinIcon size={desktop ? 18 : 16} />
        <span>
          Enviar para <b>{stored ? formatCep(stored) : "informe seu CEP"}</b>
          {desktop ? null : <span aria-hidden="true"> ›</span>}
        </span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-titulo`}
        className="m-auto w-[min(400px,calc(100%-32px))] rounded-[22px] border border-borda bg-white p-6 text-noite backdrop:bg-noite/60"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <h2
            id={`${id}-titulo`}
            className="font-display text-xl font-bold text-noite"
          >
            Para onde vamos enviar?
          </h2>
          <p className="text-sm text-texto-2">
            Usamos o CEP para calcular o frete e o prazo de entrega.
          </p>
          <label htmlFor={`${id}-cep`} className="text-sm font-bold">
            CEP
          </label>
          <input
            id={`${id}-cep`}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={value}
            onChange={(event) => {
              setValue(formatCep(event.target.value));
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-erro` : undefined}
            className="min-h-12 rounded-[14px] border border-borda px-4 text-base text-noite focus-visible:outline-2 focus-visible:outline-ultramar"
          />
          {error && (
            <p id={`${id}-erro`} role="alert" className="text-sm text-rosa-ink">
              {error}
            </p>
          )}
          <a
            href="https://buscacepinter.correios.com.br/app/endereco/index.php"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start text-sm text-ultramar underline"
          >
            Não sei meu CEP
          </a>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="min-h-12 flex-1 cursor-pointer rounded-[14px] border border-borda bg-white font-bold text-noite hover:bg-fundo"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-12 flex-1 cursor-pointer rounded-[14px] bg-ultramar font-bold text-white hover:bg-ultramar-700"
            >
              Salvar CEP
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
