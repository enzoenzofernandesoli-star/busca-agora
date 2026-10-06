import { z } from "zod";
import { onlyDigits } from "@/lib/br/cpf";

export function formatCep(value: string): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

export const cepSchema = z
  .string({ error: "CEP inválido" })
  .refine((value) => /^[\d\-\s]+$/.test(value), { error: "CEP inválido" })
  .transform(onlyDigits)
  .pipe(z.string().regex(/^\d{8}$/, { error: "CEP inválido" }));

export type ViaCepAddress = {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const responseSchema = z.object({
  cep: cepSchema,
  logradouro: z.string(),
  bairro: z.string(),
  localidade: z.string().min(1),
  uf: z
    .string()
    .regex(/^[a-zA-Z]{2}$/)
    .transform((value) => value.toUpperCase()),
  erro: z.union([z.boolean(), z.string()]).optional(),
});

export async function lookupCep(
  cep: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ViaCepAddress | null> {
  try {
    const parsed = cepSchema.safeParse(cep);
    if (!parsed.success) return null;
    const response = await fetchImpl(
      `https://viacep.com.br/ws/${parsed.data}/json/`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!response.ok) return null;
    const data: unknown = await response.json();
    const result = responseSchema.safeParse(data);
    if (
      !result.success ||
      result.data.erro === true ||
      result.data.erro === "true"
    )
      return null;
    return {
      cep: result.data.cep,
      rua: result.data.logradouro,
      bairro: result.data.bairro,
      cidade: result.data.localidade,
      uf: result.data.uf,
    };
  } catch {
    return null;
  }
}
