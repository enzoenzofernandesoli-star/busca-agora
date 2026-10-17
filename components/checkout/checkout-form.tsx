"use client";

import Image from "next/image";
import Link from "next/link";
import { MARKETING_LABEL } from "@/components/conta/marketing-checkbox";
import { useActionState, useEffect, useId, useState } from "react";
import { z } from "zod";
import {
  CardIcon,
  ChipIcon,
  DropIcon,
  PixIcon,
  ShieldCheckIcon,
} from "@/components/loja/icons";
import { formatCep } from "@/lib/br/cep-format";
import { formatCpf, onlyDigits } from "@/lib/br/cpf";
import type { CheckoutData } from "@/lib/checkout/types";
import { formatBRL } from "@/lib/format";
import { initialFormState, type FormState } from "@/lib/forms/state";
import type { QuoteResult, ShippingOption } from "@/lib/shipping/types";

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
const addressSchema = z.object({
  endereco: z
    .object({
      rua: z.string(),
      bairro: z.string(),
      cidade: z.string(),
      uf: z.enum(states),
    })
    .nullable(),
});
const quoteSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    opcoes: z.array(
      z.object({
        servicoId: z.string(),
        servico: z.string(),
        transportadora: z.string(),
        precoCents: z.number().int().nonnegative().safe(),
        prazoDias: z.number().int().nonnegative(),
        prazoMin: z.number().int().nonnegative().optional(),
        prazoMax: z.number().int().nonnegative().optional(),
      }),
    ),
  }),
  z.object({
    ok: z.literal(false),
    motivo: z.enum(["cep_invalido", "sem_servico", "indisponivel"]),
  }),
]);
const reasons = {
  cep_invalido: "CEP inválido. Confira o endereço.",
  sem_servico: "Nenhum serviço disponível para este CEP.",
  indisponivel: "Não foi possível calcular o frete. Tente novamente.",
};
const fields = [
  ["cep", "CEP", "postal-code"],
  ["rua", "Rua", "address-line1"],
  ["numero", "Número", ""],
  ["complemento", "Complemento (opcional)", "address-line2"],
  ["bairro", "Bairro", ""],
  ["cidade", "Cidade", "address-level2"],
] as const;
const panel =
  "flex min-w-0 flex-col gap-4 rounded-[24px] border border-borda bg-white p-5 sm:p-7";
const input =
  "h-[46px] w-full rounded-[12px] border-[1.5px] border-borda-forte bg-white px-[14px] text-base text-noite";
const radio = "size-[22px] shrink-0 accent-ultramar";

