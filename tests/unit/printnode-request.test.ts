import { describe, expect, it } from "vitest";
import {
  buildPrintJob,
  basicAuthHeader,
  parsePrintJobResponse,
  printNodeErrorMessage,
  orderedDocs,
  type PrintDoc,
} from "@/lib/printer/printnode-request";
const summary: PrintDoc = { titulo: "Resumo", pdf: { base64: "JVBERg==" } };
const invoice: PrintDoc = {
  titulo: "Nota",
  pdf: { url: "https://example.test/nota.pdf" },
};
const label: PrintDoc = {
  titulo: "Etiqueta",
  pdf: { url: "https://example.test/etiqueta.pdf" },
};
describe("PrintNode request", () => {
  it("uses base64 and the official idempotency header", () => {
    const r = buildPrintJob(1, summary, "order/summary");
    expect(r.headers).toEqual({ "X-Idempotency-Key": "order/summary" });
    expect(r.body).toMatchObject({
      printerId: 1,
      title: "Resumo",
      contentType: "pdf_base64",
      content: "JVBERg==",
      source: "Busca Agora",
      options: { fit_to_page: true },
      qty: 1,
    });
    expect(r.body).not.toHaveProperty("options.paper");
  });
  it("uses URL mode and limits title", () => {
    expect(
      buildPrintJob(1, { ...invoice, titulo: "x".repeat(90) }, "k").body,
    ).toMatchObject({
      contentType: "pdf_uri",
      content: "https://example.test/nota.pdf",
      title: "x".repeat(80),
    });
  });
  it("builds Basic auth with empty password", () => {
    expect(basicAuthHeader("fictitious-key")).toBe(
      "Basic " + Buffer.from("fictitious-key:").toString("base64"),
    );
  });
  it("orders summary, optional invoice, label", () => {
    expect(
      orderedDocs({ etiqueta: label, resumo: summary, nota: invoice }),
    ).toEqual([summary, invoice, label]);
    expect(orderedDocs({ etiqueta: label, resumo: summary })).toEqual([
      summary,
      label,
    ]);
  });
  it("parses a numeric job ID", () => {
    expect(parsePrintJobResponse(623)).toBe(623);
    for (const value of ["623", null, {}, 0, 1.5])
      expect(() => parsePrintJobResponse(value)).toThrow(
        "PrintNode não aceitou a impressão",
      );
  });
  it("returns error messages without payload or credentials", () => {
    expect(printNodeErrorMessage(401, { message: "fictitious-key" })).toBe(
      "Chave do PrintNode inválida",
    );
    expect(printNodeErrorMessage(404, {})).toContain(
      "Impressora não encontrada",
    );
    expect(printNodeErrorMessage(429, {})).toContain("Limite de impressões");
    expect(printNodeErrorMessage(500, { message: "fictitious-key" })).toBe(
      "PrintNode recusou (HTTP 500)",
    );
  });
  it("rejects invalid printer and header injection", () => {
    expect(() => buildPrintJob(0, summary, "k")).toThrow();
    expect(() => buildPrintJob(1, summary, "k\nInjected")).toThrow();
  });
});
