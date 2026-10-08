import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: "https://busca-agora.vercel.app",
    GMAIL_USER: "loja@example.test",
    GMAIL_APP_PASSWORD: "senha-de-app-falsa",
  },
  requireEnv: (k: string) =>
    k === "GMAIL_USER" ? "loja@example.test" : "senha-de-app-falsa",
}));

type Msg = { from: unknown; messageId: string };
const enviados: Msg[] = [];
let falhar = false;
vi.mock("nodemailer", () => ({
  createTransport: () => ({
    async sendMail(msg: Msg) {
      if (falhar) {
        throw Object.assign(
          new Error("535 senha-de-app-falsa rejected for cliente@example.test"),
          { responseCode: 535 },
        );
      }
      enviados.push(msg);
      return { messageId: msg.messageId };
    },
    close() {},
  }),
}));

const { gmailSender, messageIdFor, emailEnabled } = await import(
  "@/lib/email"
);

const email = {
  to: "cliente@example.test",
  subject: "Pagamento aprovado: pedido BA-000123",
  html: "<p>oi</p>",
  text: "oi",
  idempotencyKey: "pedido/0b8f3c7e-1d2a-4f5b-9c6d-7e8f9a0b1c2d/paid",
};

describe("gmailSender", () => {
  it("sends as Busca Agora, from the store account, with a fixed Message-ID", async () => {
    falhar = false;
    await gmailSender().send(email);
    const msg = enviados.at(-1)!;
    expect(msg.from).toEqual({
      name: "Busca Agora",
      address: "loja@example.test",
    });
    // Same order and stage -> same id (a retry is recognized as the same mail).
    expect(msg.messageId).toBe(
      "<pedido.0b8f3c7e-1d2a-4f5b-9c6d-7e8f9a0b1c2d.paid@buscaagora.com.br>",
    );
    expect(messageIdFor(email.idempotencyKey)).toBe(msg.messageId);
  });

  it("an SMTP error never carries the password or the server text", async () => {
    falhar = true;
    let got: unknown;
    try {
      await gmailSender().send(email);
    } catch (e) {
      got = e;
    }
    expect(String(got)).toBe("Error: Gmail recusou o e-mail (SMTP 535)");
  });

  it("is enabled with the Gmail pair", () => {
    expect(emailEnabled()).toBe(true);
  });
});
