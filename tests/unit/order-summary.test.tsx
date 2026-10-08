import type { ReactElement, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  OrderSummaryDocument,
  renderOrderSummary,
  type OrderSummaryData,
} from "@/lib/pdf/order-summary";
const data: OrderSummaryData = {
  numero: "BA-000123",
  criadoEm: "2026-10-08T17:32:00Z",
  cliente: { nome: "Cliente Exemplo", telefone: "11999998888" },
  endereco: {
    rua: "Rua Exemplo",
    numero: "123",
    complemento: null,
    bairro: "Centro",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01001000",
  },
  itens: [{ nome: "Fone Bluetooth", sku: "DEV-FONE", quantidade: 3 }],
  freteServico: "PAC",
  transportadora: "Correios",
  notaManual: false,
  adminUrl: "https://example.test/admin/pedidos/BA-000123",
};
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (node && typeof node === "object" && "props" in node)
    return textOf(
      (node as ReactElement<{ children?: ReactNode }>).props.children,
    );
  return "";
}
describe("thermal order summary", () => {
  it("renders a PDF buffer", async () => {
    const pdf = await renderOrderSummary(data);
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    const box = /\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(
      pdf.toString("latin1"),
    );
    expect(Number(box?.[1])).toBeCloseTo(283.46, 2);
    expect(Number(box?.[2])).toBeCloseTo(425.2, 2);
  });
  it("paginates forty items", async () => {
    const pdf = await renderOrderSummary({
      ...data,
      itens: Array.from({ length: 40 }, (_, i) => ({
        nome: `Produto de teste ${i}`,
        sku: `DEV-${i}`,
        quantidade: 1,
      })),
    });
    expect(
      (pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length,
    ).toBeGreaterThanOrEqual(2);
  }, 20000);
  // Inspect actual Text children: PDF content streams encode and compress text.
  it("includes the manual warning only when required and formats São Paulo time", () => {
    const base = textOf(OrderSummaryDocument({ data, qrDataUrl: "" }));
    const manual = textOf(
      OrderSummaryDocument({
        data: { ...data, notaManual: true },
        qrDataUrl: "",
      }),
    );
    expect(base).not.toContain("EMITIR NOTA FISCAL");
    expect(manual).toContain("EMITIR NOTA FISCAL À MÃO");
    expect(base).toContain("08/10/2026 14:32");
    expect(base).toContain("01001-000");
    expect(base.replace(/\s+/g, " ")).toContain("3 itens");
  });
  it("rejects invalid quantities", async () => {
    await expect(
      renderOrderSummary({
        ...data,
        itens: [{ ...data.itens[0]!, quantidade: 1.5 }],
      }),
    ).rejects.toThrow("Itens do pedido inválidos");
  });
});
