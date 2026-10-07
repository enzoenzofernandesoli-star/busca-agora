import "server-only";

import { createAdminClient } from "@/lib/db/admin";
import { env } from "@/lib/env";

import { parseOrderAddress } from "./address";

export function siteUrl(): string {
  return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

export function adminOrderUrl(numero: string): string {
  return `${siteUrl()}/admin/pedidos/${numero}`;
}

/** Public tracking page of the carrier aggregator (works for any carrier). */
export function trackingUrl(rastreio: string | null): string | null {
  return rastreio
    ? `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(rastreio)}`
    : null;
}

/** Everything the e-mails and Telegram notices need about one order. */
export async function loadOrderNotice(orderId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      `numero, status, cliente_nome, cliente_email, payment_method,
       subtotal_cents, frete_cents, desconto_cents, total_cents, frete_servico,
       endereco,
       order_items(nome, preco_cents, quantidade),
       shipments(transportadora, servico, rastreio),
       invoices(status, danfe_url)`,
    )
    .eq("id", orderId)
    .single();
  if (error || !data) {
    throw new Error(`pedido ${orderId}: ${error?.message ?? "não encontrado"}`);
  }
  // One-to-one relations come back as an object or a one-item array.
  const one = <T>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  return {
    numero: data.numero,
    status: data.status,
    clienteNome: data.cliente_nome,
    clienteEmail: data.cliente_email,
    metodo: data.payment_method,
    subtotalCents: data.subtotal_cents,
    freteCents: data.frete_cents,
    descontoCents: data.desconto_cents,
    totalCents: data.total_cents,
    freteServico: data.frete_servico,
    endereco: parseOrderAddress(data.endereco),
    itens: data.order_items.map((i) => ({
      nome: i.nome,
      variacao: null,
      quantidade: i.quantidade,
      precoCents: i.preco_cents,
    })),
    shipment: one(data.shipments),
    invoice: one(data.invoices),
  };
}

export type OrderNotice = Awaited<ReturnType<typeof loadOrderNotice>>;
