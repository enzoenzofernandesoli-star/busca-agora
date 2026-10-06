import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/db/server";

// POST only: a GET link could log people out from an <img> on another site.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), {
    status: 303,
  });
}
