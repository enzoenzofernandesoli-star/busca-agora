import { z } from "zod";
export function normalizeOrderNumber(v: string): string | null {
  // format_order_number keeps 6 digits minimum and grows past BA-999999.
  const match = /^#?\s*(?:BA[\s-]*)?(\d{1,9})$/i.exec(v.trim());
  return match?.[1] ? `BA-${match[1].padStart(6, "0")}` : null;
}
const numberMessage = "Confira o número do pedido, ex.: BA-000123";
const emailMessage = "Informe o e-mail usado na compra";
export const trackingSchema = z.object({
  numero: z
    .string({ error: numberMessage })
    .transform(normalizeOrderNumber)
    .refine((value): value is string => value !== null, {
      error: numberMessage,
    })
    .transform((value) => value as string),
  email: z
    .string({ error: emailMessage })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: emailMessage })),
});
