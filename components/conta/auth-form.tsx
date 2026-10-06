"use client";

import { createContext, useActionState, useContext } from "react";
import type { ChangeEventHandler, ReactNode, Ref } from "react";
import { useFormStatus } from "react-dom";
import type { FieldProps } from "@/components/conta/field";
import { initialFormState } from "@/lib/forms/state";
import type { FormState } from "@/lib/forms/state";

export const FieldErrorsContext =
  createContext<FormState["fieldErrors"]>(undefined);

export function useFieldErrors(name: string): string[] | undefined {
  return useContext(FieldErrorsContext)?.[name];
}

// Values typed before a failed submit (see FormState.values).
export const FieldValuesContext = createContext<FormState["values"]>(undefined);

export function useFieldValue(name: string): string | undefined {
  return useContext(FieldValuesContext)?.[name];
}

export function FieldInput({
  id,
  name,
  label,
  type = "text",
  errors,
  hint,
  inputRef,
  defaultValue,
  ...props
}: FieldProps & {
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const contextErrors = useFieldErrors(name);
  const echoed = useFieldValue(name);
  const messages = errors ?? contextErrors;
  const hasErrors = !!messages?.length;
  const describedBy =
    [hasErrors ? `${id}-erro` : "", hint ? `${id}-dica` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="flex min-w-0 flex-col gap-2 font-sans">
      <label htmlFor={id} className="text-[15px] font-bold text-noite">
        {label}
      </label>
      <input
        {...props}
        ref={inputRef}
        // Controlled fields (value) ignore this; uncontrolled ones get back
        // what was typed after a failed submit.
        defaultValue={
          props.value === undefined ? (echoed ?? defaultValue) : undefined
        }
        id={id}
        name={name}
        type={type}
        aria-invalid={hasErrors || undefined}
        aria-describedby={describedBy}
        className={`h-12 w-full rounded-[14px] border-[1.5px] bg-white px-4 text-base text-noite placeholder:text-texto-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar ${hasErrors ? "border-rosa-ink" : "border-borda-forte"}`}
      />
      {hasErrors && (
        <p id={`${id}-erro`} className="text-sm text-rosa-ink">
          {messages.join(" ")}
        </p>
      )}
      {hint && (
        <p id={`${id}-dica`} className="text-sm text-texto-2">
          {hint}
        </p>
      )}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-14 w-full items-center justify-center rounded-[16px] bg-ultramar px-6 font-display text-[17px] font-bold text-white hover:bg-ultramar-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Aguarde..." : label}
    </button>
  );
}

export function AuthForm({
  action,
  submitLabel,
  children,
  footer,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  return (
    <FieldErrorsContext.Provider value={state.fieldErrors}>
      <FieldValuesContext.Provider value={state.values}>
        <form
          // New key per answer: the uncontrolled inputs pick up the echoed
          // values as their new defaults.
          key={state.values ? JSON.stringify(state.values) : "inicial"}
          action={formAction}
          noValidate
          aria-busy={pending}
          className="flex flex-col gap-5 font-sans"
        >
          {state.message && (
            <p
              role="alert"
              className={`rounded-[14px] p-4 text-sm ${state.ok ? "bg-[#ECFDF3] text-estoque" : "bg-[#FFF0F7] text-rosa-ink"}`}
            >
              {state.message}
            </p>
          )}
          {children}
          <SubmitButton label={submitLabel} />
          {footer}
        </form>
      </FieldValuesContext.Provider>
    </FieldErrorsContext.Provider>
  );
}
