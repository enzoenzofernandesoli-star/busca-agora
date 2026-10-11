import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/db/types.ts";

type Example = {
  name: string;
  category: "eletronicos" | "cosmeticos";
  ncm: string;
  description: string;
  variants: string[];
  price: number;
  weight: number;
  dimensions: [number, number, number];
  photos: [number, number];
};
type SeedClient = SupabaseClient<Database>;
type Counts = { created: number; skipped: number; failedPhotos: number };
class SeedError extends Error {}
const BUCKET = "produtos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const EXAMPLE_SUFFIX = "-exemplo";
const PHOTO_URLS: Record<number, string> = {
  6587325:
    "https://images.pexels.com/photos/6587325/pexels-photo-6587325.jpeg?auto=compress&cs=tinysrgb&w=1200",
  10946066:
    "https://images.pexels.com/photos/10946066/pexels-photo-10946066.jpeg?auto=compress&cs=tinysrgb&w=1200",
  37421859:
    "https://images.pexels.com/photos/37421859/pexels-photo-37421859.jpeg?auto=compress&cs=tinysrgb&w=1200",
  16886332:
    "https://images.pexels.com/photos/16886332/pexels-photo-16886332.jpeg?auto=compress&cs=tinysrgb&w=1200",
  7772558:
    "https://images.pexels.com/photos/7772558/pexels-photo-7772558.jpeg?auto=compress&cs=tinysrgb&w=1200",
  14555249:
    "https://images.pexels.com/photos/14555249/pexels-photo-14555249.jpeg?auto=compress&cs=tinysrgb&w=1200",
  13007642:
    "https://images.pexels.com/photos/13007642/pexels-photo-13007642.jpeg?auto=compress&cs=tinysrgb&w=1200",
  11947525:
    "https://images.pexels.com/photos/11947525/pexels-photo-11947525.jpeg?auto=compress&cs=tinysrgb&w=1200",
  914915:
    "https://images.pexels.com/photos/914915/pexels-photo-914915.jpeg?auto=compress&cs=tinysrgb&w=1200",
  6726749:
    "https://images.pexels.com/photos/6726749/pexels-photo-6726749.jpeg?auto=compress&cs=tinysrgb&w=1200",
  3921697:
    "https://images.pexels.com/photos/3921697/pexels-photo-3921697.jpeg?auto=compress&cs=tinysrgb&w=1200",
  5208777:
    "https://images.pexels.com/photos/5208777/pexels-photo-5208777.jpeg?auto=compress&cs=tinysrgb&w=1200",
  7667664:
    "https://images.pexels.com/photos/7667664/pexels-photo-7667664.jpeg?auto=compress&cs=tinysrgb&w=1200",
  7575999:
    "https://images.pexels.com/photos/7575999/pexels-photo-7575999.jpeg?auto=compress&cs=tinysrgb&w=1200",
  3762663:
    "https://images.pexels.com/photos/3762663/pexels-photo-3762663.jpeg?auto=compress&cs=tinysrgb&w=1200",
  3762757:
    "https://images.pexels.com/photos/3762757/pexels-photo-3762757.jpeg?auto=compress&cs=tinysrgb&w=1200",
  5731811:
    "https://images.pexels.com/photos/5731811/pexels-photo-5731811.jpeg?auto=compress&cs=tinysrgb&w=1200",
  27676711:
    "https://images.pexels.com/photos/27676711/pexels-photo-27676711.jpeg?auto=compress&cs=tinysrgb&w=1200",
  7814722:
    "https://images.pexels.com/photos/7814722/pexels-photo-7814722.jpeg?auto=compress&cs=tinysrgb&w=1200",
  1653085:
    "https://images.pexels.com/photos/1653085/pexels-photo-1653085.jpeg?auto=compress&cs=tinysrgb&w=1200",
  7356378:
    "https://images.pexels.com/photos/7356378/pexels-photo-7356378.jpeg?auto=compress&cs=tinysrgb&w=1200",
  6690236:
    "https://images.pexels.com/photos/6690236/pexels-photo-6690236.jpeg?auto=compress&cs=tinysrgb&w=1200",
  1373748:
    "https://images.pexels.com/photos/1373748/pexels-photo-1373748.jpeg?auto=compress&cs=tinysrgb&w=1200",
  19321231:
    "https://images.pexels.com/photos/19321231/pexels-photo-19321231.jpeg?auto=compress&cs=tinysrgb&w=1200",
};

