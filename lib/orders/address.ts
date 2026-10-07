import { z } from "zod";

// Shape of orders.endereco (copy of the address taken at checkout). The
// checkout (phase 5) writes it; readers parse it instead of trusting jsonb.
export const orderAddressSchema = z.object({
  cep: z.string(),
  rua: z.string(),
  numero: z.string(),
  complemento: z
    .string()
    .nullish()
    .transform((v) => v || null),
  bairro: z.string(),
  cidade: z.string(),
  uf: z.string(),
});

export type OrderAddress = z.infer<typeof orderAddressSchema>;

const EMPTY: OrderAddress = {
  cep: "",
  rua: "",
  numero: "",
  complemento: null,
  bairro: "",
  cidade: "",
  uf: "",
};

export function parseOrderAddress(value: unknown): OrderAddress {
  const parsed = orderAddressSchema.safeParse(value);
  return parsed.success ? parsed.data : EMPTY;
}
