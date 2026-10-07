"use client";

import { useEffect, useId, useRef, useState } from "react";
import { variantSchema } from "@/lib/admin/product-schema";

export type VariantDraft = {
  id?: string;
  sku: string;
  nome: string;
  preco: string;
  precoDe: string;
  custo: string;
  estoque: string;
  pesoG: string;
  alturaCm: string;
  larguraCm: string;
  comprimentoCm: string;
  ean: string;
};
const emptyDraft: VariantDraft = {
  sku: "",
  nome: "",
  preco: "",
  precoDe: "",
  custo: "",
  estoque: "0",
  pesoG: "",
  alturaCm: "",
  larguraCm: "",
  comprimentoCm: "",
  ean: "",
};
const fields: {
  key: Exclude<keyof VariantDraft, "id">;
  label: string;
  mode?: "decimal" | "numeric";
}[] = [
  { key: "nome", label: "Nome da variação (cor, tamanho...)" },
  { key: "sku", label: "SKU" },
  { key: "preco", label: "Preço (R$)", mode: "decimal" },
  { key: "precoDe", label: "Preço 'de' (R$, opcional)", mode: "decimal" },
  {
    key: "custo",
    label: "Custo (R$, opcional — não aparece para o cliente)",
    mode: "decimal",
  },
  { key: "estoque", label: "Estoque", mode: "numeric" },
  { key: "pesoG", label: "Peso (g)", mode: "numeric" },
  { key: "alturaCm", label: "Altura (cm)", mode: "decimal" },
  { key: "larguraCm", label: "Largura (cm)", mode: "decimal" },
  { key: "comprimentoCm", label: "Comprimento (cm)", mode: "decimal" },
  { key: "ean", label: "Código de barras (EAN, opcional)", mode: "numeric" },
];

export function VariantEditor({
  initial,
  errors,
  name = "variantes",
}: {
  initial: VariantDraft[];
  errors?: Partial<Record<string, string[]>>;
  name?: string;
}) {
  const [rows, setRows] = useState(() =>
    (initial.length ? initial : [emptyDraft]).map((draft, index) => ({
      key: `initial-${index}`,
      draft: { ...draft },
    })),
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string[]>>({});
  const nextKeyRef = useRef(0);
  const focusRef = useRef<string | null>(null);
  const prefix = useId();
  useEffect(() => {
    if (focusRef.current) {
      document.getElementById(focusRef.current)?.focus();
      focusRef.current = null;
    }
  }, [rows]);
  function validate(draft: VariantDraft, key: string, field: string) {
    const parsed = variantSchema.safeParse(draft);
    setLocalErrors((previous) => ({
      ...previous,
      [`${key}.${field}`]: parsed.success
        ? []
        : parsed.error.issues
            .filter((issue) => issue.path[0] === field)
            .map((issue) => issue.message),
    }));
  }
  return (
    <div className="flex flex-col gap-4 font-sans">
      <p className="rounded-[14px] bg-ultramar-50 p-4 text-sm text-noite">
        Peso e medidas da embalagem pronta para envio. Eles definem o frete.
      </p>
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(rows.map((row) => row.draft))}
      />
      {rows.map((row, index) => (
        <fieldset
          key={row.key}
          className="rounded-[22px] border border-borda bg-white p-5"
        >
          <legend className="px-2 font-display text-lg font-bold text-noite">
            Variação {index + 1}
          </legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {fields.map((field) => {
              const id = `${prefix}-${row.key}-${field.key}`;
              const messages =
                errors?.[`${name}.${index}.${field.key}`] ??
                localErrors[`${row.key}.${field.key}`];
              return (
                <div key={field.key} className="flex min-w-0 flex-col gap-2">
                  <label htmlFor={id} className="text-sm font-bold text-noite">
                    {field.label}
                  </label>
                  <input
                    id={id}
                    value={row.draft[field.key]}
                    inputMode={field.mode}
                    onChange={(event) =>
                      setRows((previous) =>
                        previous.map((current) =>
                          current.key === row.key
                            ? {
                                ...current,
                                draft: {
                                  ...current.draft,
                                  [field.key]: event.target.value,
                                },
                              }
                            : current,
                        ),
                      )
                    }
                    onBlur={() => validate(row.draft, row.key, field.key)}
                    aria-invalid={!!messages?.length || undefined}
                    aria-describedby={
                      messages?.length ? `${id}-erro` : undefined
                    }
                    className={`h-12 rounded-[14px] border-[1.5px] px-3 text-base text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar ${messages?.length ? "border-rosa-ink" : "border-borda-forte"}`}
                  />
                  {!!messages?.length && (
                    <p id={`${id}-erro`} className="text-sm text-rosa-ink">
                      {messages.join(" ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            disabled={rows.length === 1}
            onClick={() =>
              setRows((previous) =>
                previous.filter((current) => current.key !== row.key),
              )
            }
            className="mt-4 min-h-12 rounded-[14px] border border-rosa-ink px-4 font-bold text-rosa-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:opacity-40"
          >
            Remover
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() => {
          const key = `added-${nextKeyRef.current++}`;
          focusRef.current = `${prefix}-${key}-nome`;
          setRows((previous) => {
            const last = previous.at(-1)?.draft;
            return [
              ...previous,
              {
                key,
                draft: {
                  ...emptyDraft,
                  pesoG: last?.pesoG ?? "",
                  alturaCm: last?.alturaCm ?? "",
                  larguraCm: last?.larguraCm ?? "",
                  comprimentoCm: last?.comprimentoCm ?? "",
                },
              },
            ];
          });
        }}
        className="min-h-12 self-start rounded-[14px] border border-ultramar px-5 font-display font-bold text-ultramar focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
      >
        Adicionar variação
      </button>
    </div>
  );
}
