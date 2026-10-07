import { getCartCount } from "@/lib/cart/server";

// GET /api/carrinho/contagem -> { count }. The header badge reads it in the
// browser so store pages stay cacheable for everyone.
export async function GET() {
  return Response.json(
    { count: await getCartCount() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
