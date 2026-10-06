import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { inject } from "vitest";

const noSession = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

/** Unique suffix so repeated runs never collide on unique columns. */
export const runId = randomUUID().slice(0, 8);

export function serviceClient(): SupabaseClient {
  const { url, serviceRoleKey } = inject("supabaseLocal");
  return createClient(url, serviceRoleKey, noSession);
}

export function anonClient(): SupabaseClient {
  const { url, anonKey } = inject("supabaseLocal");
  return createClient(url, anonKey, noSession);
}

export type TestUser = { id: string; client: SupabaseClient };

/** Creates a confirmed customer and returns a client logged in as them. */
export async function createCustomer(label: string): Promise<TestUser> {
  const admin = serviceClient();
  const email = `${label}-${runId}@example.test`;
  const password = randomUUID();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome: `Cliente ${label}` },
  });
  if (error || !data.user) throw error ?? new Error("createUser falhou");

  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  return { id: data.user.id, client };
}

/** Active product with one variant. Returns the variant id. */
export async function createVariant(opts: {
  estoque: number;
  ativo?: boolean;
  custoCents?: number;
}): Promise<{ productId: string; variantId: string }> {
  const admin = serviceClient();

  const { data: category, error: categoryError } = await admin
    .from("categories")
    .select("id")
    .eq("slug", "eletronicos")
    .single();
  if (categoryError) throw categoryError;

  const slug = `produto-${randomUUID().slice(0, 8)}`;
  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      nome: "Produto de teste",
      slug,
      category_id: category.id,
      ncm: "85171231",
      ativo: opts.ativo ?? true,
    })
    .select("id")
    .single();
  if (productError) throw productError;

  const { data: variant, error: variantError } = await admin
    .from("product_variants")
    .insert({
      product_id: product.id,
      sku: `SKU-${randomUUID().slice(0, 8)}`,
      preco_cents: 8990,
      custo_cents: opts.custoCents ?? 4000,
      estoque: opts.estoque,
      peso_g: 300,
      altura_cm: 5,
      largura_cm: 10,
      comprimento_cm: 15,
    })
    .select("id")
    .single();
  if (variantError) throw variantError;

  return { productId: product.id, variantId: variant.id };
}

/** pending_payment order with one item, created as the server would. */
export async function createOrder(opts: {
  userId: string | null;
  variantId: string;
  quantidade?: number;
}): Promise<{ id: string; numero: string }> {
  const admin = serviceClient();
  const quantidade = opts.quantidade ?? 1;
  const subtotal = 8990 * quantidade;

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      user_id: opts.userId,
      subtotal_cents: subtotal,
      frete_cents: 1500,
      total_cents: subtotal + 1500,
      endereco: { cep: "01001000", cidade: "São Paulo", uf: "SP" },
      cliente_nome: "Cliente de teste",
      cliente_cpf: "00000000191",
      payment_method: "pix",
    })
    .select("id, numero")
    .single();
  if (error) throw error;

  const { error: itemError } = await admin.from("order_items").insert({
    order_id: order.id,
    variant_id: opts.variantId,
    nome: "Produto de teste",
    sku: "SKU",
    ncm: "85171231",
    preco_cents: 8990,
    quantidade,
  });
  if (itemError) throw itemError;

  return order;
}

export async function stockOf(variantId: string): Promise<number> {
  const { data, error } = await serviceClient()
    .from("product_variants")
    .select("estoque")
    .eq("id", variantId)
    .single();
  if (error) throw error;
  return data.estoque as number;
}
