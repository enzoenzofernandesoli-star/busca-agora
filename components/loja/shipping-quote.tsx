"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { z } from "zod";
import { PinIcon } from "@/components/loja/icons";
import { cepSchema, formatCep } from "@/lib/br/cep";
import { formatBRL } from "@/lib/format";
import { cartFingerprint } from "@/lib/shipping/package";
import type { QuoteResult, ShippingOption } from "@/lib/shipping/types";

type QuoteItem = { variantId: string; quantidade: number };
type ShippingQuoteProps = {
  itens: QuoteItem[];
  cepInicial?: string;
  onSelect?: (opcao: ShippingOption) => void;
  selecionadoId?: string;
};
type QuoteState =
  | { status: "idle" }
  | { status: "loading"; key: string }
  | { status: "error"; message: string }
  | { status: "success"; key: string; opcoes: ShippingOption[] };

const optionSchema = z.object({
  servicoId: z.string(),
  servico: z.string(),
  transportadora: z.string(),
  precoCents: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  prazoDias: z.number().int().nonnegative(),
  prazoMin: z.number().int().nonnegative().optional(),
  prazoMax: z.number().int().nonnegative().optional(),
});
const resultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), opcoes: z.array(optionSchema) }),
  z.object({
    ok: z.literal(false),
    motivo: z.enum(["cep_invalido", "sem_servico", "indisponivel"]),
  }),
]);
const messages = {
  cep_invalido: "CEP inválido. Confira os números.",
  sem_servico: "Nenhuma transportadora entrega nesse CEP para esses produtos.",
  indisponivel: "Não conseguimos calcular agora. Tente de novo em instantes.",
};

function subscribeStoredCep(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
function getStoredCep() {
  try {
    return window.localStorage.getItem("ba_cep") ?? "";
  } catch {
    return "";
  }
}
function getServerCep() {
  return "";
}

export function ShippingQuote({
  itens,
  cepInicial,
  onSelect,
  selecionadoId,
}: ShippingQuoteProps) {
  const storedCep = useSyncExternalStore(
    subscribeStoredCep,
    getStoredCep,
    getServerCep,
  );
  const [typedCep, setTypedCep] = useState<string | null>(null);
  const cep = typedCep ?? formatCep(cepInicial ?? storedCep);
  const [state, setState] = useState<QuoteState>({ status: "idle" });
  const requestRef = useRef<AbortController | null>(null);
  const lastCepRef = useRef<string | null>(null);
  const itemsRef = useRef(itens);
  const fingerprint = cartFingerprint(itens);
  const previousKeyRef = useRef(fingerprint);
  const id = useId();

  const quote = useCallback(async (destination: string, items: QuoteItem[]) => {
    requestRef.current?.abort();
    const parsedCep = cepSchema.safeParse(destination);
    if (!parsedCep.success) {
      setState({ status: "error", message: messages.cep_invalido });
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    const key = cartFingerprint(items);
    lastCepRef.current = parsedCep.data;
    setState({ status: "loading", key });
    try {
      window.localStorage.setItem("ba_cep", parsedCep.data);
    } catch {
      /* Storage is optional. */
    }
    try {
      const response = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: parsedCep.data, itens: items }),
        signal: controller.signal,
      });
      if (controller.signal.aborted || requestRef.current !== controller)
        return;
      if (response.status === 429) {
        setState({
          status: "error",
          message:
            "Muitas consultas seguidas. Espere um pouco e tente de novo.",
        });
        return;
      }
      const body: unknown = await response.json();
      if (controller.signal.aborted || requestRef.current !== controller)
        return;
      const parsed = resultSchema.safeParse(body);
      if (!parsed.success) throw new Error("Invalid shipping response");
      const result: QuoteResult = parsed.data;
      if (!response.ok && result.ok) throw new Error("Shipping quote failed");
      if (!result.ok)
        setState({ status: "error", message: messages[result.motivo] });
      else if (!result.opcoes.length)
        setState({ status: "error", message: messages.sem_servico });
      else setState({ status: "success", key, opcoes: result.opcoes });
    } catch {
      if (!controller.signal.aborted && requestRef.current === controller)
        setState({ status: "error", message: messages.indisponivel });
    }
  }, []);

  useEffect(() => {
    itemsRef.current = itens;
  }, [itens]);
  useEffect(() => {
    const changed = previousKeyRef.current !== fingerprint;
    previousKeyRef.current = fingerprint;
    if (!changed || !lastCepRef.current) return;
    requestRef.current?.abort();
    const timer = window.setTimeout(() => {
      if (lastCepRef.current) void quote(lastCepRef.current, itemsRef.current);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [fingerprint, quote]);
  useEffect(() => () => requestRef.current?.abort(), []);

  const stale = state.status === "success" && state.key !== fingerprint;
  const loading = state.status === "loading" || stale;
  const options = state.status === "success" && !stale ? state.opcoes : [];
  function optionContent(option: ShippingOption) {
    return (
      <>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-noite">
            {option.servico}
          </span>
          <span className="block text-sm text-texto-2">
            Chega em até {option.prazoDias} dias úteis
          </span>
        </span>
        <span className="shrink-0 font-display text-base font-bold text-noite">
          {formatBRL(option.precoCents)}
        </span>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-fundo p-[18px] font-sans">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void quote(cep, itens);
        }}
        className="flex flex-col gap-3"
      >
        <label
          htmlFor={`${id}-cep`}
          className="flex items-center gap-2 text-[15px] font-bold text-noite"
        >
          <PinIcon size={18} />
          Calcular frete e prazo
          <span className="sr-only"> (CEP)</span>
        </label>
        <div className="flex gap-2">
          <input
            id={`${id}-cep`}
            name="cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            maxLength={9}
            value={cep}
            onChange={(event) => {
              requestRef.current?.abort();
              lastCepRef.current = null;
              setTypedCep(formatCep(event.target.value));
              setState({ status: "idle" });
            }}
            aria-invalid={
              (state.status === "error" &&
                state.message === messages.cep_invalido) ||
              undefined
            }
            aria-describedby={
              state.status === "error" ? `${id}-erro` : undefined
            }
            className="h-[46px] min-w-0 flex-1 rounded-xl border-[1.5px] border-borda-forte bg-white px-3.5 text-base text-noite placeholder:text-texto-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
          />
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="h-[46px] shrink-0 rounded-xl bg-noite px-[18px] text-[15px] font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:cursor-wait disabled:opacity-60"
          >
            Calcular
          </button>
        </div>
      </form>
      {loading && (
        <p role="status" aria-live="polite" className="text-sm text-texto-2">
          Calculando...
        </p>
      )}
      {state.status === "error" && (
        <p id={`${id}-erro`} role="alert" className="text-sm text-rosa-ink">
          {state.message}
        </p>
      )}
      {options.length > 0 &&
        (onSelect ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[15px] font-bold text-noite">
              Escolha o frete
            </legend>
            {options.map((option) => (
              <label
                key={option.servicoId}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 ${selecionadoId === option.servicoId ? "border-ultramar" : "border-borda"}`}
              >
                <input
                  type="radio"
                  name={`${id}-frete`}
                  value={option.servicoId}
                  checked={selecionadoId === option.servicoId}
                  onChange={() => onSelect(option)}
                  className="size-4 accent-ultramar focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
                />
                {optionContent(option)}
              </label>
            ))}
          </fieldset>
        ) : (
          <ul aria-label="Opções de frete" className="flex flex-col gap-2">
            {options.map((option) => (
              <li
                key={option.servicoId}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-borda bg-white p-3"
              >
                {optionContent(option)}
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
