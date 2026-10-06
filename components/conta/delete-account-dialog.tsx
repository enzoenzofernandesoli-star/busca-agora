"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { initialFormState } from "@/lib/forms/state";
import type { FormState } from "@/lib/forms/state";

type DeleteAccountDialogProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

function ConfirmationForm({
  action,
  onClose,
}: DeleteAccountDialogProps & { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [confirmation, setConfirmation] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const errors = state.fieldErrors?.confirmacao;
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <form
      action={formAction}
      noValidate
      aria-busy={pending}
      className="mt-5 flex flex-col gap-4"
    >
      {state.message && !state.ok && (
        <p
          role="alert"
          className="rounded-[14px] bg-[#FFF0F7] p-4 text-sm text-rosa-ink"
        >
          {state.message}
        </p>
      )}
      <label htmlFor={id} className="text-[15px] font-bold text-noite">
        Digite EXCLUIR para confirmar
      </label>
      <input
        ref={inputRef}
        id={id}
        name="confirmacao"
        required
        autoComplete="off"
        spellCheck={false}
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        aria-invalid={!!errors?.length || undefined}
        aria-describedby={errors?.length ? `${id}-erro` : undefined}
        className={`h-12 w-full rounded-[14px] border-[1.5px] bg-white px-4 text-base text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar ${errors?.length ? "border-rosa-ink" : "border-borda-forte"}`}
      />
      {!!errors?.length && (
        <p id={`${id}-erro`} className="text-sm text-rosa-ink">
          {errors.join(" ")}
        </p>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-[14px] border border-borda-forte px-5 font-display font-bold text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={confirmation !== "EXCLUIR" || pending}
          className="min-h-12 rounded-[14px] bg-rosa-ink px-5 font-display font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Aguarde..." : "Excluir conta"}
        </button>
      </div>
    </form>
  );
}

export function DeleteAccountDialog({ action }: DeleteAccountDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  function openDialog() {
    dialogRef.current?.showModal();
    setIsOpen(true);
  }
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDialog}
        className="min-h-12 rounded-[14px] border border-rosa-ink px-5 font-display font-bold text-rosa-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
      >
        Excluir minha conta
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => {
          setIsOpen(false);
          triggerRef.current?.focus({ preventScroll: true });
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[520px] overflow-y-auto rounded-[22px] border border-borda bg-white p-6 font-sans text-noite backdrop:bg-noite/60 md:p-8"
      >
        <h2 id={titleId} className="font-display text-2xl font-extrabold">
          Excluir sua conta?
        </h2>
        <p
          id={descriptionId}
          className="mt-3 text-base leading-relaxed text-texto-2"
        >
          Seus dados pessoais, endereços e carrinho serão apagados. Os pedidos
          já feitos ficam guardados só com os dados exigidos pela nota fiscal,
          pelo prazo da lei. Isso não pode ser desfeito.
        </p>
        {isOpen && (
          <ConfirmationForm
            action={action}
            onClose={() => dialogRef.current?.close()}
          />
        )}
      </dialog>
    </>
  );
}
