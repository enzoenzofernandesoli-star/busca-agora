import { onlyDigits } from "@/lib/br/digits";

// CEP helpers without zod, for client components (the header CEP dialog is
// on every page; zod would add ~60 KB to it). Same rule as cepSchema.

export function formatCep(value: string): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

/** The 8 digits of a valid CEP ("01310-100" or "01310100"), else null. */
export function parseCep(value: string): string | null {
  if (!/^[\d\-\s]+$/.test(value)) return null;
  const digits = onlyDigits(value);
  return /^\d{8}$/.test(digits) ? digits : null;
}
