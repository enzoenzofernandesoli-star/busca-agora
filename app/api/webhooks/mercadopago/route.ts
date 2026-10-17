import { z } from "zod";

import { createAdminClient } from "@/lib/db/admin";
import type { Json } from "@/lib/db/types";
import { getPaymentProvider } from "@/lib/payments";
import { verifyWebhookSignature } from "@/lib/payments/signature";

// Mercado Pago notifications (CLAUDE.md rules 3 and 4):
// 1. the signature must match (x-signature over data.id + x-request-id + ts);
// 2. every notification is logged once in webhook_logs (unique per origin +
//    id): a delivery already processed answers 200 and does nothing;
// 3. the payment is fetched from Mercado Pago's API (the body is never
//    trusted) and record_payment() decides, in one transaction, whether the
//    order is paid (exact total, BRL, right order).
// Errors answer 500 so Mercado Pago retries; they reach Sentry.

const bodySchema = z
  .object({
    type: z.string().optional(),
    topic: z.string().optional(),
    action: z.string().optional(),
    data: z.object({ id: z.union([z.string(), z.number()]) }).optional(),
  })
  .passthrough();

const uuid = z.uuid();

export async function POST(request: Request) {
  const url = new URL(request.url);
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return new Response("invalid body", { status: 400 });
  }

  const dataId =
    url.searchParams.get("data.id") ??
    (body.data ? String(body.data.id) : null);
  const tipo = url.searchParams.get("type") ?? body.type ?? body.topic ?? null;
  const requestId = request.headers.get("x-request-id");

  const provider = getPaymentProvider();
  const valid = verifyWebhookSignature({
    header: request.headers.get("x-signature"),
    requestId,
    dataId,
    secret: provider.webhookSecret(),
  });
  if (!valid) return new Response("invalid signature", { status: 401 });

  // Only payment notifications move orders; the rest is acknowledged.
  if (tipo !== "payment" || !dataId)
    return new Response("ignored", { status: 200 });

  const admin = createAdminClient();
  const externalId = `${dataId}:${requestId ?? "sem-request-id"}`;
  const { data: logged, error: logError } = await admin
    .from("webhook_logs")
    .upsert(
      {
        origem: "mercadopago",
        external_id: externalId,
        payload: body as { [key: string]: Json | undefined },
      },
      { onConflict: "origem,external_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (logError) throw new Error(`webhook_logs: ${logError.message}`);
  if (!logged) {
    // Same delivery seen before: done if it was processed, otherwise retry.
    const { data: previous } = await admin
      .from("webhook_logs")
      .select("processed_at")
      .eq("origem", "mercadopago")
      .eq("external_id", externalId)
      .single();
    if (previous?.processed_at) return new Response("ok", { status: 200 });
  }

  const payment = await provider.getPayment(dataId);
  const orderId = payment.externalReference;
  if (!orderId || !uuid.safeParse(orderId).success) {
    await markProcessed(externalId);
    return new Response("not ours", { status: 200 });
  }
  const { data: order } = await admin
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) {
    await markProcessed(externalId);
    return new Response("unknown order", { status: 200 });
  }

  const { error } = await admin.rpc("record_payment", {
    p_order_id: orderId,
    p_mp_payment_id: payment.id,
    p_status: payment.status,
    p_metodo: payment.metodo,
    p_valor_cents: payment.valorCents,
    p_moeda: payment.moeda,
    p_parcelas: payment.parcelas,
    p_raw: payment.raw as Json,
  });
  if (error) throw new Error(`record_payment: ${error.message}`);

  await markProcessed(externalId);
  return new Response("ok", { status: 200 });
}

async function markProcessed(externalId: string) {
  const { error } = await createAdminClient()
    .from("webhook_logs")
    .update({ processed_at: new Date().toISOString() })
    .eq("origem", "mercadopago")
    .eq("external_id", externalId);
  if (error) throw new Error(`webhook_logs: ${error.message}`);
}