// Pexels License: https://www.pexels.com/license/ (checked 2026-10-11).
// The fixed photo IDs below are illustrative stock photos, not endorsements.
// Every direct URL was checked for status, MIME, size and subject before use.
const examples: Example[] = [
  {
    name: "Fone Bluetooth com microfone",
    category: "eletronicos",
    ncm: "85183000",
    description:
      "Este fone fictício foi criado para testar o cadastro de eletrônicos. O exemplo simula conexão sem fio e microfone para chamadas. As variações permitem experimentar a escolha de cor no painel. As fotos são ilustrativas e não representam um produto disponível para venda.",
    variants: ["Preto", "Branco"],
    price: 12990,
    weight: 280,
    dimensions: [7, 18, 21],
    photos: [6587325, 10946066],
  },
  {
    name: "Carregador de parede compacto",
    category: "eletronicos",
    ncm: "85044010",
    description:
      "Este carregador fictício serve para testar um produto com uma única variação. O cadastro representa um acessório compacto de alimentação USB. Peso e medidas simulam a embalagem usada no cálculo de frete. As fotos são ilustrativas e não indicam marca ou desempenho garantido.",
    variants: ["Branco"],
    price: 7990,
    weight: 100,
    dimensions: [5, 8, 10],
    photos: [37421859, 16886332],
  },
  {
    name: "Caixa de som portátil",
    category: "eletronicos",
    ncm: "85182100",
    description:
      "Esta caixa de som fictícia foi preparada para demonstrar o cadastro de áudio. O exemplo simula um modelo portátil para ouvir música em casa. Duas cores ajudam a conferir estoque e preços por variação. As fotos são ilustrativas e não descrevem características técnicas de um equipamento real.",
    variants: ["Preto", "Cinza"],
    price: 15990,
    weight: 450,
    dimensions: [9, 12, 19],
    photos: [7772558, 14555249],
  },
  {
    name: "Relógio inteligente de uso diário",
    category: "eletronicos",
    ncm: "85176299",
    description:
      "Este relógio inteligente é um produto fictício para testar a loja. O exemplo representa uma tela digital com funções cotidianas de comunicação. As cores da pulseira são opções simuladas para o cadastro. As imagens são ilustrativas e não prometem recursos médicos ou medições de saúde.",
    variants: ["Preto", "Vermelho"],
    price: 19990,
    weight: 160,
    dimensions: [5, 10, 13],
    photos: [13007642, 11947525],
  },
  {
    name: "Cabo USB para dados e energia",
    category: "eletronicos",
    ncm: "85444200",
    description:
      "Este cabo fictício permite testar variações de comprimento. O cadastro simula um acessório para transferência de dados e alimentação de dispositivos compatíveis. As medidas correspondem a uma embalagem pequena de exemplo. As fotos são ilustrativas e a compatibilidade real deve ser conferida antes de cadastrar um produto à venda.",
    variants: ["1 metro", "2 metros"],
    price: 2990,
    weight: 80,
    dimensions: [2, 9, 12],
    photos: [914915, 6726749],
  },
  {
    name: "Bateria portátil para celular",
    category: "eletronicos",
    ncm: "85076000",
    description:
      "Esta bateria portátil fictícia foi criada para exercitar opções de capacidade. O exemplo simula um acessório recarregável para levar na bolsa. Preço, peso e estoque são dados de demonstração. As fotos são ilustrativas e não garantem autonomia ou capacidade de um produto real.",
    variants: ["10.000 mAh", "20.000 mAh"],
    price: 9990,
    weight: 280,
    dimensions: [3, 8, 15],
    photos: [3921697, 5208777],
  },
  {
    name: "Batom de acabamento cremoso",
    category: "cosmeticos",
    ncm: "33041000",
    description:
      "Este batom fictício demonstra um cosmético com três opções de cor. O exemplo representa uma embalagem individual para maquiagem dos lábios. Os tons cadastrados são apenas referências para testar o painel. As fotos são ilustrativas e não correspondem a uma fórmula ou marca comercial.",
    variants: ["Rosa", "Vermelho", "Nude"],
    price: 3990,
    weight: 50,
    dimensions: [3, 4, 9],
    photos: [7667664, 7575999],
  },
  {
    name: "Máscara de cílios com aplicador",
    category: "cosmeticos",
    ncm: "33042010",
    description:
      "Esta máscara de cílios fictícia foi preparada para testar produtos de maquiagem. O exemplo inclui um aplicador em uma embalagem pequena. As variações de cor permitem conferir a seleção de estoque. As imagens são ilustrativas e não prometem resultados de volume ou duração.",
    variants: ["Preto", "Marrom"],
    price: 3490,
    weight: 45,
    dimensions: [3, 4, 14],
    photos: [3762663, 3762757],
  },
  {
    name: "Base líquida de cobertura leve",
    category: "cosmeticos",
    ncm: "33049910",
    description:
      "Esta base líquida fictícia serve para testar opções de tonalidade. O cadastro simula um frasco de maquiagem facial de uso cotidiano. Os nomes dos tons são demonstrativos e não substituem uma cartela real de cores. As fotos são ilustrativas e não indicam composição ou benefício dermatológico.",
    variants: ["Claro", "Médio", "Escuro"],
    price: 6990,
    weight: 120,
    dimensions: [4, 5, 13],
    photos: [5731811, 27676711],
  },
  {
    name: "Perfume de fragrância suave",
    category: "cosmeticos",
    ncm: "33030010",
    description:
      "Este perfume fictício demonstra um cadastro com dois volumes. O exemplo representa um frasco de fragrância para uso pessoal. Tamanhos, preço e estoque foram definidos apenas para testar as telas. As imagens são ilustrativas e não identificam um perfume ou uma marca à venda.",
    variants: ["30 ml", "50 ml"],
    price: 11990,
    weight: 260,
    dimensions: [15, 7, 9],
    photos: [7814722, 1653085],
  },
  {
    name: "Creme hidratante de uso diário",
    category: "cosmeticos",
    ncm: "33049990",
    description:
      "Este creme hidratante fictício ajuda a testar embalagens de diferentes tamanhos. O cadastro simula um cosmético de uso diário em pote. As variações de volume são exemplos para conferir os campos do admin. As fotos são ilustrativas e não prometem tratamento ou resultado médico.",
    variants: ["100 g", "200 g"],
    price: 4990,
    weight: 230,
    dimensions: [7, 8, 8],
    photos: [7356378, 6690236],
  },
  {
    name: "Esmalte de acabamento brilhante",
    category: "cosmeticos",
    ncm: "33043000",
    description:
      "Este esmalte fictício foi criado para demonstrar variações de cor. O exemplo simula um frasco pequeno com pincel de aplicação. As cores e os valores cadastrados permitem testar listagem e edição. As imagens são ilustrativas e não representam a tonalidade exata de um produto comercial.",
    variants: ["Rosa", "Bege", "Vermelho"],
    price: 2490,
    weight: 60,
    dimensions: [8, 4, 4],
    photos: [1373748, 19321231],
  },
];

