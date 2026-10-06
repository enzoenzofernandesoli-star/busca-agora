"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { z } from "zod";
import {
  FieldErrorsContext,
  FieldInput,
  useFieldErrors,
} from "@/components/conta/auth-form";
import type { Address } from "@/components/conta/address-card";
import { formatCep } from "@/lib/br/cep";
import { onlyDigits } from "@/lib/br/cpf";
import { initialFormState } from "@/lib/forms/state";
import type { FormState } from "@/lib/forms/state";

const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
const lookupSchema = z.object({
  endereco: z
    .object({
      cep: z.string(),
      rua: z.string(),
      bairro: z.string(),
      cidade: z.string(),
      uf: z.enum(states),
    })
    .nullable(),
});

function StateSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const errors = useFieldErrors("uf");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] font-bold text-noite">
        UF
      </label>
      <select
        id={id}
        name="uf"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        aria-invalid={!!errors?.length || undefined}
        aria-describedby={errors?.length ? `${id}-erro` : undefined}
        className={`h-12 rounded-[14px] border-[1.5px] bg-white px-4 text-base text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar ${errors?.length ? "border-rosa-ink" : "border-borda-forte"}`}
      >
        <option value="">Selecione</option>
        {states.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>
      {!!errors?.length && (
        <p id={`${id}-erro`} className="text-sm text-rosa-ink">
          {errors.join(" ")}
        </p>
      )}
    </div>
  );
}

export function AddressForm({
  action,
  address,
  onDone,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  address?: Address;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [fields, setFields] = useState({
    cep: formatCep(address?.cep ?? ""),
    rua: address?.rua ?? "",
    numero: address?.numero ?? "",
    complemento: address?.complemento ?? "",
    bairro: address?.bairro ?? "",
    cidade: address?.cidade ?? "",
    uf: address?.uf ?? "",
  });
  const [lookupMessage, setLookupMessage] = useState("");
  const numberRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const handledStateRef = useRef<FormState | null>(null);
  const prefix = useId();

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (state.ok && handledStateRef.current !== state) {
      handledStateRef.current = state;
      onDone?.();
    }
  }, [state, onDone]);

  async function fetchAddress(cep: string, controller: AbortController) {
    try {
      const response = await fetch(`/api/cep/${cep}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("CEP lookup failed");
      const data: unknown = await response.json();
      const parsed = lookupSchema.safeParse(data);
      if (controller.signal.aborted || requestRef.current !== controller)
        return;
      if (!parsed.success || !parsed.data.endereco) {
        setLookupMessage("CEP não encontrado. Preencha o endereço.");
        return;
      }
      const result = parsed.data.endereco;
      setFields((previous) => ({
        ...previous,
        rua: result.rua,
        bairro: result.bairro,
        cidade: result.cidade,
        uf: result.uf,
      }));
      setLookupMessage("");
      numberRef.current?.focus();
    } catch {
      if (!controller.signal.aborted && requestRef.current === controller)
        setLookupMessage(
          "Não foi possível consultar o CEP. Preencha o endereço.",
        );
    }
  }

  function changeCep(value: string) {
    requestRef.current?.abort();
    const masked = formatCep(value);
    setFields((previous) => ({ ...previous, cep: masked }));
    const digits = onlyDigits(masked);
    if (digits.length !== 8) {
      setLookupMessage("");
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setLookupMessage("Buscando CEP...");
    void fetchAddress(digits, controller);
  }

  return (
    <FieldErrorsContext.Provider value={state.fieldErrors}>
      <form
        action={formAction}
        noValidate
        aria-busy={pending}
        className="flex flex-col gap-5 font-sans"
      >
        {address && <input type="hidden" name="id" value={address.id} />}
        {state.message && (
          <p
            role="alert"
            className={`rounded-[14px] p-4 text-sm ${state.ok ? "bg-[#ECFDF3] text-estoque" : "bg-[#FFF0F7] text-rosa-ink"}`}
          >
            {state.message}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-3">
            <FieldInput
              id={`${prefix}-cep`}
              name="cep"
              label="CEP"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={9}
              required
              value={fields.cep}
              onChange={(event) => changeCep(event.target.value)}
            />
            <p
              role="status"
              aria-live="polite"
              className="mt-2 text-sm text-texto-2"
            >
              {lookupMessage}
            </p>
          </div>
          <div className="md:col-span-3">
            <FieldInput
              id={`${prefix}-numero`}
              name="numero"
              label="Número"
              required
              inputRef={numberRef}
              value={fields.numero}
              onChange={(event) =>
                setFields((previous) => ({
                  ...previous,
                  numero: event.target.value,
                }))
              }
            />
          </div>
          <div className="md:col-span-6">
            <FieldInput
              id={`${prefix}-rua`}
              name="rua"
              label="Rua"
              autoComplete="address-line1"
              required
              value={fields.rua}
              onChange={(event) =>
                setFields((previous) => ({
                  ...previous,
                  rua: event.target.value,
                }))
              }
            />
          </div>
          <div className="md:col-span-6">
            <FieldInput
              id={`${prefix}-complemento`}
              name="complemento"
              label="Complemento (opcional)"
              autoComplete="address-line2"
              value={fields.complemento}
              onChange={(event) =>
                setFields((previous) => ({
                  ...previous,
                  complemento: event.target.value,
                }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <FieldInput
              id={`${prefix}-bairro`}
              name="bairro"
              label="Bairro"
              required
              value={fields.bairro}
              onChange={(event) =>
                setFields((previous) => ({
                  ...previous,
                  bairro: event.target.value,
                }))
              }
            />
          </div>
          <div className="md:col-span-3">
            <FieldInput
              id={`${prefix}-cidade`}
              name="cidade"
              label="Cidade"
              autoComplete="address-level2"
              required
              value={fields.cidade}
              onChange={(event) =>
                setFields((previous) => ({
                  ...previous,
                  cidade: event.target.value,
                }))
              }
            />
          </div>
          <div className="md:col-span-1">
            <StateSelect
              id={`${prefix}-uf`}
              value={fields.uf}
              onChange={(value) =>
                setFields((previous) => ({ ...previous, uf: value }))
              }
            />
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-[15px] text-noite">
          <input
            type="checkbox"
            name="principal"
            defaultChecked={address?.principal ?? false}
            className="size-5 accent-ultramar focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
          />
          Usar como endereço principal
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <button
            type="submit"
            disabled={pending}
            className="min-h-[52px] rounded-[14px] bg-ultramar px-7 font-display font-bold text-white hover:bg-ultramar-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Aguarde..." : "Salvar endereço"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              requestRef.current?.abort();
              onDone?.();
            }}
            className="min-h-[52px] rounded-[14px] border border-borda-forte px-7 font-display font-bold text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </form>
    </FieldErrorsContext.Provider>
  );
}
