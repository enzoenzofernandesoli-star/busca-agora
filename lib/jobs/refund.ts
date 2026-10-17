import "server-only";

import { createAdminClient } from "@/lib/db/admin";
import { reconcileSettlingPayment } from "@/lib/payments/reconcile";

import type { JobHandler } from "./worker";

/**
 * 'refund' job (etapa = the refund's token): asks Mercado Pago whether the
 * refund went through. Confirmed -> order refunded (record_payment). Not yet
 * -> throws, so the queue retries with backoff and alerts on Telegram when
 * the attempts run out. It never reopens shipping by itself: the order stays
 * blocked (orders.estorno_status) until the provider or a human resolves it.
 */
export function refundHandler(
  reconcile = reconcileSettlingPayment,
): JobHandler {
  return async (job) => {
    const { data: order, error } = await createAdminClient()
      .from("orders")
      .select("status, estorno_status, estorno_token")
      .eq("id", job.order_id)
      .single();
    if (error) throw new Error(`orders: ${error.message}`);
    if (
      order.status === "refunded" ||
      order.estorno_status === null ||
      order.estorno_token !== job.etapa
    ) {
      return "Estorno já resolvido";
    }
    const r = await reconcile(job.order_id);
    if (r?.resultado === "refunded") return;
    throw new Error(
      `Estorno ainda não confirmado pelo Mercado Pago (status ${r?.statusProvedor ?? "desconhecido"})`,
    );
  };
}
