/** Keeps only 0-9. No zod here: client components import this. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}
