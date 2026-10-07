import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

// Local Supabase only (same guard as tests/db and scripts/seed-dev.ts).
export function localAdmin() {
  const output = execSync("npx supabase status -o json", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const status = JSON.parse(output.slice(output.indexOf("{"))) as {
    API_URL: string;
    SERVICE_ROLE_KEY: string;
  };
  const host = new URL(status.API_URL).hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(`e2e só roda no Supabase local, não em ${host}`);
  }
  return createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A confirmed customer who already accepted the terms. */
export async function createTestCustomer(nome = "Cliente E2E") {
  const admin = localAdmin();
  const email = `e2e-${randomUUID().slice(0, 8)}@example.test`;
  const senha = `Senha${randomUUID().slice(0, 6)}1`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error || !data.user) throw error ?? new Error("createUser");
  await admin
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", data.user.id);
  return { id: data.user.id, email, senha };
}

/**
 * An order of `userId` walked through set_order_status up to `ate`
 * (fake address, fake CPF; out-of-store product so the shop is untouched).
 */
export async function createTestOrder(opts: {
  userId: string | null;
  email: string;
  ate: "pending_payment" | "paid" | "shipped" | "delivered";
}) {
  const db = localAdmin();
  const { data: cat } = await db
    .from("categories")
    .select("id")
    .eq("slug", "eletronicos")
    .single();
  const { data: prod, error: pErr } = await db
    .from("products")
    .insert({
      nome: "Fone de pedido E2E",
      slug: `pedido-e2e-${randomUUID().slice(0, 8)}`,
      category_id: cat!.id,
      ncm: "85183000",
      ativo: false,
    })
    .select("id")
    .single();
  if (pErr) throw pErr;
  const { data: variant, error: vErr } = await db
    .from("product_variants")
    .insert({
      product_id: prod!.id,
      sku: `PED-${randomUUID().slice(0, 6)}`.toUpperCase(),
      nome: "Preto",
      preco_cents: 8990,
      estoque: 5,
      peso_g: 200,
      altura_cm: 5,
      largura_cm: 10,
      comprimento_cm: 15,
    })
    .select("id")
    .single();
  if (vErr) throw vErr;

  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: opts.userId,
      cliente_email: opts.email.toLowerCase(),
      subtotal_cents: 8990,
      frete_cents: 1500,
      total_cents: 10490,
      frete_servico: "PAC",
      endereco: {
        cep: "01001000",
        rua: "Rua de Teste",
        numero: "100",
        complemento: null,
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
      },
      cliente_nome: "Cliente E2E",
      cliente_cpf: "00000000191",
      payment_method: "pix",
    })
    .select("id, numero")
    .single();
  if (error) throw error;
  await db.from("order_items").insert({
    order_id: order.id,
    variant_id: variant!.id,
    nome: "Fone de pedido E2E",
    sku: "PED-E2E",
    ncm: "85183000",
    preco_cents: 8990,
    quantidade: 1,
  });

  const passos = {
    pending_payment: [],
    paid: ["paid"],
    shipped: ["paid", "label_ready", "printed", "shipped"],
    delivered: ["paid", "label_ready", "printed", "shipped", "delivered"],
  } as const;
  if (opts.ate !== "pending_payment") {
    const r = await db.rpc("reserve_stock", { p_order_id: order.id });
    if (r.error) throw r.error;
  }
  for (const status of passos[opts.ate]) {
    if (status === "shipped") {
      await db.from("shipments").insert({
        order_id: order.id,
        transportadora: "Correios",
        servico: "PAC",
        rastreio: "AA123456789BR",
        status: "posted",
      });
    }
    const r = await db.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: status,
    });
    if (r.error) throw r.error;
  }
  return order as { id: string; numero: string };
}
