import "server-only";

import { createAdminClient } from "@/lib/db/admin";
import type { Database } from "@/lib/db/types";
import { trackingToOrderStatus } from "@/lib/shipping/melhorenvio/label-schemas";
import {
  createLabelClient,
  type LabelClient,
} from "@/lib/shipping/melhorenvio/labels";

type OrderStatus = Database["public"]["Enums"]["order_status"];

// Steps from where the order is to where the carrier says it is. Each one
// is a set_order_status (one order_event, one e-mail per stage).
const PATH: Record<string, OrderStatus[]> = {
  "label_ready>shipped": ["shipped"],
  "printed>shipped": ["shipped"],
  "label_ready>delivered": ["shipped", "delivered"],
  "printed>delivered": ["shipped", "delivered"],
  "shipped>delivered": ["delivered"],
};

/** Polls Melhor Envio for orders on their way (every 2 h, pg_cron). */
export async function pollTracking(client: LabelClient = createLabelClient()) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shipments")
    .select("order_id, me_order_id, orders!inner(status)")
    .not("me_order_id", "is", null)
    .in("orders.status", ["label_ready", "printed", "shipped"]);
  if (error) throw new Error(`rastreio: ${error.message}`);
  const rows = (data ?? []).filter((r) => r.me_order_id);
  if (rows.length === 0) return { consultados: 0, mudaram: 0 };

  let mudaram = 0;
  // Melhor Envio takes several ids per call; small batches keep it safe.
  for (let i = 0; i < rows.length; i += 50) {
    const lote = rows.slice(i, i + 50);
    const info = await client.track(lote.map((r) => r.me_order_id!));
    for (const r of lote) {
      const t = info[r.me_order_id!];
      if (!t) continue;
      await admin
        .from("shipments")
        .update({
          me_status: t.status,
          rastreio: t.rastreio,
          rastreio_consultado_em: new Date().toISOString(),
        })
        .eq("order_id", r.order_id);
      const para = trackingToOrderStatus(t);
      const de = (r.orders as unknown as { status: OrderStatus }).status;
      if (!para || para === "canceled") continue;
      for (const status of PATH[`${de}>${para}`] ?? []) {
        const { error: e } = await admin.rpc("set_order_status", {
          p_order_id: r.order_id,
          p_status: status,
          p_detalhe: { origem: "rastreio" },
        });
        if (e) break;
        mudaram++;
      }
    }
  }
  return { consultados: rows.length, mudaram };
}
