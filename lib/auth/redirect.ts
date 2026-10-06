// Where to send the customer after login (?volta=). Only internal paths are
// accepted, so a crafted link can never redirect to another site.
// Pure module (no "server-only") so it can be unit tested.

const FALLBACK = "/conta";

export function safeNext(value: unknown, fallback = FALLBACK): string {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (
    !path.startsWith("/") ||
    // "//evil.com" and "/\evil.com" are protocol-relative URLs in browsers.
    path.startsWith("//") ||
    path.startsWith("/\\") ||
    path.includes("\0") ||
    /[\r\n\t]/.test(path) ||
    path.length > 512
  ) {
    return fallback;
  }
  // Never bounce back into the auth pages themselves.
  if (/^\/(entrar|cadastro|recuperar-senha|auth)(\/|\?|$)/.test(path)) {
    return fallback;
  }
  try {
    // Resolving against a dummy origin must keep that origin.
    const url = new URL(path, "https://busca-agora.invalid");
    if (url.origin !== "https://busca-agora.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

/** /entrar?volta=<path> for a protected page. */
export function loginHref(next: string): string {
  return `/entrar?volta=${encodeURIComponent(safeNext(next))}`;
}
