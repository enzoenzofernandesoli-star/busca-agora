import Image from "next/image";
import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { toggleProduct } from "@/lib/admin/actions";
import { listProducts } from "@/lib/admin/queries";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Produtos" };

const filtros = [
  { valor: "", label: "Todos" },
  { valor: "ativos", label: "À venda" },
  { valor: "inativos", label: "Fora da loja" },
  { valor: "estoque", label: "Estoque baixo" },
] as const;

type Filtro = "ativos" | "inativos" | "estoque";

function ToggleButton({
  id,
  campo,
  ligado,
  ligadoLabel,
  desligadoLabel,
}: {
  id: string;
  campo: "ativo" | "destaque";
  ligado: boolean;
  ligadoLabel: string;
  desligadoLabel: string;
}) {
  return (
    <form action={toggleProduct}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="campo" value={campo} />
      <input type="hidden" name="valor" value={ligado ? "false" : "true"} />
      <button
        type="submit"
        className={`min-h-11 cursor-pointer rounded-full px-4 text-sm font-bold ${
          ligado ? "bg-ultramar-50 text-ultramar" : "bg-fundo text-texto-2"
        }`}
      >
        {ligado ? ligadoLabel : desligadoLabel}
      </button>
    </form>
  );
}

export default async function AdminProdutos(
  props: PageProps<"/admin/produtos">,
) {
  const params = await props.searchParams;
  const busca = typeof params.q === "string" ? params.q : "";
  const filtro = (["ativos", "inativos", "estoque"] as const).find(
    (f) => f === params.filtro,
  ) as Filtro | undefined;
  const produtos = await listProducts({ busca, filtro });
  const excluido = params.excluido === "1";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
          Produtos
        </h1>
        <Link
          href="/admin/produtos/novo"
          className="flex min-h-12 items-center rounded-[14px] bg-ultramar px-6 font-display font-bold text-white no-underline hover:bg-ultramar-700 hover:text-white"
        >
          Cadastrar produto
        </Link>
      </div>

      {excluido ? (
        <p
          role="status"
          className="m-0 rounded-[14px] bg-[#ECFDF3] p-4 text-[15px] text-estoque"
        >
          Produto excluído.
        </p>
      ) : null}

      <form className="flex flex-wrap gap-3" action="/admin/produtos">
        <label htmlFor="q" className="sr-only">
          Buscar produto pelo nome
        </label>
        <input
          id="q"
          name="q"
          defaultValue={busca}
          placeholder="Buscar pelo nome"
          className="h-12 min-w-0 flex-1 rounded-[14px] border-[1.5px] border-borda-forte bg-white px-4 text-base"
        />
        {filtro ? <input type="hidden" name="filtro" value={filtro} /> : null}
        <button
          type="submit"
          className="min-h-12 cursor-pointer rounded-[14px] bg-noite px-6 font-bold text-white"
        >
          Buscar
        </button>
      </form>

      <nav aria-label="Filtrar produtos" className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <Link
            key={f.valor}
            href={`/admin/produtos${f.valor ? `?filtro=${f.valor}` : ""}`}
            aria-current={(filtro ?? "") === f.valor ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-full border px-4 text-sm font-bold no-underline ${
              (filtro ?? "") === f.valor
                ? "border-ultramar bg-ultramar-50 text-ultramar"
                : "border-borda bg-white text-noite"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <DataTable
        linhas={produtos}
        chave={(p) => p.id}
        vazio="Nenhum produto aqui. Clique em “Cadastrar produto” para começar."
        colunas={[
          {
            titulo: "Produto",
            render: (p) => (
              <Link
                href={`/admin/produtos/${p.id}`}
                className="flex items-center gap-3 font-bold"
              >
                <span className="relative size-12 flex-none overflow-hidden rounded-xl bg-fundo">
                  {p.capa ? (
                    <Image
                      src={p.capa}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                {p.nome}
              </Link>
            ),
          },
          { titulo: "Categoria", render: (p) => p.categoria },
          {
            titulo: "Preço",
            render: (p) =>
              p.precoMinCents === null ? "—" : formatBRL(p.precoMinCents),
          },
          {
            titulo: "Estoque",
            render: (p) => (
              <span
                className={
                  p.estoque <= 3 ? "font-bold text-rosa-ink" : undefined
                }
              >
                {p.estoque}
              </span>
            ),
          },
          {
            titulo: "Na loja",
            render: (p) => (
              <ToggleButton
                id={p.id}
                campo="ativo"
                ligado={p.ativo}
                ligadoLabel="À venda"
                desligadoLabel="Fora da loja"
              />
            ),
          },
          {
            titulo: "Destaque",
            render: (p) => (
              <ToggleButton
                id={p.id}
                campo="destaque"
                ligado={p.destaque}
                ligadoLabel="Em destaque"
                desligadoLabel="Normal"
              />
            ),
          },
        ]}
      />
    </>
  );
}
