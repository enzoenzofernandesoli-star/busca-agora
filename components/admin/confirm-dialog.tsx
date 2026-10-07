"use client";

import { useId, useRef, useState, useTransition } from "react";

export function ConfirmDialog({
  gatilho,
  titulo,
  texto,
  confirmarLabel,
  perigo = false,
  action,
  campos,
}: {
  gatilho: string;
  titulo: string;
  texto: string;
  confirmarLabel: string;
  perigo?: boolean;
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  campos?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const busyRef = useRef(false);
  const id = useId();
  const color = perigo ? "rosa-ink" : "ultramar";
  function submit(formData: FormData) {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result.ok) {
          setDone(true);
          dialogRef.current?.close();
        } else
          setError(
            result.message || "Não foi possível concluir. Tente de novo.",
          );
      } catch {
        setError("Não foi possível concluir. Tente de novo.");
      } finally {
        busyRef.current = false;
      }
    });
  }
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setError(null);
          setDone(false);
          formRef.current?.reset();
          dialogRef.current?.showModal();
          backRef.current?.focus({ preventScroll: true });
        }}
        className={`min-h-12 rounded-[14px] border px-5 font-display font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar ${perigo ? "border-rosa-ink text-rosa-ink" : "border-ultramar text-ultramar"}`}
      >
        {gatilho}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-text`}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), a[href]',
            ),
          ).filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onCancel={(event) => {
          if (busyRef.current) event.preventDefault();
        }}
        onClose={() => triggerRef.current?.focus({ preventScroll: true })}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[520px] overflow-y-auto rounded-[22px] border border-borda bg-white p-6 font-sans text-noite"
      >
        <h2 id={`${id}-title`} className="font-display text-2xl font-extrabold">
          {titulo}
        </h2>
        <p
          id={`${id}-text`}
          className="mt-3 text-base leading-relaxed text-texto-2"
        >
          {texto}
        </p>
        <form
          ref={formRef}
          action={submit}
          aria-busy={pending}
          className="mt-5 flex flex-col gap-4"
        >
          {Object.entries(campos ?? {})
            .filter(([name]) => name !== "motivo")
            .map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
          <label htmlFor={`${id}-reason`} className="text-sm font-bold">
            Motivo (aparece no histórico do pedido)
          </label>
          <textarea
            id={`${id}-reason`}
            name="motivo"
            defaultValue={campos?.motivo ?? ""}
            maxLength={200}
            disabled={pending}
            className="min-h-24 rounded-[14px] border-[1.5px] border-borda-forte p-3 text-base focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
          />
          {error && (
            <p role="alert" className="text-sm text-rosa-ink">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <button
              ref={backRef}
              type="button"
              disabled={pending}
              onClick={() => dialogRef.current?.close()}
              className="min-h-12 rounded-[14px] border border-borda-forte px-5 font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`min-h-12 rounded-[14px] px-5 font-display font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:opacity-50 ${color === "rosa-ink" ? "bg-rosa-ink" : "bg-ultramar hover:bg-ultramar-700"}`}
            >
              {pending ? "Aguarde..." : confirmarLabel}
            </button>
          </div>
        </form>
      </dialog>
      <p role="status" aria-live="polite" className="mt-2 text-sm text-estoque">
        {done ? "Feito." : ""}
      </p>
    </>
  );
}
