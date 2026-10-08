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
  /** Prints in the given order; one idempotency key per document. */
  print(docs: PrintDoc[], keyPrefix: string): Promise<number[]>;
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
    async print(docs, keyPrefix) {
      if (!enabled || !apiKey) throw new Error("PrintNode não configurado");
      const ids: number[] = [];
      for (const [i, doc] of docs.entries()) {
        const job = buildPrintJob(printerId, doc, `${keyPrefix}/${i}`);
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
        if (!res.ok) throw new Error(printNodeErrorMessage(res.status, json));
        ids.push(parsePrintJobResponse(json));
      }
      return ids;
    },
  };
}
