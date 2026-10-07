import "server-only";

import { render } from "@react-email/render";
import type { ReactElement } from "react";

import NotaEmitida from "@/emails/nota-emitida";
import PagamentoAprovado from "@/emails/pagamento-aprovado";
import PedidoEntregue from "@/emails/pedido-entregue";
import PedidoEnviado from "@/emails/pedido-enviado";
import PedidoRecebido from "@/emails/pedido-recebido";
import { SUBJECTS } from "@/emails/subjects";
import type { OrderEmailBase } from "@/emails/types";
import { createAdminClient } from "@/lib/db/admin";
import { env } from "@/lib/env";
import { type EmailSender, resendSender } from "@/lib/email";
import { type Notifier, telegramNotifier } from "@/lib/notify";
import {
  jobFailedMessage,
  paidOrderMessage,
  returnRequestedMessage,
} from "@/lib/notify/messages";
import {
  adminOrderUrl,
  loadOrderNotice,
  type OrderNotice,
  siteUrl,
  trackingUrl,
} from "@/lib/orders/notice-data";
import { RETURN_REASONS } from "@/lib/orders/return-schema";

import type { Job, JobHandler, JobType } from "./worker";

function baseProps(o: OrderNotice): OrderEmailBase {
  return {
    siteUrl: siteUrl(),
    numero: o.numero,
    clienteNome: o.clienteNome,
    itens: o.itens,
    subtotalCents: o.subtotalCents,
    freteCents: o.freteCents,
    descontoCents: o.descontoCents,
    totalCents: o.totalCents,
    freteServico: o.freteServico,
    endereco: o.endereco,
  };
}

/** Subject and template for each stage; null = nothing to send. */
function emailFor(
  etapa: string,
  o: OrderNotice,
): { subject: string; element: ReactElement } | null {
  const base = baseProps(o);
  switch (etapa) {
    case "pending_payment":
      return {
        subject: SUBJECTS.pedido_recebido(o.numero),
        element: <PedidoRecebido {...base} metodo={o.metodo} />,
      };
    case "paid":
      return {
        subject: SUBJECTS.pagamento_aprovado(o.numero),
        element: <PagamentoAprovado {...base} />,
      };
    case "invoiced":
      // Note issued by hand (NFE_ENABLED=false): no file to point to.
      if (!o.invoice?.danfe_url && o.invoice?.status === "manual") return null;
      return {
        subject: SUBJECTS.nota_emitida(o.numero),
        element: (
          <NotaEmitida {...base} danfeUrl={o.invoice?.danfe_url ?? null} />
        ),
      };
    case "shipped": {
      const rastreio = o.shipment?.rastreio ?? null;
      return {
        subject: SUBJECTS.pedido_enviado(o.numero),
        element: (
          <PedidoEnviado
            {...base}
            transportadora={o.shipment?.transportadora ?? null}
            rastreio={rastreio}
            rastreioUrl={trackingUrl(rastreio)}
          />
        ),
      };
    }
    case "delivered":
      return {
        subject: SUBJECTS.pedido_entregue(o.numero),
        element: <PedidoEntregue {...base} />,
      };
    default:
      throw new Error(`Etapa de e-mail desconhecida: ${etapa}`);
  }
}

// Not set up yet (decision of 08/10: e-mails off until the Resend account):
// the notice is closed as "not sent" instead of failing 5 times and alerting.
export const EMAIL_OFF = "Não enviado: e-mail desligado (falta RESEND_API_KEY)";
export const TELEGRAM_OFF =
  "Não enviado: Telegram desligado (falta TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID)";

export const EMAIL_STALE =
  "Não enviado: aviso com mais de 23 h (evita e-mail repetido ao cliente)";
const STALE_MS = 23 * 60 * 60 * 1000;

export function emailHandler(
  sender: EmailSender = resendSender(),
  enabled = () => Boolean(env.RESEND_API_KEY),
  now = () => new Date(),
): JobHandler {
  return async (job) => {
    if (!enabled()) return EMAIL_OFF;
    // Resend drops idempotency keys after 24 h. Every send of this job
    // happens after created_at, so stopping at 23 h keeps all of them inside
    // the window of the first one: a retry can never deliver twice.
    if (now().getTime() - Date.parse(job.created_at) > STALE_MS) {
      return EMAIL_STALE;
    }
    const o = await loadOrderNotice(job.order_id);
    // Orders from before phase 7 have no e-mail copy: nothing to send.
    if (!o.clienteEmail) return "Não enviado: pedido sem e-mail do cliente";
    const email = emailFor(job.etapa, o);
    if (!email) return "Não enviado: nota emitida à mão, sem arquivo";
    await sender.send({
      to: o.clienteEmail,
      subject: email.subject,
      html: await render(email.element),
      text: await render(email.element, { plainText: true }),
      idempotencyKey: `pedido/${job.order_id}/${job.etapa}`,
    });
  };
}

async function latestReturnRequest(orderId: string) {
  const { data } = await createAdminClient()
    .from("order_events")
    .select("detalhe")
    .eq("order_id", orderId)
    .eq("evento", "devolucao_solicitada")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const d = (data?.detalhe ?? {}) as Record<string, unknown>;
  const motivo = String(d.motivo ?? "outro") as keyof typeof RETURN_REASONS;
  return {
    tipo: d.tipo === "troca" ? ("troca" as const) : ("devolucao" as const),
    motivo: RETURN_REASONS[motivo] ?? RETURN_REASONS.outro,
    // The customer's own words may carry personal data: they stay in the
    // admin (order history), never in the chat.
    detalhe: "O relato do cliente está no histórico do pedido, no admin.",
  };
}

export function notifyHandler(
  notifier: Notifier = telegramNotifier(),
  enabled = () => Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
): JobHandler {
  return async (job) => {
    if (!enabled()) return TELEGRAM_OFF;
    const o = await loadOrderNotice(job.order_id);
    const adminUrl = adminOrderUrl(o.numero);
    if (job.etapa === "paid") {
      await notifier.send(
        paidOrderMessage({
          numero: o.numero,
          totalCents: o.totalCents,
          itens: o.itens.reduce((n, i) => n + i.quantidade, 0),
          cidade: o.endereco.cidade,
          uf: o.endereco.uf,
          adminUrl,
        }),
      );
      return;
    }
    if (job.etapa === "devolucao") {
      const r = await latestReturnRequest(job.order_id);
      await notifier.send(
        returnRequestedMessage({ numero: o.numero, ...r, adminUrl }),
      );
      return;
    }
    throw new Error(`Etapa de aviso desconhecida: ${job.etapa}`);
  };
}

/** Telegram alert when a job used its last attempt. Never throws. */
export function exhaustedAlert(notifier: Notifier = telegramNotifier()) {
  return async (job: Job, erro: string) => {
    try {
      const o = await loadOrderNotice(job.order_id);
      await notifier.send(
        jobFailedMessage({
          tipo: job.tipo,
          numero: o.numero,
          tentativas: job.tentativas + 1,
          erro,
          adminUrl: adminOrderUrl(o.numero),
        }),
      );
    } catch {
      // The failed job stays visible in the admin; the alert is best effort.
    }
  };
}

/** Phase 6 adds invoice, label and print here. */
export function defaultHandlers(): Partial<Record<JobType, JobHandler>> {
  return { email: emailHandler(), notify: notifyHandler() };
}
