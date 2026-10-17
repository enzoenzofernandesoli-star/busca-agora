import type { OriginGroup } from "./types";

const REDES =
  /^(instagram|ig|facebook|fb|tiktok|youtube|yt|twitter|x|pinterest|kwai|whatsapp|wa|threads|linktree)$/;
const ANUNCIO =
  /^(cpc|ppc|paid|pago|ads|anuncio|anúncio|display|paid_social|paidsocial)$/;

/** Groups a visit/sale origin for the panel. */
export function originGroup(o: {
  utm_source: string;
  utm_medium: string;
  ref: string;
}): OriginGroup {
  if (o.ref) return "influenciador";
  if (ANUNCIO.test(o.utm_medium) || /ads$/.test(o.utm_source)) return "anuncio";
  if (!o.utm_source && !o.utm_medium) return "direto";
  if (REDES.test(o.utm_source) || o.utm_medium === "social") return "redes";
  return "outros";
}

export function originLabel(o: {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  ref: string;
}): string {
  if (o.ref) return `ref: ${o.ref}`;
  const parts = [o.utm_source, o.utm_medium, o.utm_campaign].filter(Boolean);
  return parts.length ? parts.join(" · ") : "direto";
}
