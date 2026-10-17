"use server";

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";
import { z } from "zod";

import { env } from "@/lib/env";
import { fakeIntegrationsAllowed } from "@/lib/payments/policy";
import { requestOrigin } from "@/lib/auth/origin";
import { FAKE_WEBHOOK_SECRET } from "@/lib/payments/fake";
import { signatureManifest, signWebhook } from "@/lib/payments/signature";

const schema = z.object({
  ref: z.uuid(),
  pedido: z.string().regex(/^BA-\d{6,}$/),
  resultado: z.enum(["approved", "pending", "rejected", "wrongamount"]),
});

/**
 * The fake "Mercado Pago page" result: posts a signed notification to our
 * real webhook, exactly like Mercado Pago would, then returns the customer
 * to the thank-you page. Development and previews only.
 */
export async function simulatePayment(formData: FormData): Promise<void> {
  if (!env.PAYMENTS_FAKE || !fakeIntegrationsAllowed()) {
    throw new Error("pagamento de teste desligado");
  }
  const { ref, pedido, resultado } = schema.parse(Object.fromEntries(formData));
  const dataId = `fake-${resultado}-${ref}-${randomUUID().slice(0, 8)}`;
  const requestId = randomUUID();
  const ts = String(Date.now());
  const v1 = signWebhook(
    FAKE_WEBHOOK_SECRET,
    signatureManifest({ dataId, requestId, ts }),
  );
  const site = await requestOrigin();
  const res = await fetch(
    `${site}/api/webhooks/mercadopago?data.id=${encodeURIComponent(dataId)}&type=payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": `ts=${ts},v1=${v1}`,
        "x-request-id": requestId,
      },
      body: JSON.stringify({
        type: "payment",
        action: "payment.updated",
        data: { id: dataId },
      }),
    },
  );
  if (!res.ok) throw new Error(`webhook de teste: HTTP ${res.status}`);
  redirect(`/pedido/${pedido}/obrigado`);
}
