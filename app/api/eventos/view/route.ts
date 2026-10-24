import * as Sentry from "@sentry/nextjs";
import { after } from "next/server";
import { z } from "zod";

import { allowAttempt, clientIp } from "@/lib/auth/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/db/admin";
import { requestContext } from "@/lib/metrics/events";

// POST /api/eventos/view { productId } from the product page's beacon. The
// page stays static (cached); the server decides here whether the view
// counts: robots are ignored and the same visitor + product counts once
// every 30 minutes (record_product_view). Answers 204 at once and records
// after the response.
const bodySchema = z.object({ productId: z.uuid() });
const MAX_BODY = 256;

/** Browsers send Origin on POST: only our own pages may count a view. */
function foreignOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== new URL(request.url).host;
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  // Cheap refusals first: wrong origin, oversized body.
  if (foreignOrigin(request)) return new Response(null, { status: 403 });
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY) return new Response(null, { status: 413 });
  let productId: string;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return new Response(null, { status: 413 });
    productId = bodySchema.parse(JSON.parse(raw)).productId;
  } catch {
    return new Response(null, { status: 400 });
  }
  const ctx = await requestContext();
  if (ctx.bot) return new Response(null, { status: 204 });
  // Per-IP ceiling, independent of the visitor cookie the sender controls.
  // Over it: silently not counted (204), so a script learns nothing.
  if (
    !(await allowAttempt([{ kind: "metricas:ip", value: await clientIp() }]))
  ) {
    return new Response(null, { status: 204 });
  }
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
