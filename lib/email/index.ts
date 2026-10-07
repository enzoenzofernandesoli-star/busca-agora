import "server-only";

import { Resend } from "resend";

import { env, requireEnv } from "@/lib/env";

// Our contract with any e-mail provider (CLAUDE.md rule 9).
export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Same key twice = the provider sends once (worker retries are safe). */
  idempotencyKey: string;
};

export interface EmailSender {
  send(email: OutgoingEmail): Promise<{ id: string }>;
}

// Resend's test sender until buscaagora.com.br is verified there (phase 9);
// it only delivers to the Resend account owner's address.
const FROM = env.NEXT_PUBLIC_SITE_URL.includes("buscaagora.com.br")
  ? "Busca Agora <pedidos@buscaagora.com.br>"
  : "Busca Agora <onboarding@resend.dev>";

export function resendSender(): EmailSender {
  return {
    async send(email) {
      const resend = new Resend(requireEnv("RESEND_API_KEY"));
      const { data, error } = await resend.emails.send(
        {
          from: FROM,
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
