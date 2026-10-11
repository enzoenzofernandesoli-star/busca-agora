import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { loginHref } from "@/lib/auth/redirect";

// Next.js 16 "proxy" (formerly middleware). Two jobs, both cheap:
// 1. refresh the Supabase session cookie, so Server Components see a valid
//    session;
// 2. send logged-out visitors of /conta and /admin to /entrar.
// It is NOT the security check: pages and actions call requireUser() /
// requireAdmin() on the server, which read the database.
export async function proxy(request: NextRequest) {
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
