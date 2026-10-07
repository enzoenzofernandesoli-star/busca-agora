import { reaisFromCents } from "@/lib/shipping/melhorenvio/schemas";
import type { ShippingItem } from "@/lib/shipping/types";

export function toQuoteProducts(items: ShippingItem[]): Array<{
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}> {
  if (!items.length) throw new RangeError("Shipping items must not be empty");
  return items.map((item) => {
    if (!Number.isSafeInteger(item.quantidade) || item.quantidade < 1)
      throw new RangeError("Quantity must be a positive integer");
    if (
      [item.pesoG, item.alturaCm, item.larguraCm, item.comprimentoCm].some(
        (value) => !Number.isFinite(value) || value <= 0,
      )
    )
      throw new RangeError("Weight and dimensions must be finite and positive");
    return {
      id: item.variantId,
      width: Math.max(11, Math.ceil(item.larguraCm)),
      height: Math.max(2, Math.ceil(item.alturaCm)),
      length: Math.max(16, Math.ceil(item.comprimentoCm)),
      weight: Math.max(1, Math.ceil(item.pesoG)) / 1000,
      insurance_value: reaisFromCents(item.precoCents),
      quantity: item.quantidade,
    };
  });
}

export function cartFingerprint(
  items: Pick<ShippingItem, "variantId" | "quantidade">[],
): string {
  return [...items]
    .sort((left, right) =>
      left.variantId < right.variantId
        ? -1
        : left.variantId > right.variantId
          ? 1
          : left.quantidade - right.quantidade,
    )
    .map((item) => `${item.variantId}:${item.quantidade}`)
    .join("|");
}
