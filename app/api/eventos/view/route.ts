import * as Sentry from "@sentry/nextjs";
import { after } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/db/admin";
import { requestContext } from "@/lib/metrics/events";

// POST /api/eventos/view { productId } from the product page's beacon. The
// page stays static (cached); the server decides here whether the view
// counts: robots are ignored and the same visitor + product counts once
// every 30 minutes (record_product_view). Answers 204 at once and records
// after the response.
const bodySchema = z.object({ productId: z.uuid() });

export async function POST(request: Request) {
  let productId: string;
  try {
    productId = bodySchema.parse(JSON.parse(await request.text())).productId;
  } catch {
    return new Response(null, { status: 400 });
  }
  const ctx = await requestContext();
  if (ctx.bot) return new Response(null, { status: 204 });
  const user = await getCurrentUser();

  after(async () => {
    const { error } = await createAdminClient().rpc("record_product_view", {
      p_product_id: productId,
      p_session_id: ctx.visitorId,
      // null for visitors (the generated type misses the SQL null).
      p_user_id: (user?.id ?? null) as string,
      p_origem: ctx.origem ?? {},
      p_device: ctx.device,
    });
    if (error)
      Sentry.captureException(new Error(`product view: ${error.message}`));
  });
  return new Response(null, { status: 204 });
}
