import type { Period, PeriodKey } from "./types";

const TZ = "America/Sao_Paulo";
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** YYYY-MM-DD of a moment in São Paulo. */
export function spDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Every day from de to ate (inclusive). */
export function daysBetween(de: string, ate: string): string[] {
  const out: string[] = [];
  for (let d = de; d <= ate; d = addDays(d, 1)) out.push(d);
  return out;
}

/**
 * Period from the panel's query string: ?periodo=hoje|7|30|90 or
 * ?de=&ate= (custom, up to 400 days, never in the future). Default 30.
 */
export function parsePeriod(
  params: Record<string, string | string[] | undefined>,
  now: Date,
): Period {
  const hoje = spDate(now);
  const one = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : undefined;
  };
  const de = one("de");
  const ate = one("ate");
  if (de && ate && ISO.test(de) && ISO.test(ate) && de <= ate) {
    const fim = ate > hoje ? hoje : ate;
    const inicio = de < addDays(fim, -399) ? addDays(fim, -399) : de;
    if (inicio <= fim) return { key: "personalizado", de: inicio, ate: fim };
  }
  const key = (["hoje", "7", "30", "90"] as const).find(
    (k) => k === one("periodo"),
  ) as Exclude<PeriodKey, "personalizado"> | undefined;
  const k = key ?? "30";
  if (k === "hoje") return { key: k, de: hoje, ate: hoje };
  return { key: k, de: addDays(hoje, -(Number(k) - 1)), ate: hoje };
}