export function CheckoutForm({
  data,
  action,
}: {
  data: CheckoutData;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const prefix = useId();
  const [values, setValues] = useState<Record<string, string>>(() => ({
    enderecoId:
      data.enderecos.find((a) => a.principal)?.id ??
      data.enderecos[0]?.id ??
      "novo",
    cpf: formatCpf(data.cpf ?? ""),
    pagamento: "pix",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    salvarEndereco: "",
    marketing: "",
  }));
  const [lastState, setLastState] = useState(state);
  const [formVersion, setFormVersion] = useState(0);
  // Restore the server's echoed fields once, without overwriting later edits.
  if (lastState !== state) {
    setLastState(state);
    // React resets native controls after an action, including checked radios.
    setFormVersion((version) => version + 1);
    if (state.values)
      setValues((previous) => ({
        ...previous,
        ...state.values,
        cpf: formatCpf(state.values?.cpf ?? previous.cpf ?? ""),
        cep: formatCep(state.values?.cep ?? previous.cep ?? ""),
      }));
  }
  const [lookupMessage, setLookupMessage] = useState("");
  const [quote, setQuote] = useState<{
    key: string;
    result: QuoteResult;
  } | null>(null);
  const [selection, setSelection] = useState<{
    key: string;
    id: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const isNew = values.enderecoId === "novo";
  const address = data.enderecos.find((a) => a.id === values.enderecoId);
  const cep = onlyDigits(isNew ? (values.cep ?? "") : (address?.cep ?? ""));
  const itemsJson = JSON.stringify(
    data.itens.map(({ variantId, quantidade }) => ({ variantId, quantidade })),
  );
  const quoteKey = JSON.stringify([values.enderecoId, cep, itemsJson, retry]);
  const validCep = /^\d{8}$/.test(cep);
  const result = quote?.key === quoteKey ? quote.result : null;
  const loading = validCep && result === null;
  const options = result?.ok ? result.opcoes : [];
  const selected =
    selection?.key === quoteKey
      ? options.find((o) => o.servicoId === selection.id)
      : undefined;

  useEffect(() => {
    if (!validCep) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/frete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cep,
            itens: JSON.parse(itemsJson) as {
              variantId: string;
              quantidade: number;
            }[],
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Shipping quote failed");
        const parsed = quoteSchema.safeParse(await response.json());
        if (!controller.signal.aborted)
          setQuote({
            key: quoteKey,
            result: parsed.success
              ? parsed.data
              : { ok: false, motivo: "indisponivel" },
          });
      } catch {
        if (!controller.signal.aborted)
          setQuote({
            key: quoteKey,
            result: { ok: false, motivo: "indisponivel" },
          });
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cep, validCep, itemsJson, quoteKey]);

  useEffect(() => {
    if (!isNew || !validCep) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/cep/${cep}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("CEP lookup failed");
        const parsed = addressSchema.safeParse(await response.json());
        if (controller.signal.aborted) return;
        if (parsed.success && parsed.data.endereco) {
          const found = parsed.data.endereco;
          setValues((previous) => ({ ...previous, ...found }));
          setLookupMessage("");
        } else setLookupMessage("CEP não encontrado. Preencha o endereço.");
      } catch {
        if (!controller.signal.aborted)
          setLookupMessage(
            "Não foi possível consultar o CEP. Preencha o endereço.",
          );
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cep, isNew, validCep]);

  function update(name: string, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
  }
  function error(name: string) {
    return state.fieldErrors?.[name]?.length ? (
      <p id={`${prefix}-${name}-error`} className="text-sm text-rosa-ink">
        {state.fieldErrors[name]?.join(" ")}
      </p>
    ) : null;
  }
  function errorProps(name: string) {
    return {
      "aria-invalid": !!state.fieldErrors?.[name]?.length || undefined,
      "aria-describedby": state.fieldErrors?.[name]?.length
        ? `${prefix}-${name}-error`
        : undefined,
    };
  }
  const choiceClass = (active: boolean) =>
    `flex min-h-11 cursor-pointer items-center gap-[14px] rounded-[16px] border-2 px-[18px] py-4 ${active ? "border-ultramar bg-ultramar-50" : "border-borda-forte bg-white"}`;

  return (
    <form
      key={formVersion}
      action={formAction}
      aria-busy={pending}
      className="flex min-w-0 flex-col gap-6 font-sans text-noite"
    >
      {state.message && (
        <p
          role="alert"
          className="rounded-[16px] bg-rosa-tile p-4 text-rosa-ink"
        >
          {state.message}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_396px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section
            className={panel}
            aria-labelledby={`${prefix}-address-title`}
          >
            <h2
              id={`${prefix}-address-title`}
              className="font-display text-xl font-bold"
            >
              1 · Endereço de entrega
            </h2>
            <fieldset
              className="flex min-w-0 flex-col gap-3"
              disabled={pending}
            >
              <legend className="sr-only">Escolha o endereço de entrega</legend>
              {data.enderecos.map((a) => (
                <label
                  key={a.id}
                  className={choiceClass(values.enderecoId === a.id)}
                >
                  <input
                    type="radio"
                    className={radio}
                    name="enderecoId"
                    value={a.id}
                    checked={values.enderecoId === a.id}
                    onChange={() => update("enderecoId", a.id)}
                    {...errorProps("enderecoId")}
                  />
                  <span className="min-w-0 text-[15px] leading-[1.45] break-words">
                    <b className="block">
                      {data.nome}
                      {a.principal ? " · Principal" : ""}
                    </b>
                    <span className="block text-texto-2">
                      {a.rua}, {a.numero}
                      {a.complemento ? ` · ${a.complemento}` : ""} · {a.bairro}
                    </span>
                    <span className="block text-texto-2">
                      {a.cidade} – {a.uf} · CEP {formatCep(a.cep)}
                    </span>
                  </span>
                </label>
              ))}
              <label className={choiceClass(isNew)}>
                <input
                  type="radio"
                  name="enderecoId"
                  value="novo"
                  checked={isNew}
                  onChange={() => update("enderecoId", "novo")}
                  className={radio}
                  {...errorProps("enderecoId")}
                />
                Usar outro endereço
              </label>
              {error("enderecoId")}
              {isNew && (
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                  {fields.map(([name, label, autoComplete]) => (
                    <div
                      key={name}
                      className={`flex min-w-0 flex-col gap-[6px] ${name === "rua" || name === "complemento" ? "sm:col-span-2" : ""}`}
                    >
                      <label
                        htmlFor={`${prefix}-${name}`}
                        className="text-sm font-bold"
                      >
                        {label}
                      </label>
                      <input
                        id={`${prefix}-${name}`}
                        name={name}
                        value={values[name]}
                        onChange={(e) => {
                          update(
                            name,
                            name === "cep"
                              ? formatCep(e.target.value)
                              : e.target.value,
                          );
                          if (name === "cep") setLookupMessage("");
                        }}
                        autoComplete={autoComplete || undefined}
                        required={name !== "complemento"}
                        inputMode={name === "cep" ? "numeric" : undefined}
                        maxLength={name === "cep" ? 9 : 200}
                        className={input}
                        {...errorProps(name)}
                      />
                      {error(name)}
                      {name === "cep" && (
                        <p role="status" className="text-sm text-texto-2">
                          {lookupMessage}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="flex flex-col gap-[6px]">
                    <label
                      htmlFor={`${prefix}-uf`}
                      className="text-sm font-bold"
                    >
                      UF
                    </label>
                    <select
                      id={`${prefix}-uf`}
                      name="uf"
                      value={values.uf}
                      onChange={(e) => update("uf", e.target.value)}
                      autoComplete="address-level1"
                      required
                      className={input}
                      {...errorProps("uf")}
                    >
                      <option value="">Selecione</option>
                      {states.map((uf) => (
                        <option key={uf}>{uf}</option>
                      ))}
                    </select>
                    {error("uf")}
                  </div>
                  <label className="flex min-h-11 items-center gap-3 sm:col-span-2">
                    <input
                      type="checkbox"
                      name="salvarEndereco"
                      checked={values.salvarEndereco === "on"}
                      onChange={(e) =>
                        update("salvarEndereco", e.target.checked ? "on" : "")
                      }
                      className="size-5 accent-ultramar"
                      {...errorProps("salvarEndereco")}
                    />
                    Salvar na minha conta
                  </label>
                  {error("salvarEndereco")}
                </div>
              )}
              <div className="flex max-w-[320px] flex-col gap-[6px]">
                <label htmlFor={`${prefix}-cpf`} className="text-sm font-bold">
                  CPF para a nota fiscal
                </label>
                <input
                  id={`${prefix}-cpf`}
                  name="cpf"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  value={values.cpf}
                  onChange={(e) => update("cpf", formatCpf(e.target.value))}
                  className={input}
                  {...errorProps("cpf")}
                />
                {error("cpf")}
              </div>
            </fieldset>
          </section>
          <section
            className={panel}
            aria-labelledby={`${prefix}-shipping-title`}
          >
            <h2
              id={`${prefix}-shipping-title`}
              className="font-display text-xl font-bold"
            >
              2 · Como você quer receber
            </h2>
            <div
              role="status"
              aria-live="polite"
              className="text-sm text-texto-2"
            >
              {!validCep
                ? "Informe um CEP válido para calcular o frete."
                : loading
                  ? "Calculando frete..."
                  : result && !result.ok
                    ? reasons[result.motivo]
                    : options.length === 0
                      ? "Nenhum serviço disponível para este CEP."
                      : "Escolha uma opção de entrega."}
            </div>
            {result && (!result.ok || options.length === 0) && (
              <button
                type="button"
                onClick={() => setRetry((n) => n + 1)}
                className="min-h-11 self-start font-bold text-ultramar"
              >
                Calcular novamente
              </button>
            )}
            <fieldset
              disabled={pending || loading}
              className="flex min-w-0 flex-col gap-[14px]"
            >
              <legend className="sr-only">Opções de frete</legend>
              {options.map((o: ShippingOption) => (
                <label
                  key={o.servicoId}
                  className={choiceClass(selected?.servicoId === o.servicoId)}
                >
                  <input
                    type="radio"
                    name="freteServicoId"
                    value={o.servicoId}
                    checked={selected?.servicoId === o.servicoId}
                    onChange={() =>
                      setSelection({ key: quoteKey, id: o.servicoId })
                    }
                    className={radio}
                    {...errorProps("freteServicoId")}
                  />
                  <span className="min-w-0 flex-1">
                    <b className="block text-base">{o.servico}</b>
                    <span className="text-sm text-texto-2">
                      Chega em até {o.prazoMax ?? o.prazoDias} dias úteis
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-[17px] font-bold">
                    {formatBRL(o.precoCents)}
                  </span>
                </label>
              ))}
            </fieldset>
            {error("freteServicoId")}
          </section>
          <section
            className={panel}
            aria-labelledby={`${prefix}-payment-title`}
          >
            <h2
              id={`${prefix}-payment-title`}
              className="font-display text-xl font-bold"
            >
              3 · Forma de pagamento
            </h2>
            <fieldset
              disabled={pending}
              className="grid min-w-0 grid-cols-2 gap-[10px]"
            >
              <legend className="sr-only">Escolha a forma de pagamento</legend>
              {(
                [
                  ["pix", "Pix", "aprovação na hora", PixIcon],
                  ["card", "Cartão de crédito", "até 12x", CardIcon],
                ] as const
              ).map(([value, label, subtitle, Icon]) => (
                <label
                  key={value}
                  className={`relative flex min-h-[92px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border-2 px-2 py-3 text-center ${values.pagamento === value ? "border-ultramar bg-ultramar-50" : "border-borda-forte bg-white"}`}
                >
                  <input
                    type="radio"
                    name="pagamento"
                    value={value}
                    checked={values.pagamento === value}
                    onChange={() => update("pagamento", value)}
                    className={`${radio} absolute top-2 right-2`}
                    {...errorProps("pagamento")}
                  />
                  <Icon size={22} />
                  <span className="font-display text-base font-bold">
                    {label}
                  </span>
                  <span className="text-xs text-texto-2">{subtitle}</span>
                </label>
              ))}
            </fieldset>
            {error("pagamento")}
            <p className="flex items-center gap-[14px] rounded-[16px] bg-fundo p-[18px] text-[15px] leading-[1.55] text-texto-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-lima text-noite">
                <ShieldCheckIcon size={20} />
              </span>
              Você paga na página segura do Mercado Pago.
            </p>
            {data.marketingOptIn ? null : (
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px] leading-normal">
                <input
                  type="checkbox"
                  name="marketing"
                  checked={values.marketing === "on"}
                  onChange={(e) =>
                    update("marketing", e.target.checked ? "on" : "")
                  }
                  className="mt-0.5 size-5 flex-none accent-ultramar"
                />
                <span>
                  {MARKETING_LABEL}{" "}
                  <span className="text-texto-2">(opcional)</span>
                </span>
              </label>
            )}
          </section>
        </div>
        <aside
          className={`${panel} gap-[18px]`}
          aria-labelledby={`${prefix}-summary-title`}
        >
          <h2
            id={`${prefix}-summary-title`}
            className="font-display text-xl font-bold"
          >
            Resumo do pedido
          </h2>
          {data.itens.map((item) => (
            <div key={item.variantId} className="flex items-center gap-[14px]">
              <span
                className={`relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[14px] ${item.categoria === "cosmeticos" ? "bg-rosa-tile text-rosa-ink" : "bg-ciano-tile text-ciano-ink"}`}
              >
                {item.imagemUrl ? (
                  <Image
                    src={item.imagemUrl}
                    alt={item.nome}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                ) : item.categoria === "cosmeticos" ? (
                  <DropIcon size={30} />
                ) : (
                  <ChipIcon size={30} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-[1.35] break-words">
                  {item.nome}
                </span>
                <span className="text-[13px] text-texto-2">
                  {item.variante ? `${item.variante} · ` : ""}
                  {item.quantidade}{" "}
                  {item.quantidade === 1 ? "unidade" : "unidades"}
                </span>
              </span>
              <span className="shrink-0 font-display text-[15px] font-bold">
                {formatBRL(item.precoCents * item.quantidade)}
              </span>
            </div>
          ))}
          <dl className="flex flex-col gap-[10px] border-t border-borda pt-4 text-[15px]">
            <div className="flex justify-between gap-3">
              <dt className="text-texto-2">Subtotal</dt>
              <dd>{formatBRL(data.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-texto-2">
                Frete{selected ? ` (${selected.servico})` : ""}
              </dt>
              <dd>
                {selected ? formatBRL(selected.precoCents) : "A calcular"}
              </dd>
            </div>
          </dl>
          <div className="flex items-baseline justify-between gap-3 border-t border-borda pt-4">
            <span className="font-display text-lg font-bold">Total</span>
            <span className="font-display text-[30px] font-extrabold tracking-[-0.02em]">
              {formatBRL(data.subtotalCents + (selected?.precoCents ?? 0))}
            </span>
          </div>
          <button
            type="submit"
            disabled={!selected || pending}
            aria-describedby={!selected ? `${prefix}-submit-hint` : undefined}
            className="min-h-[58px] rounded-[16px] bg-ultramar px-4 font-display text-[17px] font-bold text-white hover:bg-ultramar-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Aguarde..." : "Ir para o pagamento"}
          </button>
          {!selected && (
            <p id={`${prefix}-submit-hint`} className="text-sm text-texto-2">
              Escolha o frete para continuar.
            </p>
          )}
          <p className="text-center text-[13px] leading-[1.5] text-texto-2">
            Ao finalizar, você concorda com os{" "}
            <Link
              className="inline-flex min-h-11 items-center font-bold text-ultramar underline"
              href="/termos"
            >
              Termos de uso
            </Link>{" "}
            e a{" "}
            <Link
              className="inline-flex min-h-11 items-center font-bold text-ultramar underline"
              href="/privacidade"
            >
              Política de privacidade
            </Link>
            . Pagamento processado pelo Mercado Pago.
          </p>
        </aside>
      </div>
    </form>
  );
}
