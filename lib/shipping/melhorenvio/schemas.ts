import { z } from "zod";
import type { ShippingOption } from "@/lib/shipping/types";

const postalCodeSchema = z.object({ postal_code: z.string().regex(/^\d{8}$/) });
const dimensionSchema = z.number().int().positive();

export const quoteRequestSchema = z.object({
  from: postalCodeSchema,
  to: postalCodeSchema,
  products: z
    .array(
      z.object({
        id: z.string().min(1),
        width: dimensionSchema,
        height: dimensionSchema,
        length: dimensionSchema,
        weight: z.number().positive(),
        insurance_value: z.number().nonnegative(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  options: z.object({ receipt: z.boolean(), own_hand: z.boolean() }).optional(),
});

const daysSchema = z.number().int().nonnegative();
const rangeSchema = z
  .object({ min: daysSchema, max: daysSchema })
  .refine((value) => value.min <= value.max);

const quoteServiceSchema = z
  .object({
    id: z.number().int().nonnegative(),
    name: z.string().min(1),
    company: z
      .object({
        id: z.number().int().nonnegative(),
        name: z.string().min(1),
        picture: z.string().nullable().optional(),
      })
      .passthrough(),
    price: z.string().nullable().optional(),
    custom_price: z.string().nullable().optional(),
    delivery_time: daysSchema.nullable().optional(),
    custom_delivery_time: daysSchema.nullable().optional(),
    delivery_range: rangeSchema.nullable().optional(),
    custom_delivery_range: rangeSchema.nullable().optional(),
    error: z.string().optional(),
  })
  .passthrough();

export const quoteResponseSchema = z.array(quoteServiceSchema);

function centsFromPrice(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : null;
}

export function toShippingOptions(response: unknown): ShippingOption[] {
  if (!Array.isArray(response)) return [];
  // Each service is validated on its own: one odd entry (a new carrier, a
  // field that changed) must not hide the options that are fine.
  return response
    .flatMap((raw): ShippingOption[] => {
      const parsed = quoteServiceSchema.safeParse(raw);
      if (!parsed.success) return [];
      const service = parsed.data;
      if (service.error !== undefined) return [];
      const price = service.custom_price ?? service.price;
      const days = service.custom_delivery_time ?? service.delivery_time;
      if (
        price === undefined ||
        price === null ||
        days === undefined ||
        days === null
      )
        return [];
      const cents = centsFromPrice(price);
      if (cents === null) return [];
      const range = service.custom_delivery_range ?? service.delivery_range;
      return [
        {
          servicoId: String(service.id),
          servico: service.name,
          transportadora: service.company.name,
          precoCents: cents,
          prazoDias: days,
          ...(range ? { prazoMin: range.min, prazoMax: range.max } : {}),
        },
      ];
    })
    .sort(
      (left, right) =>
        left.precoCents - right.precoCents || left.prazoDias - right.prazoDias,
    );
}

export function reaisFromCents(cents: number): number {
  if (!Number.isSafeInteger(cents) || cents < 0)
    throw new TypeError(
      "Insurance value must be a non-negative safe integer in cents",
    );
  return cents / 100;
}
