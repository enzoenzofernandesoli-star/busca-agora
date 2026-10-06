import { cepSchema, lookupCep } from "@/lib/br/cep";

// GET /api/cep/01001000 -> { endereco: ViaCepAddress | null }
// Proxied on the server so the browser never talks to ViaCEP directly and
// the answer can be cached: addresses for a CEP rarely change.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/cep/[cep]">,
) {
  const parsed = cepSchema.safeParse((await ctx.params).cep);
  if (!parsed.success) {
    return Response.json({ endereco: null }, { status: 400 });
  }
  const endereco = await lookupCep(parsed.data);
  return Response.json(
    { endereco },
    {
      headers: {
        "Cache-Control": endereco
          ? "public, s-maxage=86400, stale-while-revalidate=604800"
          : "public, s-maxage=300",
      },
    },
  );
}
