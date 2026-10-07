"use client";
import { useActionState, useId } from "react";

export type TrackingFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<"numero" | "email", string[]>>;
  values?: { numero?: string; email?: string };
};
type InternalState = TrackingFormState & { revision: number };
export function TrackingForm({
  action,
  initial,
}: {
  action: (
    state: TrackingFormState,
    formData: FormData,
  ) => Promise<TrackingFormState>;
  initial?: { numero?: string; email?: string };
}) {
  const [state, formAction, pending] = useActionState(
    async (previous: InternalState, data: FormData): Promise<InternalState> => {
      const { revision, ...publicState } = previous;
      try {
        return { ...(await action(publicState, data)), revision: revision + 1 };
      } catch {
        return {
          ok: false,
          message: "Não foi possível buscar agora. Tente de novo.",
          values: {
            numero: String(data.get("numero") ?? ""),
            email: String(data.get("email") ?? ""),
          },
          revision: revision + 1,
        };
      }
    },
    { ok: false, revision: 0 },
  );
  const prefix = useId();
  return (
    <form
      key={state.revision}
      action={formAction}
      noValidate
      aria-busy={pending}
      className="flex flex-col gap-5 rounded-[22px] border border-borda bg-white p-6 font-sans"
    >
      {(
        [
          {
            name: "numero",
            label: "Número do pedido",
            type: "text",
            placeholder: "BA-000123",
            autoComplete: "off",
          },
          {
            name: "email",
            label: "E-mail usado na compra",
            type: "email",
            placeholder: "",
            autoComplete: "email",
          },
        ] as const
      ).map((field) => {
        const errors = state.fieldErrors?.[field.name];
        const id = `${prefix}-${field.name}`;
        return (
          <div key={field.name} className="flex flex-col gap-2">
            <label htmlFor={id} className="text-[15px] font-bold text-noite">
              {field.label}
            </label>
            <input
              id={id}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              autoCapitalize={field.name === "numero" ? "characters" : "none"}
              inputMode={field.name === "email" ? "email" : "text"}
              required
              defaultValue={
                state.values?.[field.name] ?? initial?.[field.name] ?? ""
              }
              aria-invalid={!!errors?.length || undefined}
              aria-describedby={errors?.length ? `${id}-erro` : undefined}
              className={`h-12 rounded-[14px] border-[1.5px] bg-white px-4 text-base text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar ${errors?.length ? "border-rosa-ink" : "border-borda"}`}
            />
            {!!errors?.length && (
              <p id={`${id}-erro`} className="text-sm text-rosa-ink">
                {errors.join(" ")}
              </p>
            )}
          </div>
        );
      })}
      {state.message && (
        <p role="alert" className="text-sm text-rosa-ink">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-[14px] bg-lima px-6 font-display font-bold text-noite hover:bg-lima-300 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:opacity-60 sm:w-auto sm:self-start"
      >
        {pending ? "Buscando..." : "Rastrear pedido"}
      </button>
      <p className="text-sm text-texto-2">
        O número está no e-mail de confirmação do pedido.
      </p>
    </form>
  );
}
