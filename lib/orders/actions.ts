"use server";

import { redirect } from "next/navigation";

import type { ReturnFormState } from "@/components/conta/return-request-dialog";
import type { TrackingFormState } from "@/components/loja/tracking-form";
import { allowAttempt, clientIp } from "@/lib/auth/rate-limit";
import { fieldErrors } from "@/lib/auth/schemas";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/db/admin";
import { kickJobs } from "@/lib/jobs/run";

import { getMyOrder, orderMatchesEmail } from "./customer";
import { canRequestReturn, returnSchema } from "./return-schema";
import { trackingSchema } from "./tracking-schema";
import { trackingToken } from "./tracking-token";

const TOO_MANY =
  "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.";

function values(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData)
    if (typeof v === "string") out[k] = v.slice(0, 1000);
  return out;
}

export async function trackOrder(
  _state: TrackingFormState,
  formData: FormData,
): Promise<TrackingFormState> {
  const parsed = trackingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: values(formData),
    };
  }
  const { numero, email } = parsed.data;
  const allowed = await allowAttempt([
    { kind: "rastreio:ip", value: await clientIp() },
    { kind: "rastreio:pedido", value: numero },
  ]);
  if (!allowed)
    return { ok: false, message: TOO_MANY, values: values(formData) };

  if (!(await orderMatchesEmail(numero, email))) {
    // Same answer for "no such order" and "wrong e-mail".
    return {
      ok: false,
      message:
        "Não achamos um pedido com esse número e e-mail. Confira os dois.",
      values: values(formData),
    };
  }
  redirect(`/rastreio/${numero}?t=${trackingToken(numero)}`);
}

export async function requestReturn(
  _state: ReturnFormState,
  formData: FormData,
): Promise<ReturnFormState> {
  const user = await requireUser("/conta/pedidos");
  const parsed = returnSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: values(formData),
    };
  }
  const { numero, tipo, motivo, detalhe } = parsed.data;
  if (!(await allowAttempt([{ kind: "devolucao:usuario", value: user.id }]))) {
    return { ok: false, message: TOO_MANY, values: values(formData) };
  }

  // RLS: only the owner's order comes back.
  const order = await getMyOrder(user.id, numero);
  if (!order) return { ok: false, message: "Pedido não encontrado." };
  if (order.trocaPedida) {
    return {
      ok: false,
      message:
        "Já recebemos seu pedido de troca ou devolução. Vamos responder pelo seu e-mail.",
    };
  }
  if (!canRequestReturn(order.status, order.entregueEm, new Date())) {
    return {
      ok: false,
      message:
        "O prazo de 7 dias depois da entrega passou. Fale com a gente pela página de contato.",
    };
  }

  // The trigger enqueues the Telegram notice in the same transaction.
  const { error } = await createAdminClient()
    .from("order_events")
    .insert({
      order_id: order.id,
      evento: "devolucao_solicitada",
      detalhe: { tipo, motivo, detalhe, origem: "cliente" },
    });
  if (error) {
    return {
      ok: false,
      message: "Não deu certo agora. Tente de novo em instantes.",
    };
  }
  kickJobs();
  // No revalidatePath here: it would re-render the page without the dialog
  // (the button goes away) before the customer reads the confirmation.
  return { ok: true };
}
