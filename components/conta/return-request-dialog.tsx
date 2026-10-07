"use client";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { RETURN_REASONS } from "@/lib/orders/return-schema";

export type ReturnFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<"tipo" | "motivo" | "detalhe", string[]>>;
  values?: { tipo?: string; motivo?: string; detalhe?: string };
};
type InternalState = ReturnFormState & { revision: number };
type Props = {
  numero: string;
  action: (
    state: ReturnFormState,
    formData: FormData,
  ) => Promise<ReturnFormState>;
};

function ReturnFields({
  values,
  errors,
  firstId,
}: {
  values?: ReturnFormState["values"];
  errors?: ReturnFormState["fieldErrors"];
  firstId: string;
}) {
  const [detail, setDetail] = useState(values?.detalhe ?? "");
  const id = useId();
  return (
    <>
      <fieldset
        aria-describedby={errors?.tipo?.length ? `${id}-tipo-erro` : undefined}
        className="flex flex-col gap-2"
      >
        <legend className="mb-2 text-[15px] font-bold">O que você quer?</legend>
        <div className="flex flex-wrap gap-4">
          {(["troca", "devolucao"] as const).map((type, index) => (
            <label key={type} className="flex min-h-12 items-center gap-2">
              <input
                id={index === 0 ? firstId : undefined}
                type="radio"
                name="tipo"
                value={type}
                defaultChecked={(values?.tipo ?? "troca") === type}
                aria-describedby={
                  errors?.tipo?.length ? `${id}-tipo-erro` : undefined
                }
                className="size-4 accent-ultramar focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
              />
              {type === "troca" ? "Troca" : "Devolução"}
            </label>
          ))}
        </div>
        {!!errors?.tipo?.length && (
          <p id={`${id}-tipo-erro`} className="text-sm text-rosa-ink">
            {errors.tipo.join(" ")}
          </p>
        )}
      </fieldset>
      <label htmlFor={`${id}-motivo`} className="text-[15px] font-bold">
        Motivo
      </label>
      <select
        id={`${id}-motivo`}
        name="motivo"
        defaultValue={values?.motivo ?? ""}
        aria-invalid={!!errors?.motivo?.length || undefined}
        aria-describedby={
          errors?.motivo?.length ? `${id}-motivo-erro` : undefined
        }
        className="h-12 rounded-[14px] border border-borda bg-white px-3 text-base focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
      >
        <option value="">Escolha o motivo</option>
        {Object.entries(RETURN_REASONS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {!!errors?.motivo?.length && (
        <p id={`${id}-motivo-erro`} className="text-sm text-rosa-ink">
          {errors.motivo.join(" ")}
        </p>
      )}
      <label htmlFor={`${id}-detalhe`} className="text-[15px] font-bold">
        O que aconteceu?
      </label>
      <textarea
        id={`${id}-detalhe`}
        name="detalhe"
        maxLength={1000}
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        aria-invalid={!!errors?.detalhe?.length || undefined}
        aria-describedby={`${id}-contador${errors?.detalhe?.length ? ` ${id}-detalhe-erro` : ""}`}
        className="min-h-28 rounded-[14px] border border-borda p-3 text-base focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
      />
      <p id={`${id}-contador`} className="text-sm text-texto-2">
        {detail.length}/1000
      </p>
      {!!errors?.detalhe?.length && (
        <p id={`${id}-detalhe-erro`} className="text-sm text-rosa-ink">
          {errors.detalhe.join(" ")}
        </p>
      )}
    </>
  );
}
function ReturnContent({
  numero,
  action,
  close,
  pendingRef,
}: Props & { close: () => void; pendingRef: { current: boolean } }) {
  const [state, formAction, pending] = useActionState(
    async (previous: InternalState, data: FormData): Promise<InternalState> => {
      pendingRef.current = true;
      const { revision, ...publicState } = previous;
      try {
        return { ...(await action(publicState, data)), revision: revision + 1 };
      } catch {
        return {
          ok: false,
          message: "Não foi possível enviar agora. Tente de novo.",
          values: {
            tipo: String(data.get("tipo") ?? ""),
            motivo: String(data.get("motivo") ?? ""),
            detalhe: String(data.get("detalhe") ?? ""),
          },
          revision: revision + 1,
        };
      } finally {
        pendingRef.current = false;
      }
    },
    { ok: false, revision: 0 },
  );
  const firstId = useId();
  const successRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (state.ok) successRef.current?.focus();
    else document.getElementById(firstId)?.focus();
  }, [state.revision, state.ok, firstId]);
  if (state.ok)
    return (
      <div className="mt-5 flex flex-col gap-4">
        <p role="status">
          Pedido registrado. Vamos responder pelo seu e-mail em até 1 dia útil.
        </p>
        <button
          ref={successRef}
          type="button"
          onClick={close}
          className="min-h-12 rounded-[14px] bg-ultramar px-5 font-display font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
        >
          Fechar
        </button>
      </div>
    );
  return (
    <form
      key={state.revision}
      action={formAction}
      noValidate
      aria-busy={pending}
      className="mt-5 flex flex-col gap-3"
    >
      <input type="hidden" name="numero" value={numero} />
      <ReturnFields
        values={state.values}
        errors={state.fieldErrors}
        firstId={firstId}
      />
      {state.message && (
        <p role="alert" className="text-sm text-rosa-ink">
          {state.message}
        </p>
      )}
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={pending}
          onClick={close}
          className="min-h-12 rounded-[14px] border border-borda px-5 font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:opacity-60"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-[14px] bg-ultramar px-5 font-display font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:opacity-60"
        >
          {pending ? "Enviando..." : "Enviar pedido"}
        </button>
      </div>
    </form>
  );
}
export function ReturnRequestDialog({ numero, action }: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef(false);
  const id = useId();
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
        }}
        className="min-h-12 rounded-[14px] border border-ultramar px-5 font-display font-bold text-ultramar focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
      >
        Pedir troca ou devolução
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-help`}
        onCancel={(event) => {
          if (pendingRef.current) event.preventDefault();
        }}
        onClose={() => {
          setOpen(false);
          pendingRef.current = false;
          triggerRef.current?.focus({ preventScroll: true });
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]), input:not([type="hidden"]), select, textarea',
            ),
          ).filter((element) => element.getClientRects().length > 0);
          const first = controls[0],
            last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[520px] overflow-y-auto rounded-[22px] border border-borda bg-white p-6 font-sans text-noite backdrop:bg-noite/60"
      >
        <h2 id={`${id}-title`} className="font-display text-2xl font-bold">
          Troca ou devolução
        </h2>
        <p id={`${id}-help`} className="mt-3 text-sm text-texto-2">
          Você tem até 7 dias depois da entrega. Guarde o produto com a
          embalagem e os acessórios.
        </p>
        {open && (
          <ReturnContent
            numero={numero}
            action={action}
            pendingRef={pendingRef}
            close={() => dialogRef.current?.close()}
          />
        )}
      </dialog>
    </>
  );
}
