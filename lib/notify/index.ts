import "server-only";

import { requireEnv } from "@/lib/env";

// Our contract with the internal alert channel (CLAUDE.md rule 9).
export interface Notifier {
  /** HTML message (see lib/notify/messages.ts). */
  send(html: string): Promise<void>;
}

export function telegramNotifier(): Notifier {
  return {
    async send(html) {
      const token = requireEnv("TELEGRAM_BOT_TOKEN");
      const chatId = requireEnv("TELEGRAM_CHAT_ID");
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: html,
            parse_mode: "HTML",
            link_preview_options: { is_disabled: true },
          }),
          signal: AbortSignal.timeout(10_000),
          cache: "no-store",
        },
      );
      if (!res.ok) {
        // The URL holds the token: never put it (or the raw body) in the error.
        const body = (await res.json().catch(() => null)) as {
          description?: unknown;
        } | null;
        const why =
          typeof body?.description === "string"
            ? body.description.slice(0, 200)
            : "sem detalhe";
        throw new Error(
          `Telegram recusou a mensagem (HTTP ${res.status}): ${why}`,
        );
      }
    },
  };
}
