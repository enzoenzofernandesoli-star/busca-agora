import type { SortKey } from "./types";

type Search = Record<string, string | string[] | undefined>;

const SORT_KEYS: SortKey[] = [
  "nome",
  "views",
  "visitantes",
  "carrinho",
  "checkout",
  "compras",
  "conversao",
  "faturamento",
  "margem",
];

export function toSearchParams(params: Search): URLSearchParams {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string") out.set(k, v);
    else if (Array.isArray(v)) for (const x of v) out.append(k, x);
  }
  return out;
}

export function parseSort(params: Search): {
  key: SortKey;
  dir: "asc" | "desc";
} {
  const ordem = typeof params.ordem === "string" ? params.ordem : "";
  const key = SORT_KEYS.find((k) => k === ordem) ?? "views";
  return { key, dir: params.dir === "asc" ? "asc" : "desc" };
}

/** ?prever=N, 1..365 (default 7). */
export function parseHorizon(params: Search): number {
  const n = Number(typeof params.prever === "string" ? params.prever : "7");
  return Number.isInteger(n) && n >= 1 && n <= 365 ? n : 7;
}
