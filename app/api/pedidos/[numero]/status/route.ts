import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";

// GET /api/pedidos/BA-000123/status -> { status } for the logged-in owner
// (RLS: a customer only reads their own orders). Used by the thank-you page
// while it waits for the payment.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/pedidos/[numero]/status">,
) {
  const { numero } = await ctx.params;
  if (!/^BA-\d{6,}$/.test(numero))
    return Response.json({ status: null }, { status: 404 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ status: null }, { status: 401 });
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("status")
    .eq("numero", numero)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return Response.json({ status: null }, { status: 404 });
  return Response.json(
    { status: data.status },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
