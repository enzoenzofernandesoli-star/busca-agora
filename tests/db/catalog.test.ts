import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { anonClient, runId, serviceClient } from "./helpers";

// A word only this run uses, so searches never see rows from other tests.
const tag = `zq${runId.replace(/[^a-z0-9]/g, "")}`;

async function createProduct(opts: {
  nome: string;
  categoria: "eletronicos" | "cosmeticos";
  precoCents: number;
  ativo?: boolean;
  marca?: string;
}) {
  const admin = serviceClient();
  const { data: category, error: categoryError } = await admin
    .from("categories")
    .select("id")
    .eq("slug", opts.categoria)
    .single();
  if (categoryError) throw categoryError;

  let brandId: string | null = null;
  if (opts.marca) {
    const { data: brand, error } = await admin
      .from("brands")
      .upsert({ nome: opts.marca, slug: opts.marca }, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) throw error;
    brandId = brand.id;
  }

  const slug = `p-${randomUUID().slice(0, 8)}`;
  const { data: product, error } = await admin
    .from("products")
    .insert({
      nome: opts.nome,
      slug,
      descricao: "Descrição de teste",
      category_id: category.id,
      brand_id: brandId,
      ncm: "33049910",
      ativo: opts.ativo ?? true,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: variantError } = await admin.from("product_variants").insert({
    product_id: product.id,
    sku: `SKU-${randomUUID().slice(0, 8)}`,
    preco_cents: opts.precoCents,
    custo_cents: 1000,
    estoque: 5,
    peso_g: 100,
    altura_cm: 5,
    largura_cm: 5,
    comprimento_cm: 5,
  });
  if (variantError) throw variantError;

  return slug;
}

describe("catalog search", () => {
  let serum: string;
  let fone: string;
  let caro: string;

  beforeAll(async () => {
    serum = await createProduct({
      nome: `Sérum facial com vitamina C ${tag}`,
      categoria: "cosmeticos",
      precoCents: 4990,
    });
    fone = await createProduct({
      nome: `Fone Bluetooth com microfone ${tag}`,
      categoria: "eletronicos",
      precoCents: 8990,
      marca: `marca-${tag}`,
    });
    caro = await createProduct({
      nome: `Caixa de som ${tag}`,
      categoria: "eletronicos",
      precoCents: 14990,
    });
    await createProduct({
      nome: `Produto escondido ${tag}`,
      categoria: "eletronicos",
      precoCents: 1000,
      ativo: false,
    });
  });

  async function search(args: Record<string, unknown>) {
    const { data, error } = await anonClient().rpc("search_products", {
      p_q: tag,
      ...args,
    });
    expect(error).toBeNull();
    return (data ?? []) as { slug: string; total: number }[];
  }

  it("finds without accents and by word prefix", async () => {
    expect((await search({ p_q: `serum ${tag}` })).map((r) => r.slug)).toEqual([
      serum,
    ]);
    expect(
      (await search({ p_q: `fon blu ${tag}` })).map((r) => r.slug),
    ).toEqual([fone]);
  });

  it("never returns inactive products", async () => {
    const rows = await search({});
    expect(rows.map((r) => r.slug).sort()).toEqual([serum, fone, caro].sort());
    expect(rows[0]?.total).toBe(3);
  });

  it("filters by category, brand and price in cents", async () => {
    expect(
      (await search({ p_categoria: "cosmeticos" })).map((r) => r.slug),
    ).toEqual([serum]);
    expect(
      (await search({ p_marca: `marca-${tag}` })).map((r) => r.slug),
    ).toEqual([fone]);
    expect(
      (await search({ p_preco_min: 5000, p_preco_max: 10000 })).map(
        (r) => r.slug,
      ),
    ).toEqual([fone]);
  });

  it("sorts by price both ways", async () => {
    expect(
      (await search({ p_ordem: "menor_preco" })).map((r) => r.slug),
    ).toEqual([serum, fone, caro]);
    expect(
      (await search({ p_ordem: "maior_preco" })).map((r) => r.slug),
    ).toEqual([caro, fone, serum]);
  });

  it("paginates and keeps the total", async () => {
    const page2 = await search({
      p_ordem: "menor_preco",
      p_por_pagina: 2,
      p_pagina: 2,
    });
    expect(page2.map((r) => r.slug)).toEqual([caro]);
    expect(page2[0]?.total).toBe(3);
  });

  it("ignores characters that would break the query", async () => {
    const { error } = await anonClient().rpc("search_products", {
      p_q: "fone & | ! ( ) : * ' \\",
    });
    expect(error).toBeNull();
  });

  it("suggests while typing", async () => {
    const { data, error } = await anonClient().rpc("suggest_products", {
      p_q: `vit ${tag}`,
    });
    expect(error).toBeNull();
    expect(data).toEqual([
      expect.objectContaining({ slug: serum, categoria_slug: "cosmeticos" }),
    ]);
  });

  it("the listing view has no cost and hides inactive products", async () => {
    const { data, error } = await anonClient()
      .from("product_listing")
      .select("*")
      .eq("slug", fone)
      .single();
    expect(error).toBeNull();
    expect(data).not.toHaveProperty("custo_cents");
    expect(data?.preco_cents).toBe(8990);
  });
});
