import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { loginHref } from "@/lib/auth/redirect";
import { FIRST_VISIT_HEADER, SESSION_COOKIE } from "@/lib/site";

// Next.js 16 "proxy" (formerly middleware). Three jobs, all cheap:
// 0. on "/", remember the visitor saw the opening animation this session;
// 1. refresh the Supabase session cookie, so Server Components see a valid
//    session;
// 2. send logged-out visitors of /conta and /admin to /entrar.
// It is NOT the security check: pages and actions call requireUser() /
// requireAdmin() on the server, which read the database.
export async function proxy(request: NextRequest) {
  // Home: the opening animation plays once per browser session (decision of
  // 08/10), marked on the HTTP response so it holds even if the page script
  // never runs. No session work here.
  if (request.nextUrl.pathname === "/") {
    // Only a real page load opens the store. Link prefetches and client
    // navigations of "/" (fetch requests: Sec-Fetch-Dest "empty") must not
    // spend the animation: a prefetch of the header logo link used to set
    // the cookie before the visitor ever opened the Home. Next.js strips its
    // own RSC headers before the proxy, so the browser's headers decide.
    const h = request.headers;
    const destino = h.get("sec-fetch-dest");
    const carregamento =
      (destino === null || destino === "document") &&
      h.get("purpose") !== "prefetch" &&
      !(h.get("sec-purpose") ?? "").includes("prefetch");
    const abrirAgora = carregamento && !request.cookies.has(SESSION_COOKIE);
    // A cookie set here is already visible to the page in this same
    // request, so the page learns "show it" from this header instead.
    const headers = new Headers(request.headers);
    headers.delete(FIRST_VISIT_HEADER);
    if (abrirAgora) headers.set(FIRST_VISIT_HEADER, "1");
    const home = NextResponse.next({ request: { headers } });
    if (abrirAgora) {
      // No maxAge: a session cookie, gone when the browser closes.
      home.cookies.set(SESSION_COOKIE, "1", {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return home;
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() verifies the JWT and refreshes it when needed.
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  const protegido =
    pathname === "/conta" ||
    pathname.startsWith("/conta/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (protegido && !loggedIn) {
    const destino = new URL(loginHref(pathname + search), request.url);
    const redirect = NextResponse.redirect(destino);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

export const config = {
  // Only where the server reads the session. Catalog pages (home, search,
  // product) do not, so they stay cacheable and skip this round trip.
  matcher: [
    "/",
    "/conta/:path*",
    "/admin/:path*",
    "/entrar",
    "/cadastro",
    "/recuperar-senha",
    "/redefinir-senha",
    "/aceite-termos",
    "/auth/:path*",
  ],
};
