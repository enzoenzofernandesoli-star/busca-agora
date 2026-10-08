export type PrintDoc = {
  titulo: string;
  pdf: { base64: string } | { url: string };
};
export function buildPrintJob(
  printerId: number,
  doc: PrintDoc,
  idempotencyKey: string,
): { body: object; headers: Record<string, string> } {
  if (!Number.isSafeInteger(printerId) || printerId < 1)
    throw new Error("Impressora inválida");
  if (!idempotencyKey.trim() || /[\r\n]/.test(idempotencyKey))
    throw new Error("Identificador de impressão inválido");
  const base64 = "base64" in doc.pdf;
  const content = "base64" in doc.pdf ? doc.pdf.base64 : doc.pdf.url;
  if (!content) throw new Error("PDF de impressão vazio");
  if (!base64) {
    let url;
    try {
      url = new URL(content);
    } catch {
      throw new Error("URL do PDF inválida");
    }
    if (!["https:", "http:"].includes(url.protocol))
      throw new Error("URL do PDF inválida");
  }
  return {
    body: {
      printerId,
      title: doc.titulo.slice(0, 80),
      contentType: base64 ? "pdf_base64" : "pdf_uri",
      content,
      source: "Busca Agora",
      options: { fit_to_page: true },
      qty: 1,
    },
    headers: { "X-Idempotency-Key": idempotencyKey },
  };
  // Paper names are driver-specific capability keys; configure 10x15 there.
}
export function basicAuthHeader(apiKey: string): string {
  return "Basic " + Buffer.from(apiKey + ":", "utf8").toString("base64");
}
export function parsePrintJobResponse(json: unknown): number {
  if (typeof json !== "number" || !Number.isSafeInteger(json) || json < 1)
    throw new Error("PrintNode não aceitou a impressão");
  return json;
}
export function printNodeErrorMessage(status: number, json: unknown): string {
  // Provider bodies may include credentials; deliberately ignore them.
  void json;
  if (status === 401) return "Chave do PrintNode inválida";
  if (status === 404) return "Impressora não encontrada no PrintNode";
  if (status === 429) return "Limite de impressões do PrintNode atingido";
  return `PrintNode recusou (HTTP ${status})`;
}
export const PRINT_ORDER = ["resumo", "nota", "etiqueta"] as const;
export function orderedDocs(
  docs: Partial<Record<(typeof PRINT_ORDER)[number], PrintDoc>>,
): PrintDoc[] {
  return PRINT_ORDER.flatMap((key) => (docs[key] ? [docs[key]] : []));
}
