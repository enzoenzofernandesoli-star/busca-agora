import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { anonClient, createCustomer, serviceClient } from "./helpers";

async function categoryId() {
  const { data } = await serviceClient()
    .from("categories")
    .select("id")
    .eq("slug", "eletronicos")
    .single();
  return data!.id as string;
}

function variant(sku: string, extra: Record<string, unknown> = {}) {
  return {
    sku,
    nome: "Preto",
    preco_cents: 8990,
    preco_de_cents: null,
    custo_cents: 4000,
    estoque: 5,
    peso_g: 300,
    altura_cm: 5,
    largura_cm: 10,
    comprimento_cm: 15,
    ean: null,
    ...extra,
  };
}

describe("admin_save_product", () => {
  it("creates, edits and removes variants and photos in one call", async () => {
    const admin = serviceClient();
    const slug = `admin-${randomUUID().slice(0, 8)}`;
    const skuA = `A-${randomUUID().slice(0, 6)}`.toUpperCase();
    const skuB = `B-${randomUUID().slice(0, 6)}`.toUpperCase();
    const base = {
      nome: "Produto do admin",
      slug,
      descricao: "",
      category_id: await categoryId(),
      brand_id: null,
      ncm: "85183000",
      cfop: "5102",
      origem: 0,
      // Out of the store: these test photos are not real Storage URLs.
      ativo: false,
      destaque: false,
    };

    const created = await admin.rpc("admin_save_product", {
      p_product: {
        ...base,
        variantes: [variant(skuA), variant(skuB, { nome: "Branco" })],
        imagens: [
          { url: "https://example.test/1.jpg", alt: "" },
          { url: "https://example.test/2.jpg", alt: "" },
        ],
      },
    });
    expect(created.error).toBeNull();
    const id = (created.data as { id: string }).id;

    const { data: before } = await admin
      .from("products")
      .select("product_variants(id, sku), product_images(id, url, ordem)")
      .eq("id", id)
      .single();
    const keep = before!.product_variants.find((v) => v.sku === skuA)!;
    const secondImage = before!.product_images.find((i) => i.ordem === 1)!;

    // Keep variant A (new price), drop B; keep only photo 2, now first.
    const edited = await admin.rpc("admin_save_product", {
      p_product: {
        ...base,
        id,
        variantes: [variant(skuA, { id: keep.id, preco_cents: 7990 })],
        imagens: [{ id: secondImage.id, url: secondImage.url, alt: "" }],
      },
    });
    expect(edited.error).toBeNull();
    expect((edited.data as { removed_urls: string[] }).removed_urls).toEqual([
      "https://example.test/1.jpg",
    ]);

    const { data: after } = await admin
      .from("products")
      .select("product_variants(sku, preco_cents), product_images(url, ordem)")
      .eq("id", id)
      .single();
    expect(after!.product_variants).toEqual([{ sku: skuA, preco_cents: 7990 }]);
    expect(after!.product_images).toEqual([
      { url: "https://example.test/2.jpg", ordem: 0 },
    ]);

    await admin.from("products").delete().eq("id", id);
  });

  it("is all or nothing: a bad variant leaves no half-saved product", async () => {
    const admin = serviceClient();
    const slug = `admin-falha-${randomUUID().slice(0, 8)}`;
    const { error } = await admin.rpc("admin_save_product", {
      p_product: {
        nome: "Vai falhar",
        slug,
        category_id: await categoryId(),
        ncm: "85183000",
        variantes: [
          variant(`OK-${randomUUID().slice(0, 6)}`),
          variant("X", { peso_g: 0 }),
        ],
      },
    });
    expect(error).not.toBeNull();
    const { data } = await admin.from("products").select("id").eq("slug", slug);
    expect(data).toEqual([]);
  });

  it("customers and visitors cannot call the admin functions", async () => {
    const c = await createCustomer("admin-rpc");
    for (const client of [c.client, anonClient()]) {
      const save = await client.rpc("admin_save_product", { p_product: {} });
      expect(save.error).not.toBeNull();
      const dash = await client.rpc("admin_dashboard");
      expect(dash.error).not.toBeNull();
    }
  });
});

describe("banners and photos bucket", () => {
  it("visitors see only active banners and cannot write", async () => {
    const admin = serviceClient();
    const ativo = `ativo-${randomUUID().slice(0, 6)}`;
    const inativo = `inativo-${randomUUID().slice(0, 6)}`;
    await admin.from("banners").insert([
      {
        titulo: ativo,
        imagem_url: "https://example.test/a.jpg",
        imagem_path: "a.jpg",
        ativo: true,
      },
      {
        titulo: inativo,
        imagem_url: "https://example.test/b.jpg",
        imagem_path: "b.jpg",
        ativo: false,
      },
    ]);
    const { data } = await anonClient()
      .from("banners")
      .select("titulo")
      .in("titulo", [ativo, inativo]);
    expect(data).toEqual([{ titulo: ativo }]);

    // Test rows never stay behind: an active banner would show on the home.
    await admin.from("banners").delete().in("titulo", [ativo, inativo]);

    const write = await anonClient()
      .from("banners")
      .insert({ imagem_url: "https://x.test/x.jpg", imagem_path: "x" });
    expect(write.error?.code).toBe("42501");
  });

  it("visitors and customers cannot upload photos directly", async () => {
    const c = await createCustomer("upload");
    const file = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    for (const client of [anonClient(), c.client]) {
      const { error } = await client.storage
        .from("produtos")
        .upload(`teste/${randomUUID()}.png`, file);
      expect(error).not.toBeNull();
    }
  });
});
