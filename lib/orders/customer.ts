import "server-only";

import { createAdminClient } from "@/lib/db/admin";
import type { Database } from "@/lib/db/types";
import { createClient } from "@/lib/db/server";

import { parseOrderAddress } from "./address";

type OrderStatus = Database["public"]["Enums"]["order_status"];

// Events a customer may see, and how they read. Anything else (reprints,
// failed jobs, admin notes) stays in the admin.
const CUSTOMER_STATUS_TEXT: Partial<Record<OrderStatus, string>> = {
  pending_payment: "Pedido feito",
  paid: "Pagamento aprovado",
  invoiced: "Nota fiscal emitida",
  shipped: "Pedido enviado",
  delivered: "Pedido entregue",
  canceled: "Pedido cancelado",
  refunded: "Pagamento estornado",
};

export type CustomerEvent = { id: string; texto: string; quando: string };

function customerEvents(
  eventos: {
    id: string;
    evento: string;
    detalhe: unknown;
    created_at: string;
  }[],
  criadoEm: string,
): CustomerEvent[] {
  const out: CustomerEvent[] = [
    { id: "criado", texto: "Pedido feito", quando: criadoEm },
  ];
  for (const e of eventos) {
    const d = (e.detalhe ?? {}) as Record<string, unknown>;
    if (e.evento === "status_changed") {
      const texto = CUSTOMER_STATUS_TEXT[d.para as OrderStatus];
      if (texto && d.para !== "pending_payment") {
        out.push({ id: e.id, texto, quando: e.created_at });
      }
    } else if (e.evento === "devolucao_solicitada") {
      out.push({
        id: e.id,
        texto: d.tipo === "troca" ? "Você pediu troca" : "Você pediu devolução",
        quando: e.created_at,
      });
    }
  }
  return out.sort((a, b) => Date.parse(a.quando) - Date.parse(b.quando));
}

function deliveredAt(
  eventos: { evento: string; detalhe: unknown; created_at: string }[],
): Date | null {
  const e = [...eventos]
    .reverse()
    .find(
      (x) =>
        x.evento === "status_changed" &&
        (x.detalhe as Record<string, unknown> | null)?.para === "delivered",
    );
  return e ? new Date(e.created_at) : null;
}

const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

const ORDER_SELECT = `id, numero, status, created_at, payment_method,
  subtotal_cents, frete_cents, desconto_cents, total_cents, frete_servico,
  endereco,
  order_items(id, nome, sku, preco_cents, quantidade),
  shipments(transportadora, servico, rastreio),
  invoices(status, danfe_url),
  order_events(id, evento, detalhe, created_at)`;

type Row = {
  id: string;
  numero: string;
  status: OrderStatus;
  created_at: string;
  payment_method: Database["public"]["Enums"]["payment_method"];
  subtotal_cents: number;
  frete_cents: number;
  desconto_cents: number;
  total_cents: number;
  frete_servico: string | null;
  endereco: unknown;
  order_items: {
    id: string;
    nome: string;
    sku: string;
    preco_cents: number;
    quantidade: number;
  }[];
  shipments:
    | {
        transportadora: string | null;
        servico: string | null;
        rastreio: string | null;
      }
    | {
        transportadora: string | null;
        servico: string | null;
        rastreio: string | null;
      }[]
    | null;
  invoices:
    | { status: string; danfe_url: string | null }
    | { status: string; danfe_url: string | null }[]
    | null;
  order_events: {
    id: string;
    evento: string;
    detalhe: unknown;
    created_at: string;
  }[];
};

function shape(o: Row) {
  return {
    id: o.id,
    numero: o.numero,
    status: o.status,
    criadoEm: o.created_at,
    metodo: o.payment_method,
    subtotalCents: o.subtotal_cents,
    freteCents: o.frete_cents,
    descontoCents: o.desconto_cents,
    totalCents: o.total_cents,
    freteServico: o.frete_servico,
    endereco: parseOrderAddress(o.endereco),
    itens: o.order_items,
    shipment: one(o.shipments),
    invoice: one(o.invoices),
    eventos: customerEvents(o.order_events, o.created_at),
    entregueEm: deliveredAt(o.order_events),
    trocaPedida: o.order_events.some(
      (e) => e.evento === "devolucao_solicitada",
    ),
  };
}

export type CustomerOrder = ReturnType<typeof shape>;

/** The signed-in customer's order; RLS also blocks anyone else's. */
export async function getMyOrder(
  userId: string,
  numero: string,
): Promise<CustomerOrder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("numero", numero)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`pedido: ${error.message}`);
  return data ? shape(data as unknown as Row) : null;
}

/**
 * Public tracking (/rastreio): only what the page shows, for an order whose
 * number was proven together with its e-mail (signed token).
 */
export async function getTrackedOrder(numero: string) {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("numero", numero)
    .maybeSingle();
  if (error) throw new Error(`rastreio: ${error.message}`);
  if (!data) return null;
  const o = shape(data as unknown as Row);
  return {
    numero: o.numero,
    status: o.status,
    eventos: o.eventos,
    shipment: o.shipment,
  };
}

/** Number and e-mail must match the same order. */
export async function orderMatchesEmail(
  numero: string,
  email: string,
): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("orders")
    .select("id")
    .eq("numero", numero)
    .eq("cliente_email", email)
    .maybeSingle();
  return Boolean(data);
}
