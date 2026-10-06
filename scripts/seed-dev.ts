import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/db/types.ts";

type VariantSeed = {
  sku: string;
  nome: string;
  preco_cents: number;
  preco_de_cents: number | null;
  custo_cents: number;
  estoque: number;
  peso_g: number;
  altura_cm: number;
  largura_cm: number;
  comprimento_cm: number;
};
type ProductSeed = {
  nome: string;
  slug: string;
  descricao: string;
  category: string;
  brand: string;
  ncm: string;
  destaque: boolean;
  variants: VariantSeed[];
};

const products: ProductSeed[] = [
  {
    nome: "Fone Bluetooth com microfone e cancelamento de ruído",
    slug: "fone-bluetooth-com-microfone-e-cancelamento-de-ruido",
    descricao:
      "Fone sem fio com microfone para chamadas e cancelamento de ruído para ouvir música. Acompanha estojo de carregamento e ponteiras para ajuste confortável.",
    category: "eletronicos",
    brand: "sonora",
    ncm: "85183000",
    destaque: true,
    variants: [
      {
        sku: "DEV-001-PRETO",
        nome: "Preto",
        preco_cents: 8990,
        preco_de_cents: 11990,
        custo_cents: 4045,
        estoque: 15,
        peso_g: 180,
        altura_cm: 5,
        largura_cm: 10,
        comprimento_cm: 12,
      },
      {
        sku: "DEV-001-BRANCO",
        nome: "Branco",
        preco_cents: 8990,
        preco_de_cents: 11990,
        custo_cents: 4045,
        estoque: 8,
        peso_g: 180,
        altura_cm: 5,
        largura_cm: 10,
        comprimento_cm: 12,
      },
      {
        sku: "DEV-001-AZUL",
        nome: "Azul",
        preco_cents: 8990,
        preco_de_cents: 11990,
        custo_cents: 4045,
        estoque: 0,
        peso_g: 180,
        altura_cm: 5,
        largura_cm: 10,
        comprimento_cm: 12,
      },
    ],
  },
  {
    nome: "Smartwatch com monitor de batimentos",
    slug: "smartwatch-com-monitor-de-batimentos",
    descricao:
      "Relógio inteligente com monitor de batimentos e registro de atividades do dia a dia. Exibe notificações do celular compatível e acompanha pulseira ajustável. As medições são destinadas ao uso pessoal e não substituem equipamentos médicos.",
    category: "eletronicos",
    brand: "pulso",
    ncm: "85176299",
    destaque: true,
    variants: [
      {
        sku: "DEV-002-PRETO",
        nome: "Preto",
        preco_cents: 12990,
        preco_de_cents: null,
        custo_cents: 5845,
        estoque: 10,
        peso_g: 220,
        altura_cm: 6,
        largura_cm: 10,
        comprimento_cm: 15,
      },
    ],
  },
  {
    nome: "Caixa de som portátil à prova d'água",
    slug: "caixa-de-som-portatil-a-prova-dagua",
    descricao:
      "Caixa de som portátil com conexão Bluetooth e proteção contra água para uso cotidiano. Possui alça de transporte e acompanha cabo de carregamento. Consulte as orientações do fabricante sobre exposição à água.",
    category: "eletronicos",
    brand: "sonora",
    ncm: "85182200",
    destaque: true,
    variants: [
      {
        sku: "DEV-003-PRETO",
        nome: "Preto",
        preco_cents: 14990,
        preco_de_cents: null,
        custo_cents: 6745,
        estoque: 4,
        peso_g: 650,
        altura_cm: 12,
        largura_cm: 12,
        comprimento_cm: 22,
      },
    ],
  },
  {
    nome: "Carregador turbo USB-C 20W",
    slug: "carregador-turbo-usb-c-20w",
    descricao:
      "Carregador de tomada com saída USB-C e potência de até 20 W para dispositivos compatíveis. O carregamento depende do aparelho e do cabo utilizado. Cabo vendido separadamente.",
    category: "eletronicos",
    brand: "pulso",
    ncm: "85044010",
    destaque: false,
    variants: [
      {
        sku: "DEV-004-BRANCO",
        nome: "Branco",
        preco_cents: 5990,
        preco_de_cents: null,
        custo_cents: 2695,
        estoque: 30,
        peso_g: 120,
        altura_cm: 5,
        largura_cm: 7,
        comprimento_cm: 10,
      },
    ],
  },
  {
    nome: "Sérum facial com vitamina C 30 ml",
    slug: "serum-facial-com-vitamina-c-30-ml",
    descricao:
      "Sérum facial com vitamina C em frasco de 30 ml com conta-gotas. Possui textura leve para complementar a rotina de cuidados com a pele. Aplique conforme as instruções da embalagem.",
    category: "cosmeticos",
    brand: "aurora-skin",
    ncm: "33049910",
    destaque: true,
    variants: [
      {
        sku: "DEV-005-30ML",
        nome: "30 ml",
        preco_cents: 4990,
        preco_de_cents: null,
        custo_cents: 2245,
        estoque: 20,
        peso_g: 130,
        altura_cm: 12,
        largura_cm: 5,
        comprimento_cm: 5,
      },
    ],
  },
  {
    nome: "Protetor solar facial FPS 50 com cor",
    slug: "protetor-solar-facial-fps-50-com-cor",
    descricao:
      "Protetor solar facial FPS 50 com cor para uso diário. A embalagem de 50 g facilita o transporte na bolsa. Aplique e reaplique conforme as orientações do fabricante.",
    category: "cosmeticos",
    brand: "aurora-skin",
    ncm: "33049910",
    destaque: false,
    variants: [
      {
        sku: "DEV-006-50G",
        nome: "50 g",
        preco_cents: 5990,
        preco_de_cents: null,
        custo_cents: 2695,
        estoque: 12,
        peso_g: 100,
        altura_cm: 14,
        largura_cm: 6,
        comprimento_cm: 4,
      },
    ],
  },
];

