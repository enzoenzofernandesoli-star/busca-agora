import Link from "next/link";

import { ProductForm } from "@/components/admin/product-form";
import { listCategoriesAndBrands } from "@/lib/admin/queries";

export const metadata = { title: "Cadastrar produto" };

export default async function NovoProduto() {
  const { categorias, marcas } = await listCategoriesAndBrands();
  return (
    <>
      <Link href="/admin/produtos" className="text-[15px] font-bold">
        ← Produtos
      </Link>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        Cadastrar produto
      </h1>
      <ProductForm
        categorias={categorias.map((c) => ({ id: c.id, nome: c.nome }))}
        marcas={marcas.map((m) => ({ id: m.id, nome: m.nome }))}
        initial={{
          nome: "",
          slug: "",
          descricao: "",
          categoryId: "",
          brandId: "",
          ncm: "",
          cfop: "5102",
          origem: 0,
          // New products start out of the store until reviewed.
          ativo: false,
          destaque: false,
          imagens: [],
          variantes: [],
        }}
      />
    </>
  );
}
