import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  jobFailedMessage,
  paidOrderMessage,
  returnRequestedMessage,
} from "@/lib/notify/messages";
const base = {
  numero: "BA-000123",
  totalCents: 18990,
  itens: 3,
  cidade: "Cidade Exemplo",
  uf: "SP",
  adminUrl: "https://example.test/admin/pedidos/BA-000123",
};
describe("Telegram messages", () => {
  it("escapes markup and quotes", () => {
    expect(escapeHtml('<script>"&</script>')).toBe(
      "&lt;script&gt;&quot;&amp;&lt;/script&gt;",
    );
  });
  it("formats money and plural", () => {
    expect(paidOrderMessage(base)).toContain("189,90 · 3 itens");
    expect(paidOrderMessage({ ...base, itens: 1 })).toContain("1 item ·");
  });
  it("escapes external fields", () => {
    const text = paidOrderMessage({
      ...base,
      cidade: "<script>&",
      adminUrl: 'https://example.test/?x="&',
    });
    expect(text).toContain("&lt;script&gt;&amp;");
    expect(text).toContain("&quot;&amp;");
  });
  it("caps errors before escaping", () => {
    const text = jobFailedMessage({
      tipo: "print",
      numero: base.numero,
      tentativas: 5,
      erro: "x".repeat(500),
      adminUrl: base.adminUrl,
    });
    expect(text).toContain("Impressão");
    expect(text).toContain("x".repeat(299) + "…");
    expect(text).not.toContain("x".repeat(300));
  });
  it("limits complete HTML without splitting entities", () => {
    const text = paidOrderMessage({ ...base, cidade: "&".repeat(10000) });
    expect(text.length).toBeLessThanOrEqual(4096);
    expect(text).not.toMatch(/&(amp|lt|gt|quot)?…/);
  });
  it("keeps balanced bold tags when truncating a long number", () => {
    const text = paidOrderMessage({ ...base, numero: "x".repeat(10000) });
    expect(text.length).toBeLessThanOrEqual(4096);
    expect(text.endsWith("</b>")).toBe(true);
  });
  it("formats returns and cuts details", () => {
    const text = returnRequestedMessage({
      numero: base.numero,
      tipo: "devolucao",
      motivo: "<defeito>",
      detalhe: "x".repeat(900),
      adminUrl: base.adminUrl,
    });
    expect(text).toContain("Pedido de devolução");
    expect(text).toContain("&lt;defeito&gt;");
    expect(text).toContain("x".repeat(499) + "…");
  });
});
