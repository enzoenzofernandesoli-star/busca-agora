import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import { formatCpf } from "@/lib/br/cpf";
import type { Database } from "@/lib/db/types";
import { publicEnv } from "@/lib/env-public";

// Seller identity for the footer and the legal pages (Decreto 7.962/2013).
// Read through store_info() with the anon key: never the private settings.

export type StoreInfo = {
  marca: string;
  vendedor: string | null;
  /** Already formatted: "CNPJ 12.345.678/0001-90" or "CPF 123.456.789-09". */
  documento: string | null;
  endereco: string | null;
  email: string | null;
  /** Digits with country code, e.g. "5511999998888". */
  whatsapp: string | null;
  horario: string | null;
};

export const STORE_INFO_TAG = "store-info";

const rowSchema = z.object({
  vendedor: z.string().nullable(),
  cnpj: z.string().nullable(),
  cpf: z.string().nullable(),
  endereco: z.string().nullable(),
  email: z.string().nullable(),
  whatsapp: z.string().nullable(),
  horario: z.string().nullable(),
});

export function formatCnpj(d: string): string {
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function toStoreInfo(row: unknown): StoreInfo {
  const parsed = rowSchema.safeParse(row);
  const r = parsed.success ? parsed.data : null;
  return {
    marca: "Busca Agora",
    vendedor: r?.vendedor ?? null,
    documento: r?.cnpj
      ? `CNPJ ${formatCnpj(r.cnpj)}`
      : r?.cpf
        ? `CPF ${formatCpf(r.cpf)}`
        : null,
    endereco: r?.endereco ?? null,
    email: r?.email ?? null,
    whatsapp: r?.whatsapp ?? null,
    horario: r?.horario ?? null,
  };
}

async function load(): Promise<StoreInfo> {
  const supabase = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.rpc("store_info");
  // The footer is on every page: an outage shows "[a preencher]", not a 500.
  return toStoreInfo(error ? null : data);
}

/** Cached 5 min; saving Configurações in the admin refreshes it at once. */
export const getStoreInfo = unstable_cache(load, [STORE_INFO_TAG], {
  revalidate: 300,
  tags: [STORE_INFO_TAG],
});
