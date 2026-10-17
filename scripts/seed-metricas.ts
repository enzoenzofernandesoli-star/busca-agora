// Fictional product metrics for the LOCAL database only (development and
// panel screenshots). Refuses to run against anything but 127.0.0.1 /
// localhost. Creates 45 days of views, carts, checkouts and paid orders
// for the active products, then rebuilds product_metrics_daily.
//
//   node scripts/seed-metricas.ts
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/db/types.ts";

function localClient() {
  const output = execSync("npx supabase status -o json", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const status = JSON.parse(output.slice(output.indexOf("{"))) as {
    API_URL?: string;
    SERVICE_ROLE_KEY?: string;
  };
  const url = new URL(status.API_URL ?? "");
  if (
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    !status.SERVICE_ROLE_KEY
  ) {
    throw new Error("seed-metricas só roda no Supabase local");
  }
  return createClient<Database>(url.toString(), status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Deterministic pseudo-random numbers: the same seed gives the same data.
let state = 20261018;
function rand() {
  state = (state * 1103515245 + 12345) % 2147483648;
  return state / 2147483648;
}
const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)]!;

const ORIGENS = [
  { utm_source: null, utm_medium: null, utm_campaign: null, ref: null },
  { utm_source: null, utm_medium: null, utm_campaign: null, ref: null },
  {
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "lancamento",
    ref: null,
  },
  { utm_source: "tiktok", utm_medium: "social", utm_campaign: null, ref: null },
  { utm_source: "google", utm_medium: "cpc", utm_campaign: "fones", ref: null },
  {
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: null,
    ref: "joana",
  },
];

async function main() {
  const db = localClient();
  const { data: produtos, error } = await db
    .from("products")
    .select(
      "id, nome, product_variants!inner(id, sku, preco_cents, custo_cents)",
    )
    .eq("ativo", true)
    // The sample catalogue of seed-dev.ts (SKUs DEV-...).
    .like("product_variants.sku", "DEV-%")
    .limit(8);
  if (error) throw error;
  if (!produtos?.length) throw new Error("Rode antes: npm run db:seed-dev");

  // Two fictional customers who browse logged in.
  const clientes: string[] = [];
  for (const nome of ["Ana Exemplo", "Bruno Exemplo"]) {
    const { data } = await db.auth.admin.createUser({
      email: `seed-metricas-${randomUUID().slice(0, 6)}@example.test`,
      password: randomUUID(),
      email_confirm: true,
      user_metadata: { nome },
    });
    if (data.user) clientes.push(data.user.id);
  }

  const hoje = new Date();
  const eventos: Database["public"]["Tables"]["product_events"]["Insert"][] =
    [];
  let pedidos = 0;
  const compras: { orderId: string; quando: string }[] = [];
  // Enough stock for the fictional orders; the real values come back at the end.
  const estoqueOriginal = new Map<string, number>();
  for (const p of produtos) {
    const v = p.product_variants[0];
    if (!v) continue;
    const { data } = await db
      .from("product_variants")
      .select("estoque")
      .eq("id", v.id)
      .single();
    estoqueOriginal.set(v.id, data?.estoque ?? 0);
    await db
      .from("product_variants")
      .update({ estoque: 100000 })
      .eq("id", v.id);
  }
  for (let d = 44; d >= 0; d--) {
    const dia = new Date(hoje.getTime() - d * 86400000);
    const fimDeSemana = [0, 6].includes(dia.getDay());
    for (const [i, p] of produtos.entries()) {
      const variante = p.product_variants[0];
      if (!variante) continue;
      // Popularity per product, more traffic on weekends.
      const base = Math.round(
        (18 - i * 2) * (fimDeSemana ? 1.4 : 1) * (0.7 + rand() * 0.6),
      );
      for (let v = 0; v < base; v++) {
        const sessao =
          rand() < 0.15 && clientes.length
            ? `cliente-${pick(clientes)}`
            : randomUUID();
        const userId = sessao.startsWith("cliente-") ? sessao.slice(8) : null;
        const origem = pick(ORIGENS);
        const quando = new Date(
          dia.getTime() - Math.floor(rand() * 20) * 3600000,
        );
        const comum = {
          product_id: p.id,
          session_id: sessao.slice(0, 64),
          user_id: userId,
          device: rand() < 0.7 ? ("mobile" as const) : ("desktop" as const),
          ...origem,
        };
        eventos.push({
          ...comum,
          event: "view",
          created_at: quando.toISOString(),
        });
        if (rand() < 0.22) {
          eventos.push({
            ...comum,
            variant_id: variante.id,
            event: "add_to_cart",
            created_at: quando.toISOString(),
          });
          if (rand() < 0.6) {
            eventos.push({
              ...comum,
              variant_id: variante.id,
              event: "begin_checkout",
              created_at: quando.toISOString(),
            });
            if (rand() < 0.65) {
              const qtd = rand() < 0.85 ? 1 : 2;
              // A real order: create_order + approved payment. The
              // database writes the purchase event itself (trigger).
              const { data: order, error: oErr } = await db
                .rpc("create_order", {
                  p_user_id: userId as string,
                  p_endereco: {
                    cep: "01310100",
                    rua: "Rua Exemplo",
                    numero: "1",
                    bairro: "Centro",
                    cidade: "São Paulo",
                    uf: "SP",
                  },
                  p_cliente_nome: "Seed métricas",
                  p_cliente_cpf: "52998224725",
                  p_payment_method: "pix",
                  p_frete_cents: 0,
                  p_frete_servico: "Correios · PAC",
                  p_frete_servico_id: 1,
                  p_itens: [{ variant_id: variante.id, quantidade: qtd }],
                  p_validade: "30 minutes",
                  p_origem: { ...origem, visitor_id: comum.session_id },
                })
                .single<{ id: string; total_cents: number }>();
              if (oErr) throw oErr;
              const { error: pErr } = await db.rpc("record_payment", {
                p_order_id: order.id,
                p_mp_payment_id: `seed-${randomUUID()}`,
                p_status: "approved",
                p_metodo: "pix",
                p_valor_cents: order.total_cents,
                p_moeda: "BRL",
                p_parcelas: 1,
                p_raw: { seed: true },
              });
              if (pErr) throw pErr;
              compras.push({ orderId: order.id, quando: quando.toISOString() });
              pedidos++;
            }
          }
        }
      }
    }
  }

  for (let i = 0; i < eventos.length; i += 500) {
    const { error: e } = await db
      .from("product_events")
      .insert(eventos.slice(i, i + 500));
    if (e) throw e;
  }
  // Purchase events (and orders) dated like the visit that led to them.
  for (const c of compras) {
    await db
      .from("product_events")
      .update({ created_at: c.quando })
      .eq("order_id", c.orderId)
      .eq("event", "purchase");
  }
  for (const [id, estoque] of estoqueOriginal) {
    await db.from("product_variants").update({ estoque }).eq("id", id);
  }
  const de = new Date(hoje.getTime() - 46 * 86400000)
    .toISOString()
    .slice(0, 10);
  const ate = new Date(hoje.getTime() + 86400000).toISOString().slice(0, 10);
  const { error: r } = await db.rpc("refresh_product_metrics", {
    p_de: de,
    p_ate: ate,
  });
  if (r) throw r;
  process.stdout.write(
    `seed-metricas: ${eventos.length} eventos, ${pedidos} pedidos, ${produtos.length} produtos.\n`,
  );
}

main().catch((e: unknown) => {
  process.stderr.write(
    `${e instanceof Error ? e.message : JSON.stringify(e)}\n`,
  );
  process.exitCode = 1;
});
