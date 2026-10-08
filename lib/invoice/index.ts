import "server-only";

import { env } from "@/lib/env";

// Our contract with any NF-e issuer (CLAUDE.md rule 9).
export type InvoiceResult =
  | { tipo: "manual" }
  | { tipo: "emitida"; chave: string; danfePath: string | null };

export interface InvoiceProvider {
  emit(orderId: string): Promise<InvoiceResult>;
}

/**
 * NFE_ENABLED=false (no CNPJ + IE + A1 certificate yet): no automatic NF-e.
 * The chain goes on with a content declaration and the admin issues the
 * note by hand (CLAUDE.md section 5). Focus NFe plugs in here later.
 */
export function invoiceProvider(): InvoiceProvider {
  return {
    async emit() {
      if (!env.NFE_ENABLED) return { tipo: "manual" };
      throw new Error(
        "Emissão automática de NF-e ainda não ligada (Focus NFe entra com o CNPJ).",
      );
    },
  };
}
