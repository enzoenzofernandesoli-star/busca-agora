import "server-only";

import { randomUUID } from "node:crypto";

import * as Sentry from "@sentry/nextjs";
import { cookies, headers } from "next/headers";

import { ORIGIN_COOKIE, parseOriginCookie } from "@/lib/attribution/origin";
import { createAdminClient } from "@/lib/db/admin";

import {
  deviceOf,
  isBot,
  isVisitorId,
  VISITOR_COOKIE,
  VISITOR_MAX_AGE,
} from "./visitor";

export type RequestContext = {
  visitorId: string;
  origem: ReturnType<typeof parseOriginCookie>;
  device: "mobile" | "desktop";
  bot: boolean;
};

/**
 * Visitor id (created and set when missing), origin and device of the
 * current request. Only in Route Handlers and Server Actions (it may set a
 * cookie).
 */
export async function requestContext(): Promise<RequestContext> {
  const jar = await cookies();
  const ua = (await headers()).get("user-agent");
  let visitorId = jar.get(VISITOR_COOKIE)?.value;
  if (!isVisitorId(visitorId)) {
    visitorId = randomUUID();
    jar.set(VISITOR_COOKIE, visitorId, {
      maxAge: VISITOR_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return {
    visitorId,
    origem: parseOriginCookie(jar.get(ORIGIN_COOKIE)?.value),
    device: deviceOf(ua),
    bot: isBot(ua),
  };
}

/**
 * add_to_cart / begin_checkout. Meant to run inside after(): a failure is
 * reported and never reaches the customer.
 */
export async function recordProductEvents(
  ctx: RequestContext,
  event: "add_to_cart" | "begin_checkout",
  itens: { productId: string; variantId: string | null }[],
  extra: { userId?: string | null; orderId?: string | null } = {},
): Promise<void> {
  if (ctx.bot || itens.length === 0) return;
  const { error } = await createAdminClient()
    .from("product_events")
    .insert(
      itens.map((i) => ({
        product_id: i.productId,
        variant_id: i.variantId,
        event,
        session_id: ctx.visitorId,
        user_id: extra.userId ?? null,
        order_id: extra.orderId ?? null,
        utm_source: ctx.origem?.utm_source ?? null,
        utm_medium: ctx.origem?.utm_medium ?? null,
        utm_campaign: ctx.origem?.utm_campaign ?? null,
        ref: ctx.origem?.ref ?? null,
        device: ctx.device,
      })),
    );
  if (error)
    Sentry.captureException(new Error(`product_events: ${error.message}`));
}
