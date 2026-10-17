import { z } from "zod";

const identifier = z.number().int().positive().safe();
// Amounts in reais. The API sends numbers, but one official example shows a
// decimal string: both are accepted, anything else is refused.
const money = z
  .union([
    z.number(),
    z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .transform(Number),
  ])
  .pipe(z.number().finite().nonnegative());

export const preferenceResponse = z
  .object({
    id: z.string().min(1),
    init_point: z.url({ protocol: /^https$/ }),
    sandbox_init_point: z.url({ protocol: /^https$/ }),
  })
  .passthrough();

export const paymentResponse = z
  .object({
    id: identifier,
    // Unknown future states remain strings; callers must explicitly check approved.
    status: z.string().min(1),
    status_detail: z.string(),
    external_reference: z.string().nullable(),
    transaction_amount: money,
    currency_id: z.literal("BRL"),
    payment_method_id: z.string().min(1),
    payment_type_id: z.string().min(1),
    installments: z.number().int().nonnegative().safe(),
    date_approved: z.string().nullable(),
  })
  .passthrough();

export const refundResponse = z
  .object({
    id: identifier,
    status: z.string().min(1),
    amount: money,
  })
  .passthrough();

export const webhookBody = z
  .object({
    type: z.string().min(1).optional(),
    topic: z.string().min(1).optional(),
    action: z.string().min(1).optional(),
    data: z
      .object({
        id: z.union([z.string().trim().min(1), identifier]).transform(String),
      })
      .passthrough(),
  })
  .passthrough()
  .refine((body) => Boolean(body.type || body.topic), {
    message: "Webhook type or topic is required",
  });

export type PreferenceResponse = z.infer<typeof preferenceResponse>;
export type PaymentResponse = z.infer<typeof paymentResponse>;
export type RefundResponse = z.infer<typeof refundResponse>;
export type WebhookBody = z.infer<typeof webhookBody>;

/** Round decimal reais to the nearest cent (half up), without binary multiplication. */
export function toCents(reais: number): number {
  if (!Number.isFinite(reais) || reais < 0)
    throw new RangeError("Amount must be finite and nonnegative");
  const [coefficient = "0", exponentText = "0"] = reais
    .toString()
    .toLowerCase()
    .split("e");
  const [whole = "0", fraction = ""] = coefficient.split(".");
  const digits = BigInt(whole + fraction);
  const shift = Number(exponentText) - fraction.length + 2;
  let cents: bigint;
  if (shift >= 0) cents = digits * 10n ** BigInt(shift);
  else {
    const divisor = 10n ** BigInt(-shift);
    cents = (digits + divisor / 2n) / divisor;
  }
  if (cents > BigInt(Number.MAX_SAFE_INTEGER))
    throw new RangeError("Amount exceeds safe integer cents");
  return Number(cents);
}
