import { z } from "zod";
import { onlyDigits } from "@/lib/br/cpf";

export function formatTelefone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length < 3) return `(${digits}`;
  const areaCode = digits.slice(0, 2);
  const local = digits.slice(2);
  const prefixLength = digits.length > 10 ? 5 : 4;
  return `(${areaCode}) ${local.slice(0, prefixLength)}${local.length > prefixLength ? `-${local.slice(prefixLength)}` : ""}`;
}

export const telefoneSchema = z
  .string({ error: "Telefone inválido" })
  .refine((value) => /^[\d()\-\s]+$/.test(value), {
    error: "Telefone inválido",
  })
  .transform(onlyDigits)
  .refine(
    (value) =>
      /^\d{10,11}$/.test(value) &&
      Number(value.slice(0, 2)) >= 11 &&
      Number(value.slice(0, 2)) <= 99 &&
      (value.length === 10 || value[2] === "9"),
    { error: "Telefone inválido" },
  );
