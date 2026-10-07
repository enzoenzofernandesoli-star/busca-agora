import { allowAttempt, clientIp } from "@/lib/auth/rate-limit";
import { quoteRequestBody, quoteShipping } from "@/lib/shipping/quote";

// POST /api/frete { cep, itens: [{ variantId, quantidade }] } -> QuoteResult
// Used by the product page, the cart and (phase 5) the checkout.
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      { ok: false, motivo: "cep_invalido" },
      { status: 400 },
    );
  }
  const parsed = quoteRequestBody.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, motivo: "cep_invalido" },
      { status: 400 },
    );
  }

  if (!(await allowAttempt([{ kind: "frete:ip", value: await clientIp() }]))) {
    return Response.json(
      { ok: false, motivo: "indisponivel" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const result = await quoteShipping(parsed.data);
  return Response.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
