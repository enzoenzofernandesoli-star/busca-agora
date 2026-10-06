import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/loja/breadcrumb";
import {
  ExchangeIcon,
  PinIcon,
  ReceiptIcon,
  ShieldCheckIcon,
} from "@/components/loja/icons";
import { ProductBuyBox } from "@/components/loja/product-buy-box";
import { ProductCard } from "@/components/loja/product-card";
import { ProductGallery } from "@/components/loja/product-gallery";
import { getProduct, getRelated } from "@/lib/catalog/queries";
import { publicEnv } from "@/lib/env-public";
import { categoryStyles } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  breadcrumbJsonLd,
  jsonLdScript,
  productJsonLd,
} from "@/lib/seo/json-ld";

// Product pages are cached and refreshed at most every 5 minutes (ISR).
export const revalidate = 300;

export function generateStaticParams() {
  // Rendered on first visit, then cached; the store starts empty.
  return [];
}

export async function generateMetadata(
  props: PageProps<"/p/[produto]">,
): Promise<Metadata> {
  const produto = await getProduct((await props.params).produto);
  if (!produto) return { title: "Produto não encontrado" };
  const descricao =
    produto.descricao.slice(0, 155) ||
    `${produto.nome} na Busca Agora, com frete calculado no seu CEP.`;
  const imagem = produto.imagens[0];
  return {
    title: produto.nome,
    description: descricao,
    alternates: { canonical: `/p/${produto.slug}` },
    openGraph: {
      type: "website",
      title: produto.nome,
      description: descricao,
      url: `/p/${produto.slug}`,
      images: imagem ? [{ url: imagem.url, alt: imagem.alt }] : undefined,
    },
  };
}

const garantias = [
  { texto: "Compra protegida", Icon: ShieldCheckIcon },
  { texto: "Nota fiscal no pedido", Icon: ReceiptIcon },
  { texto: "Troca em até 7 dias", Icon: ExchangeIcon },
  { texto: "Envio com rastreio", Icon: PinIcon },
];

export default async function ProdutoPage(props: PageProps<"/p/[produto]">) {
  const produto = await getProduct((await props.params).produto);
  if (!produto) notFound();

  const relacionados = await getRelated(produto.categoria, produto.id);
  const cat = categoryStyles[produto.categoria];
  const precos = produto.variantes.map((v) => v.precoCents);
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  const jsonLd = [
    productJsonLd({
      siteUrl,
      slug: produto.slug,
      nome: produto.nome,
      descricao: produto.descricao,
      imagens: produto.imagens.map((img) => img.url),
      marca: produto.marcaNome ?? undefined,
      sku: produto.variantes[0]?.sku ?? produto.slug,
      precoCents: Math.min(...precos),
      precoMaxCents: Math.max(...precos),
      emEstoque: produto.variantes.some((v) => v.estoque > 0),
      categoria: produto.categoriaNome,
    }),
    breadcrumbJsonLd(siteUrl, [
      { nome: "Início", path: "/" },
      { nome: produto.categoriaNome, path: `/c/${produto.categoria}` },
      { nome: produto.nome, path: `/p/${produto.slug}` },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // jsonLdScript escapes "<", so the payload cannot close this tag.
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />

      <Breadcrumb
        itens={[
          { nome: "Início", href: "/" },
          { nome: produto.categoriaNome, href: `/c/${produto.categoria}` },
          { nome: produto.nome },
        ]}
      />

      <section className="flex flex-col gap-5 md:flex-row md:flex-wrap md:items-start md:gap-8">
        <div className="min-w-0 md:flex-[1_1_560px]">
          <ProductGallery
            images={produto.imagens}
            nome={produto.nome}
            categoria={produto.categoria}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5 rounded-[22px] border border-borda bg-white p-5 md:flex-[1_1_420px] md:rounded-[28px] md:p-8">
          <div className="flex flex-col gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-[13px] font-bold",
                cat.tile,
                cat.ink,
              )}
            >
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-[2px]", cat.cor)}
              />
              {produto.categoriaNome}
            </span>
            <h1 className="m-0 font-display text-2xl leading-[1.2] font-bold tracking-[-0.02em] md:text-[30px]">
              {produto.nome}
            </h1>
            <span className="text-sm text-texto-2">
              Vendido e entregue por <b className="text-noite">Busca Agora</b>
              {produto.marcaNome ? <> · Marca {produto.marcaNome}</> : null}
            </span>
          </div>

          <ProductBuyBox variantes={produto.variantes} />

          <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-3 p-0 text-sm text-[#3A3F60]">
            {garantias.map(({ texto, Icon }) => (
              <li key={texto} className="flex items-center gap-2">
                <Icon size={18} className="flex-none text-ultramar" />
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-5 md:flex-row md:flex-wrap md:items-start md:gap-8">
        <div className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-borda bg-white p-5 md:flex-[1_1_560px] md:rounded-[28px] md:p-8">
          <h2 className="m-0 font-display text-2xl font-bold">Descrição</h2>
          {produto.descricao ? (
            produto.descricao.split(/\n{2,}/).map((paragrafo) => (
              <p
                key={paragrafo.slice(0, 40)}
                className="m-0 text-base leading-[1.7] whitespace-pre-line text-[#3A3F60]"
              >
                {paragrafo}
              </p>
            ))
          ) : (
            <p className="m-0 text-base text-texto-2">Descrição em breve.</p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4 rounded-[22px] border border-borda bg-white p-5 md:flex-[1_1_420px] md:rounded-[28px] md:p-8">
          <h2 className="m-0 font-display text-2xl font-bold">Ficha técnica</h2>
          <table className="w-full border-collapse text-[15px]">
            <tbody>
              {[
                ["Marca", produto.marcaNome ?? "—"],
                ["Categoria", produto.categoriaNome],
                [
                  produto.variantes.length > 1 ? "Opções" : "Código",
                  produto.variantes.length > 1
                    ? produto.variantes.map((v) => v.nome).join(", ")
                    : (produto.variantes[0]?.sku ?? "—"),
                ],
              ].map(([rotulo, valor]) => (
                <tr
                  key={rotulo}
                  className="border-b border-borda last:border-0"
                >
                  <th
                    scope="row"
                    className="w-[45%] py-3 text-left font-medium text-texto-2"
                  >
                    {rotulo}
                  </th>
                  <td className="py-3">{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {relacionados.length > 0 ? (
        <section aria-labelledby="tambem" className="flex flex-col gap-5">
          <h2
            id="tambem"
            className="m-0 font-display text-[22px] font-extrabold tracking-[-0.02em] md:text-[28px]"
          >
            Quem buscou isso também viu
          </h2>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-5">
            {relacionados.map((p) => (
              <li key={p.id} className="flex">
                <ProductCard
                  href={`/p/${p.slug}`}
                  nome={p.nome}
                  categoria={p.categoria}
                  precoCents={p.precoCents}
                  imagemUrl={p.imagemUrl ?? undefined}
                  imagemAlt={p.imagemAlt ?? undefined}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
