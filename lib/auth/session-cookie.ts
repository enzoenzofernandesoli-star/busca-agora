// Reads the first name from the Supabase session cookie, in the browser,
// without loading supabase-js (≈ 640 KiB with its dependencies) on every
// page just for the header greeting. Display only: account pages check the
// session on the server.
//
// @supabase/ssr stores the session as "sb-<project>-auth-token", optionally
// split into ".0", ".1"... chunks, with a "base64-" prefix (base64url JSON).

const NAME = /^sb-.+-auth-token(?:\.(\d+))?$/;

function decodeBase64Url(value: string): string {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function firstNameFromCookies(cookieHeader: string): string | null {
  // Any cookie can be malformed (a bad "%" escape, a foreign project): the
  // header greeting must never take the page down.
  try {
    return parse(cookieHeader);
  } catch {
    return null;
  }
}

function parse(cookieHeader: string): string | null {
  const parts: { key: string; index: number; value: string }[] = [];
  for (const pair of cookieHeader.split(";")) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const m = NAME.exec(name);
    if (!m) continue;
    parts.push({
      key: name.replace(/\.\d+$/, ""),
      index: m[1] === undefined ? -1 : Number(m[1]),
      value: decodeURIComponent(pair.slice(eq + 1).trim()),
    });
  }
  if (parts.length === 0) return null;
  const key = parts[0]!.key;
  const raw = parts
    .filter((p) => p.key === key)
    .sort((a, b) => a.index - b.index)
    .map((p) => p.value)
    .join("");
  const json = raw.startsWith("base64-")
    ? decodeBase64Url(raw.slice("base64-".length))
    : raw;
  const session = JSON.parse(json) as {
    user?: { user_metadata?: Record<string, unknown> };
  } | null;
  if (!session?.user) return null;
  const meta = session.user.user_metadata;
  const full = meta?.nome ?? meta?.full_name ?? meta?.name;
  const first = typeof full === "string" ? full.trim().split(/\s+/)[0] : "";
  return first || "cliente";
}
