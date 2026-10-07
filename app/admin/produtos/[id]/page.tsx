import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import {
  getProductForEdit,
  listCategoriesAndBrands,
} from "@/lib/admin/queries";
import { centsToReaisInput } from "@/lib/catalog/filters";

export const metadata = { title: "Editar produto" };

const dec = (n: number | string) => String(n).replace(".", ",");

export default async function EditarProduto(
  props: PageProps<"/admin/produtos/[id]">,
) {
  const { id } = await props.params;
  const salvo = (await props.searchParams).salvo === "1";
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [produto, { categorias, marcas }] = await Promise.all([
    getProductForEdit(id),
    listCategoriesAndBrands(),
  ]);
  if (!produto) notFound();

  return (
    <>
      <Link href="/admin/produtos" className="text-[15px] font-bold">
        ← Produtos
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
          {produto.nome}
        </h1>
        {produto.ativo ? (
          <Link
            href={`/p/${produto.slug}`}
            className="text-[15px] font-bold"
            target="_blank"
          >
            Ver na loja ↗
          </Link>
        ) : null}
      </div>
      {salvo ? (
        <p
          role="status"
          className="m-0 rounded-[14px] bg-[#ECFDF3] p-4 text-[15px] text-estoque"
        >
          Produto salvo.
        </p>
      ) : null}
      <ProductForm
        key={produto.updated_at}
        categorias={categorias.map((c) => ({ id: c.id, nome: c.nome }))}
        marcas={marcas.map((m) => ({ id: m.id, nome: m.nome }))}
        initial={{
          id: produto.id,
          nome: produto.nome,
          slug: produto.slug,
          descricao: produto.descricao,
          categoryId: produto.category_id,
          brandId: produto.brand_id ?? "",
          ncm: produto.ncm,
          cfop: produto.cfop,
          origem: produto.origem,
          ativo: produto.ativo,
          destaque: produto.destaque,
          imagens: produto.product_images.map((img) => ({
            id: img.id,
            url: img.url,
            path: img.url,
            alt: img.alt,
          })),
          variantes: produto.product_variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            nome: v.nome,
            preco: centsToReaisInput(v.preco_cents),
            precoDe: centsToReaisInput(v.preco_de_cents ?? undefined),
            custo: centsToReaisInput(v.custo_cents ?? undefined),
            estoque: String(v.estoque),
            pesoG: String(v.peso_g),
            alturaCm: dec(v.altura_cm),
            larguraCm: dec(v.largura_cm),
            comprimentoCm: dec(v.comprimento_cm),
            ean: v.ean ?? "",
          })),
        }}
      />
    </>
  );
}
