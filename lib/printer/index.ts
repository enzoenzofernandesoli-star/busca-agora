import "server-only";

import { env } from "@/lib/env";

import {
  basicAuthHeader,
  buildPrintJob,
  parsePrintJobResponse,
  printNodeErrorMessage,
  type PrintDoc,
} from "./printnode-request";

// Our contract with the label printer service (CLAUDE.md rule 9).
export interface Printer {
  /** False while PrintNode is not set up: the queue skips printing. */
  readonly enabled: boolean;
  /**
   * Sends one document. Returns the print job id, or "repetido" when the
   * same key was already printed (PrintNode 409, within its 24 h window).
   */
  printOne(doc: PrintDoc, key: string): Promise<number | "repetido">;
}

export function printNodePrinter(
  printerIdFromSettings: string | null,
  fetchImpl: typeof fetch = fetch,
): Printer {
  const apiKey = env.PRINTNODE_API_KEY;
  const printerId = Number(printerIdFromSettings ?? env.PRINTNODE_PRINTER_ID);
  const enabled =
    Boolean(apiKey) && Number.isInteger(printerId) && printerId > 0;
  return {
    enabled,
    async printOne(doc, key) {
      if (!enabled || !apiKey) throw new Error("PrintNode não configurado");
      const job = buildPrintJob(printerId, doc, key);
      const res = await fetchImpl("https://api.printnode.com/printjobs", {
        method: "POST",
        headers: {
          ...job.headers,
          Authorization: basicAuthHeader(apiKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(job.body),
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => null);
      if (res.status === 409) return "repetido";
      if (!res.ok) throw new Error(printNodeErrorMessage(res.status, json));
      return parsePrintJobResponse(json);
    },
  };
}