async function main() {
  let output: string;
  try {
    output = execSync("npx supabase status -o json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  } catch {
    throw new Error(
      "Não foi possível consultar o Supabase local. Inicie-o antes de executar seed-dev.",
    );
  }
  const jsonStart = output.indexOf("{");
  if (jsonStart < 0) throw new Error("Status do Supabase local inválido");
  let status: unknown;
  try {
    status = JSON.parse(output.slice(jsonStart));
  } catch {
    throw new Error("Status do Supabase local inválido");
  }
  if (
    typeof status !== "object" ||
    status === null ||
    !("API_URL" in status) ||
    typeof status.API_URL !== "string"
  ) {
    throw new Error("Status do Supabase local inválido");
  }
  let apiUrl: URL;
  try {
    apiUrl = new URL(status.API_URL);
  } catch {
    throw new Error("seed-dev só roda no Supabase local");
  }
  if (
    !["127.0.0.1", "localhost"].includes(apiUrl.hostname) ||
    !["http:", "https:"].includes(apiUrl.protocol) ||
    apiUrl.username ||
    apiUrl.password
  ) {
    throw new Error("seed-dev só roda no Supabase local");
  }
  if (
    !("SERVICE_ROLE_KEY" in status) ||
    typeof status.SERVICE_ROLE_KEY !== "string" ||
    !status.SERVICE_ROLE_KEY
  ) {
    throw new Error("Credencial do Supabase local indisponível");
  }
  const supabase = createClient<Database>(
    apiUrl.toString(),
    status.SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (request, options) =>
          fetch(request, { ...options, redirect: "error" }),
      },
    },
  );
  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", ["eletronicos", "cosmeticos"]);
  if (categoryError || !categories)
    throw new Error("Não foi possível consultar as categorias locais");
  const categoryIds = new Map(
    categories.map((category) => [category.slug, category.id]),
  );
  if (!categoryIds.has("eletronicos") || !categoryIds.has("cosmeticos"))
    throw new Error("Categorias locais obrigatórias não encontradas");
  const { data: brands, error: brandError } = await supabase
    .from("brands")
    .upsert(
      [
        { nome: "Sonora", slug: "sonora" },
        { nome: "Pulso", slug: "pulso" },
        { nome: "Aurora Skin", slug: "aurora-skin" },
      ],
      { onConflict: "slug" },
    )
    .select("id, slug");
  if (brandError || !brands)
    throw new Error("Não foi possível preparar as marcas locais");
  const brandIds = new Map(brands.map((brand) => [brand.slug, brand.id]));
  for (const product of products) {
    const categoryId = categoryIds.get(product.category);
    const brandId = brandIds.get(product.brand);
    if (!categoryId || !brandId)
      throw new Error("Categoria ou marca local não encontrada");
    const { data: row, error: productError } = await supabase
      .from("products")
      .upsert(
        {
          nome: product.nome,
          slug: product.slug,
          descricao: product.descricao,
          category_id: categoryId,
          brand_id: brandId,
          ncm: product.ncm,
          cfop: "5102",
          origem: 0,
          ativo: true,
          destaque: product.destaque,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (productError || !row)
      throw new Error("Não foi possível preparar os produtos locais");
    const { error: variantError } = await supabase
      .from("product_variants")
      .upsert(
        product.variants.map((variant) => ({
          ...variant,
          product_id: row.id,
          ean: null,
        })),
        { onConflict: "sku" },
      );
    if (variantError)
      throw new Error("Não foi possível preparar as variantes locais");
  }
  process.stdout.write("seed-dev: 6 produtos prontos\n");
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Falha ao preparar o catálogo local"}\n`,
  );
  process.exitCode = 1;
});
