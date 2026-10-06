import { z } from "zod";

import { suggestProducts } from "@/lib/catalog/queries";

const querySchema = z.object({
  q: z.string().trim().min(2).max(60),
});

// GET /api/busca/sugestoes?q=fon -> up to 6 product names while typing.
// Public catalog data only; cached briefly at the edge.
export async function GET(request: Request) {
  const parsed = querySchema.safeParse({
    q: new URL(request.url).searchParams.get("q") ?? "",
  });
  if (!parsed.success) {
    return Response.json({ sugestoes: [] });
  }

  const sugestoes = await suggestProducts(parsed.data.q);
  return Response.json(
    { sugestoes },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
