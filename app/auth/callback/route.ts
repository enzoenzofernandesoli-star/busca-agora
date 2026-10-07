import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/lib/auth/redirect";
import { mergeGuestCart } from "@/lib/cart/server";
import { createClient } from "@/lib/db/server";

// Landing point of the e-mail links (confirmation, password reset) and of
// Google login: trades the one-time code for a session cookie (PKCE).
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const volta = safeNext(url.searchParams.get("volta"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) await mergeGuestCart(data.user.id);
      return NextResponse.redirect(new URL(volta, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/entrar?erro=link", url.origin));
}