function photoUrl(id: number): string {
  const url = PHOTO_URLS[id];
  if (!url) throw new SeedError("Foto de exemplo não definida.");
  return url;
}
function slugFor(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + EXAMPLE_SUFFIX
  );
}
function skuFor(number: number): string {
  let result = "";
  for (let index = 0; index < 6; index++) {
    result = String.fromCharCode(65 + (number % 26)) + result;
    number = Math.trunc(number / 26);
  }
  return `EX-${result}`;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseEnv(text: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const original of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = original.trim().replace(/^export\s+/, "");
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (/^["']/.test(value) && value.endsWith(value[0]!))
      value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");
    values[key] = value;
  }
  return values;
}
function argumentsFor(args: string[]) {
  let envFile = ".env.local",
    confirm = false,
    remove = false,
    help = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    if (arg === "--confirmar") confirm = true;
    else if (arg === "--apagar") remove = true;
    else if (arg === "--help" || arg === "--ajuda") help = true;
    else if (arg.startsWith("--env=")) envFile = arg.slice(6);
    else if (
      arg === "--env" &&
      args[index + 1] &&
      !args[index + 1]!.startsWith("--")
    )
      envFile = args[++index]!;
    else
      throw new SeedError(
        "Argumento inválido. Use --env arquivo, --confirmar e/ou --apagar.",
      );
  }
  if (!envFile) throw new SeedError("Informe o arquivo depois de --env.");
  return { envFile, confirm, remove, help };
}
function ownedPath(value: string, base: URL): string | null {
  try {
    const url = new URL(value);
    const prefix = `/storage/v1/object/public/${BUCKET}/`;
    if (url.origin !== base.origin || !url.pathname.startsWith(prefix))
      return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    return /^\d{4}-\d{2}\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(
      path,
    )
      ? path
      : null;
  } catch {
    return null;
  }
}
async function removeFiles(client: SeedClient, paths: string[]): Promise<void> {
  if (!paths.length) return;
  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await client.storage
      .from(BUCKET)
      .remove(paths.slice(index, index + 100));
    if (error)
      throw new SeedError("Não foi possível remover fotos do bucket produtos.");
  }
}
async function uploadPhoto(
  client: SeedClient,
  id: number,
): Promise<{ url: string; path: string }> {
  const response = await fetch(photoUrl(id), {
    signal: AbortSignal.timeout(30000),
  });
  if (response.status !== 200) throw new SeedError("Foto indisponível.");
  const mime = response.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = mime ? extensions[mime] : undefined;
  if (!ext || !response.body)
    throw new SeedError("Formato de foto não permitido.");
  if (Number(response.headers.get("content-length")) >= MAX_PHOTO_BYTES)
    throw new SeedError("Foto grande demais.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length >= MAX_PHOTO_BYTES) {
        await reader.cancel();
        throw new SeedError("Foto grande demais.");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  if (length === 0) throw new SeedError("Foto vazia.");
  const bytes = Buffer.concat(chunks);
  const month = new Date().toISOString().slice(0, 7);
  const path = `${month}/${randomUUID()}.${ext}`;
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw new SeedError("Não foi possível guardar a foto.");
  return {
    path,
    url: client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
  };
}
async function deleteExamples(client: SeedClient, base: URL): Promise<number> {
  let deleted = 0;
  while (true) {
    const { data, error } = await client
      .from("products")
      .select("id, slug, product_images(url)")
      .like("slug", `%${EXAMPLE_SUFFIX}`)
      .order("id")
      .limit(100);
    if (error || !Array.isArray(data))
      throw new SeedError("Não foi possível listar os exemplos para apagar.");
    const rows: unknown[] = data;
    if (!rows.length) break;
    for (const item of rows) {
      if (
        !record(item) ||
        typeof item.id !== "string" ||
        typeof item.slug !== "string" ||
        !item.slug.endsWith(EXAMPLE_SUFFIX)
      )
        throw new SeedError("Lista de exclusão inválida.");
      const urls = Array.isArray(item.product_images)
        ? item.product_images
            .filter(record)
            .map((image) => image.url)
            .filter((url): url is string => typeof url === "string")
        : [];
      const result = await client.rpc("admin_delete_product", {
        p_id: item.id,
      });
      if (result.error)
        throw new SeedError(`Não foi possível apagar o exemplo ${item.slug}.`);
      // Do not delete files still referenced by a different product.
      if (urls.length) {
        const references = await client
          .from("product_images")
          .select("url")
          .in("url", urls);
        if (references.error || !Array.isArray(references.data))
          throw new SeedError(
            "Não foi possível conferir fotos compartilhadas.",
          );
        const used = new Set(
          (references.data as unknown[])
            .filter(record)
            .map((image) => image.url),
        );
        const paths = urls
          .filter((url) => !used.has(url))
          .map((url) => ownedPath(url, base))
          .filter((path): path is string => path !== null);
        await removeFiles(client, [...new Set(paths)]);
      }
      deleted++;
    }
  }
  return deleted;
}
async function main(): Promise<void> {
  const args = argumentsFor(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(
      "Uso: node scripts/seed-exemplos.ts [--env arquivo] [--confirmar] [--apagar]\nSem --confirmar: somente simulação. --apagar: somente exclusão de slugs terminados em -exemplo.\n",
    );
    return;
  }
  let source: string;
  try {
    source = await readFile(resolve(args.envFile), "utf8");
  } catch {
    throw new SeedError("Não foi possível ler o arquivo indicado por --env.");
  }
  const config = parseEnv(source);
  let base: URL;
  try {
    base = new URL(config.NEXT_PUBLIC_SUPABASE_URL ?? "");
  } catch {
    throw new SeedError(
      "NEXT_PUBLIC_SUPABASE_URL inválida no arquivo informado.",
    );
  }
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw new SeedError("URL do Supabase inválida.");
  const key = config.SUPABASE_SERVICE_ROLE_KEY;
  if (!key)
    throw new SeedError(
      "SUPABASE_SERVICE_ROLE_KEY ausente no arquivo informado.",
    );
  process.stdout.write(`Supabase: ${base.host}\n`);
  if (!args.confirm) {
    if (args.remove)
      process.stdout.write(
        "Simulação: apagaria produtos com slug terminado em -exemplo e suas fotos sem outras referências.\n",
      );
    else
      for (const example of examples)
        process.stdout.write(
          `Simulação: ${example.category} · Exemplo · ${example.name}, inativo, ${example.variants.length} variação(ões), 2 fotos.\n`,
        );
    process.stdout.write(
      "Sem --confirmar: nenhuma escrita ou download.\nResumo: criados 0, pulados 0, fotos que falharam 0.\n",
    );
    return;
  }
  const client = createClient<Database>(base.toString(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (args.remove) {
    process.stdout.write(
      `Resumo: apagados ${await deleteExamples(client, base)}, criados 0, pulados 0, fotos que falharam 0.\n`,
    );
    return;
  }
  const categories = await client
    .from("categories")
    .select("id, slug")
    .in("slug", ["eletronicos", "cosmeticos"]);
  if (categories.error || !Array.isArray(categories.data))
    throw new SeedError("Não foi possível carregar as categorias.");
  const categoryIds = new Map<string, string>();
  for (const category of categories.data as unknown[])
    if (
      record(category) &&
      typeof category.id === "string" &&
      typeof category.slug === "string"
    )
      categoryIds.set(category.slug, category.id);
  if (!categoryIds.has("eletronicos") || !categoryIds.has("cosmeticos"))
    throw new SeedError(
      "Crie as categorias eletronicos e cosmeticos antes de executar.",
    );
  const counts: Counts = { created: 0, skipped: 0, failedPhotos: 0 };
  try {
    for (const [index, example] of examples.entries()) {
      const name = `Exemplo · ${example.name}`;
      const slug = slugFor(name);
      const existing = await client
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (existing.error)
        throw new SeedError(
          "Não foi possível conferir exemplos já existentes.",
        );
      if (existing.data) {
        counts.skipped++;
        continue;
      }
      const uploaded: { url: string; path: string }[] = [];
      for (const photoId of example.photos) {
        try {
          uploaded.push(await uploadPhoto(client, photoId));
        } catch {
          counts.failedPhotos++;
          process.stderr.write(
            `Foto ${photoId} de ${name} falhou; seguindo sem essa foto.\n`,
          );
        }
      }
      const variantes = example.variants.map((variant, variantIndex) => {
        const price = example.price + variantIndex * 1000;
        return {
          sku: skuFor(index * 3 + variantIndex + 1),
          nome: variant,
          preco_cents: price,
          preco_de_cents:
            index % 3 === 0 ? Math.trunc((price * 120 + 99) / 100) : null,
          custo_cents: Math.trunc((price * 55 + 50) / 100),
          estoque: 5 + ((index * 7 + variantIndex * 3) % 26),
          peso_g: example.weight + variantIndex * 10,
          altura_cm: example.dimensions[0],
          largura_cm: example.dimensions[1],
          comprimento_cm: example.dimensions[2],
          ean: null,
        };
      });
      const result = await client.rpc("admin_save_product", {
        p_product: {
          nome: name,
          slug,
          descricao: example.description,
          category_id: categoryIds.get(example.category)!,
          brand_id: null,
          ncm: example.ncm,
          cfop: "5102",
          origem: 0,
          ativo: false,
          destaque: false,
          variantes,
          imagens: uploaded.map((photo, photoIndex) => ({
            url: photo.url,
            alt: `Foto ilustrativa ${photoIndex + 1}: ${example.name}. Produto fictício.`,
          })),
        },
      });
      if (result.error) {
        await removeFiles(
          client,
          uploaded.map((photo) => photo.path),
        );
        // Handle a concurrent run that inserted this same slug first.
        const concurrent = await client
          .from("products")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!concurrent.error && concurrent.data) {
          counts.skipped++;
          continue;
        }
        throw new SeedError(
          `Não foi possível salvar ${name}; fotos enviadas removidas.`,
        );
      }
      counts.created++;
    }
  } finally {
    process.stdout.write(
      `Resumo: criados ${counts.created}, pulados ${counts.skipped}, fotos que falharam ${counts.failedPhotos}.\n`,
    );
  }
}

main().catch((error: unknown) => {
  // Only our short messages are emitted; API payloads and credentials are never logged.
  process.stderr.write(
    `${error instanceof SeedError ? error.message : "Falha ao preparar os exemplos; confira configuração e conectividade."}\n`,
  );
  process.exitCode = 1;
});
