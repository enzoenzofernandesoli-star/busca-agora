"use client";

import { startTransition, useActionState, useState } from "react";

import {
  ImageUploader,
  type AdminImage,
} from "@/components/admin/image-uploader";
import {
  VariantEditor,
  type VariantDraft,
} from "@/components/admin/variant-editor";
import { FieldErrorsContext, FieldInput } from "@/components/conta/auth-form";
import { requestImageUpload, saveProduct } from "@/lib/admin/actions";
import { initialFormState } from "@/lib/forms/state";

type Option = { id: string; nome: string };

export type ProductFormInitial = {
  id?: string;
  nome: string;
  slug: string;
  descricao: string;
  categoryId: string;
  brandId: string;
  ncm: string;
  cfop: string;
  origem: number;
  ativo: boolean;
  destaque: boolean;
  imagens: AdminImage[];
  variantes: VariantDraft[];
};

const label = "text-[15px] font-bold text-noite";
const control =
  "h-12 w-full rounded-[14px] border-[1.5px] border-borda-forte bg-white px-4 text-base text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar";
const card =
  "flex flex-col gap-5 rounded-[22px] border border-borda bg-white p-5 md:p-8";

const ORIGENS = [
  "0 — Nacional",
  "1 — Estrangeira, importação direta",
  "2 — Estrangeira, comprada no mercado interno",
  "3 — Nacional, mais de 40% importado",
  "4 — Nacional, processos produtivos básicos",
  "5 — Nacional, até 40% importado",
  "6 — Estrangeira, importação direta sem similar",
  "7 — Estrangeira, mercado interno sem similar",
  "8 — Nacional, mais de 70% importado",
];

function Errors({
  errors,
  name,
}: {
  errors: Partial<Record<string, string[]>> | undefined;
  name: string;
}) {
  const list = errors?.[name];
  return list?.length ? (
    <p id={`${name}-erro`} className="m-0 text-sm text-rosa-ink">
      {list.join(" ")}
    </p>
  ) : null;
}

// Not a plain <form action>: React 19 resets the form after an action, which
// would wipe the variant editor and photos on a validation error. The
// submit is intercepted and the action called in a transition instead.
export function ProductForm({
  initial,
  categorias,
  marcas,
}: {
  initial: ProductFormInitial;
  categorias: Option[];
  marcas: Option[];
}) {
  const [state, formAction, pending] = useActionState(
    saveProduct,
    initialFormState,
  );
  const [imagens, setImagens] = useState<AdminImage[]>(initial.imagens);
  const [nome, setNome] = useState(initial.nome);
  const errors = state.fieldErrors;

  return (
    <FieldErrorsContext.Provider value={errors}>
      <form
        noValidate
        aria-busy={pending}
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => formAction(data));
        }}
      >
        {initial.id ? (
          <input type="hidden" name="id" value={initial.id} />
        ) : null}
        <input type="hidden" name="imagens" value={JSON.stringify(imagens)} />

        {state.message ? (
          <p
            role="alert"
            className="m-0 rounded-[14px] bg-rosa-tile p-4 text-[15px] text-rosa-ink"
          >
            {state.message}
          </p>
        ) : null}

        <section className={card} aria-labelledby="sec-dados">
          <h2 id="sec-dados" className="m-0 font-display text-xl font-bold">
            Dados do produto
          </h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="nome" className={label}>
              Nome do produto
            </label>
            <input
              id="nome"
              name="nome"
              required
              maxLength={120}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={control}
              aria-describedby={errors?.nome ? "nome-erro" : undefined}
            />
            <Errors errors={errors} name="nome" />
          </div>
          <FieldInput
            id="slug"
            name="slug"
            label="Endereço na loja (opcional)"
            defaultValue={initial.slug}
            hint="Fica em buscaagora.com.br/p/… Em branco, é criado a partir do nome."
            maxLength={80}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor="descricao" className={label}>
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              rows={6}
              maxLength={5000}
              defaultValue={initial.descricao}
              className="w-full rounded-[14px] border-[1.5px] border-borda-forte bg-white p-4 text-base text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
            />
            <p className="m-0 text-sm text-texto-2">
              Para quem é, o que resolve e o que vem na caixa. Linha em branco
              separa parágrafos.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="categoryId" className={label}>
                Categoria
              </label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={initial.categoryId}
                className={control}
                required
              >
                <option value="">Escolha</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <Errors errors={errors} name="categoryId" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="brandId" className={label}>
                Marca (opcional)
              </label>
              <select
                id="brandId"
                name="brandId"
                defaultValue={initial.brandId}
                className={control}
              >
                <option value="">Sem marca</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-bold">
              <input
                type="checkbox"
                name="ativo"
                defaultChecked={initial.ativo}
                className="size-5 accent-ultramar"
              />
              À venda na loja
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-bold">
              <input
                type="checkbox"
                name="destaque"
                defaultChecked={initial.destaque}
                className="size-5 accent-ultramar"
              />
              Destaque em &quot;Mais buscados&quot;
            </label>
          </div>
        </section>

        <section className={card} aria-labelledby="sec-fotos">
          <h2 id="sec-fotos" className="m-0 font-display text-xl font-bold">
            Fotos
          </h2>
          <p className="m-0 text-sm text-texto-2">
            Fundo branco, produto centralizado. A primeira foto é a capa.
          </p>
          <ImageUploader
            value={imagens}
            onChange={setImagens}
            requestUpload={requestImageUpload}
            nomeProduto={nome}
          />
        </section>

        <section className={card} aria-labelledby="sec-variacoes">
          <h2 id="sec-variacoes" className="m-0 font-display text-xl font-bold">
            Variações, preço e estoque
          </h2>
          <VariantEditor initial={initial.variantes} errors={errors} />
          <Errors errors={errors} name="variantes" />
        </section>

        <section className={card} aria-labelledby="sec-fiscal">
          <h2 id="sec-fiscal" className="m-0 font-display text-xl font-bold">
            Dados fiscais
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            <FieldInput
              id="ncm"
              name="ncm"
              label="NCM"
              inputMode="numeric"
              defaultValue={initial.ncm}
              placeholder="8518.30.00"
              hint="Código fiscal do produto (8 dígitos). Está na nota do fornecedor."
              required
              maxLength={10}
            />
            <FieldInput
              id="cfop"
              name="cfop"
              label="CFOP"
              inputMode="numeric"
              defaultValue={initial.cfop}
              maxLength={4}
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="origem" className={label}>
                Origem
              </label>
              <select
                id="origem"
                name="origem"
                defaultValue={String(initial.origem)}
                className={control}
              >
                {ORIGENS.map((o, i) => (
                  <option key={o} value={i}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="min-h-14 cursor-pointer rounded-2xl bg-ultramar px-8 font-display text-[17px] font-bold text-white hover:bg-ultramar-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar produto"}
          </button>
        </div>
      </form>
    </FieldErrorsContext.Provider>
  );
}
