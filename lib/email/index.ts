import "server-only";

import { createTransport } from "nodemailer";
import { Resend } from "resend";

import { env, requireEnv } from "@/lib/env";

// Our contract with any e-mail provider (CLAUDE.md rule 9).
export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Same key twice = the same message (worker retries are safe). */
  idempotencyKey: string;
};

export interface EmailSender {
  send(email: OutgoingEmail): Promise<{ id: string }>;
}

/**
 * Resend when its key exists (needs a verified domain to reach customers);
 * otherwise the store's Gmail with an app password (free, decision of 08/10).
 */
export function emailSender(): EmailSender {
  return env.RESEND_API_KEY ? resendSender() : gmailSender();
}

export function emailEnabled(): boolean {
  return Boolean(
    env.RESEND_API_KEY || (env.GMAIL_USER && env.GMAIL_APP_PASSWORD),
  );
}

// ---------------------------------------------------------------------------

const RESEND_FROM = env.NEXT_PUBLIC_SITE_URL.includes("buscaagora.com.br")
  ? "Busca Agora <pedidos@buscaagora.com.br>"
  : "Busca Agora <onboarding@resend.dev>";

export function resendSender(): EmailSender {
  return {
    async send(email) {
      const resend = new Resend(requireEnv("RESEND_API_KEY"));
      const { data, error } = await resend.emails.send(
        {
          from: RESEND_FROM,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
        },
        { idempotencyKey: email.idempotencyKey },
      );
      if (error || !data) {
        throw new Error(
          `Resend recusou o e-mail: ${error?.name ?? "sem resposta"} (${error?.statusCode ?? "?"})`,
        );
      }
      return { id: data.id };
    },
  };
}

// ---------------------------------------------------------------------------

/**
 * A fixed Message-ID per order and stage: if a retry re-sends a message
 * that already went out, Gmail on the receiving side recognizes it as the
 * same e-mail instead of showing it twice.
 */
export function messageIdFor(idempotencyKey: string): string {
  return `<${idempotencyKey.replace(/[^a-zA-Z0-9.-]/g, ".")}@buscaagora.com.br>`;
}

export function gmailSender(): EmailSender {
  return {
    async send(email) {
      const user = requireEnv("GMAIL_USER");
      const transport = createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user, pass: requireEnv("GMAIL_APP_PASSWORD") },
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 20_000,
      });
      try {
        const info = await transport.sendMail({
          // Gmail only sends as the account itself; the name is ours.
          from: { name: "Busca Agora", address: user },
          replyTo: user,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          messageId: messageIdFor(email.idempotencyKey),
        });
        return { id: info.messageId };
      } catch (e) {
        // SMTP errors may echo the address or the server's text: keep it short.
        const code =
          typeof e === "object" && e && "responseCode" in e
            ? String((e as { responseCode: unknown }).responseCode)
            : "sem código";
        throw new Error(`Gmail recusou o e-mail (SMTP ${code})`);
      } finally {
        transport.close();
      }
    },
  };
}
