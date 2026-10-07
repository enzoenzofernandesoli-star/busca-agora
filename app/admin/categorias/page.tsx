import { AuthForm } from "@/components/conta/auth-form";
import { Field } from "@/components/conta/field";
import { saveCategory } from "@/lib/admin/actions";
import { listCategoriesAndBrands } from "@/lib/admin/queries";

export const metadata = { title: "Categorias" };

type Categoria = {
  id?: string;
  nome: string;
  slug: string;
  cor: string;
  ordem: number;
  ativa: boolean;
};

function CategoryForm({ categoria }: { categoria: Categoria }) {
  const id = categoria.id ?? "nova";
  return (
    <AuthForm
      action={saveCategory}
      submitLabel={categoria.id ? "Salvar categoria" : "Criar categoria"}
    >
      {categoria.id ? (
        <input type="hidden" name="id" value={categoria.id} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          id={`${id}-nome`}
          name="nome"
          label="Nome"
          defaultValue={categoria.nome}
          required
        />
        <Field
          id={`${id}-slug`}
          name="slug"
          label="Endereço (/c/…)"
          defaultValue={categoria.slug}
          hint="Letras minúsculas e hífen, ex.: casa-e-cozinha"
          required
        />
        <Field
          id={`${id}-cor`}
          name="cor"
          label="Cor (#RRGGBB)"
          defaultValue={categoria.cor}
          required
          maxLength={7}
        />
        <Field
          id={`${id}-ordem`}
          name="ordem"
          label="Ordem no menu"
          inputMode="numeric"
          defaultValue={String(categoria.ordem)}
        />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-bold">
        <input
          type="checkbox"
          name="ativa"
          defaultChecked={categoria.ativa}
          className="size-5 accent-ultramar"
        />
        Aparece na loja
      </label>
    </AuthForm>
  );
}

export default async function AdminCategorias() {
  const { categorias } = await listCategoriesAndBrands();
  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        Categorias
      </h1>
      <p className="m-0 text-[15px] text-texto-2">
        Eletrônicos e Cosméticos já vêm prontas. A cor aparece nos cartões e nas
        etiquetas dos produtos.
      </p>
      {categorias.map((c) => (
        <section
          key={c.id}
          aria-label={c.nome}
          className="rounded-[22px] border border-borda bg-white p-5 md:p-7"
        >
          <h2 className="m-0 mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <span
              aria-hidden="true"
              className="size-4 rounded"
              style={{ background: c.cor }}
            />
            {c.nome}
          </h2>
          <CategoryForm categoria={c} />
        </section>
      ))}
      <section
        aria-label="Nova categoria"
        className="rounded-[22px] border border-dashed border-borda-forte bg-white p-5 md:p-7"
      >
        <h2 className="m-0 mb-4 font-display text-xl font-bold">
          Nova categoria
        </h2>
        <CategoryForm
          categoria={{
            nome: "",
            slug: "",
            cor: "#3324F5",
            ordem: categorias.length + 1,
            ativa: false,
          }}
        />
      </section>
    </>
  );
}
