/**
 * Anonymous visitor (first-party cookie "ba_visitante", 1 year) and
 * request classification for product metrics. Pure helpers: no I/O.
 */
export const VISITOR_COOKIE = "ba_visitante";
export const VISITOR_MAX_AGE = 365 * 24 * 60 * 60;

const BOT =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|headless|lighthouse|pagespeed|preview|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|httpclient|scrapy/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}

export function deviceOf(userAgent: string | null): "mobile" | "desktop" {
  return userAgent && /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)
    ? "mobile"
    : "desktop";
}

export function isVisitorId(value: string | undefined): value is string {
  return !!value && /^[0-9a-f-]{36}$/.test(value);
}
