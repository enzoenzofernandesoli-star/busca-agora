import { z } from "zod";

import { cepSchema } from "@/lib/br/cep";
import { cpfSchema } from "@/lib/br/cpf";

// Fields posted by the checkout form (contract in lib/checkout/types.ts).
// Prices and totals are NOT here: the server reads them from the database.

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

const blankToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;
const text = (max: number, message: string) =>
  z.string({ error: message }).trim().min(1, { error: message }).max(max);

export const newAddressSchema = z.object({
  cep: cepSchema,
  rua: text(160, "Informe a rua."),
  numero: text(20, "Informe o número (ou S/N)."),
  complemento: z.preprocess(
    blankToUndefined,
    z.string().trim().max(80).optional(),
  ),
  bairro: text(80, "Informe o bairro."),
  cidade: text(80, "Informe a cidade."),
  uf: z.enum(UFS, { error: "Escolha o estado." }),
  salvarEndereco: z.preprocess((v) => v === "on", z.boolean()),
});

export const checkoutSchema = z.object({
  enderecoId: z.union([z.literal("novo"), z.uuid()], {
    error: "Escolha o endereço de entrega.",
  }),
  cpf: cpfSchema,
  freteServicoId: z
    .string({ error: "Escolha como quer receber." })
    .regex(/^\d+$/, { error: "Escolha como quer receber." }),
  pagamento: z.enum(["pix", "card"], {
    error: "Escolha a forma de pagamento.",
  }),
});

/** Pix must be paid in 30 min (CLAUDE.md section 5); card gets 1 hour. */
export const PAYMENT_WINDOW = {
  pix: "30 minutes",
  card: "60 minutes",
} as const;
export const PAYMENT_WINDOW_MS = {
  pix: 30 * 60 * 1000,
  card: 60 * 60 * 1000,
} as const;
