import "server-only";

import { createAdminClient } from "@/lib/db/admin";
import type { Json } from "@/lib/db/types";

import { getPaymentProvider } from "./index";

/**
 * Reads the payment that settled the order from the provider and records
 * it (record_payment decides). Used by the admin refund and by the 'refund'
 * job; the webhook does the same for every notification.
 */
export async function reconcileSettlingPayment(orderId: string): Promise<{
  resultado: string;
  statusProvedor: string;
} | null> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("paid_payment_id")
    .eq("id", orderId)
    .single();
  if (error) throw new Error(`orders: ${error.message}`);
  if (!order.paid_payment_id) return null;
  const info = await getPaymentProvider().getPayment(order.paid_payment_id);
  const { data, error: rpcError } = await admin.rpc("record_payment", {
    p_order_id: orderId,
    p_mp_payment_id: info.id,
    p_status: info.status,
    p_metodo: info.metodo,
    p_valor_cents: info.valorCents,
    p_moeda: info.moeda,
    p_parcelas: info.parcelas,
    p_raw: info.raw as Json,
  });
  if (rpcError) throw new Error(`record_payment: ${rpcError.message}`);
  return { resultado: data, statusProvedor: info.status };
}
