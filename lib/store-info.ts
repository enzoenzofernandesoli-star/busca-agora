import {
  EMPRESA,
  enderecoEmLinha,
  formatCnpj,
  type Empresa,
} from "@/lib/config/empresa";

// Seller identity for the footer and the legal pages (Decreto 7.962/2013,
// art. 2). Comes from the official company file (lib/config/empresa.ts),
// not from the database: one versioned source for the whole site.

export type StoreInfo = {
  marca: string;
  razaoSocial: string;
  /** Already formatted: "12.345.678/0001-90". */
  cnpj: string;
  endereco: string;
  email: string;
  /** Digits with country code, e.g. "5511999998888". */
  whatsapp: string | null;
  horario: string | null;
};

/** Kept for the admin's cache refresh after saving settings. */
export const STORE_INFO_TAG = "store-info";

export { formatCnpj };

export function toStoreInfo(e: Empresa = EMPRESA): StoreInfo {
  return {
    marca: e.nomeFantasia,
    razaoSocial: e.razaoSocial,
    cnpj: formatCnpj(e.cnpj),
    endereco: enderecoEmLinha(e.endereco),
    email: e.email,
    whatsapp: e.whatsapp,
    horario: e.horario,
  };
}

/** Async for the existing callers (pages and footer). */
export async function getStoreInfo(): Promise<StoreInfo> {
  return toStoreInfo();
}
