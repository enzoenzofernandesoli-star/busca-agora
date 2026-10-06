import { z } from "zod";

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string): boolean {
  if (!/^[\d.\-\s]+$/.test(value)) return false;
  const digits = onlyDigits(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let index = 0; index < length; index++) {
      sum += Number(digits[index]) * (length + 1 - index);
    }
    const remainder = sum % 11;
    if (Number(digits[length]) !== (remainder < 2 ? 0 : 11 - remainder))
      return false;
  }
  return true;
}

export function formatCpf(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
}

export const cpfSchema = z
  .string({ error: "CPF inválido" })
  .refine(isValidCpf, { error: "CPF inválido" })
  .transform(onlyDigits);
