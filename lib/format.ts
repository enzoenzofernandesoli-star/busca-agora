const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Formats an integer amount of cents as BRL (8990 -> "R$ 89,90").
 * Money is always integer cents; anything else is a bug upstream.
 */
export function formatBRL(cents: number): string {
  if (!Number.isSafeInteger(cents)) {
    throw new TypeError(
      "formatBRL espera centavos inteiros (ex.: 8990 = R$ 89,90).",
    );
  }
  return brl.format(cents / 100);
}
