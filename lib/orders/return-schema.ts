import { z } from "zod";
import type { Database } from "@/lib/db/types";
type OrderStatus = Database["public"]["Enums"]["order_status"];
export const RETURN_REASONS = {
  arrependimento: "Desisti da compra",
  defeito: "Produto com defeito",
  errado: "Recebi o produto errado",
  avariado: "Chegou danificado",
  outro: "Outro motivo",
} as const;
export const RETURN_WINDOW_DAYS = 7;
export function canRequestReturn(
  status: OrderStatus,
  entregueEm: Date | null,
  agora: Date,
): boolean {
  if (status !== "delivered" || !entregueEm) return false;
  const elapsed = agora.getTime() - entregueEm.getTime();
  return (
    Number.isFinite(elapsed) &&
    elapsed >= 0 &&
    elapsed <= RETURN_WINDOW_DAYS * 86400000
  );
}
export const returnSchema = z.object({
  numero: z
    .string({ error: "Número do pedido inválido" })
    .regex(/^BA-\d{6,9}$/, { error: "Número do pedido inválido" }),
  tipo: z.enum(["troca", "devolucao"], { error: "Escolha troca ou devolução" }),
  motivo: z.enum(
    Object.keys(RETURN_REASONS) as [
      keyof typeof RETURN_REASONS,
      ...(keyof typeof RETURN_REASONS)[],
    ],
    { error: "Escolha o motivo" },
  ),
  detalhe: z
    .string({
      error: "Conte em poucas palavras o que aconteceu (mínimo 10 letras)",
    })
    .trim()
    .min(10, {
      error: "Conte em poucas palavras o que aconteceu (mínimo 10 letras)",
    })
    .max(1000, { error: "Use no máximo 1000 caracteres" }),
});
