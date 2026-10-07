import { z } from "zod";
import { reaisToCents } from "@/lib/catalog/filters";

export function slugify(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

const emptyToUndefined = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "")
    ? undefined
    : value;
const optionalId = z.preprocess(
  emptyToUndefined,
  z.uuid({ error: "Identificador inválido" }).optional(),
);
const priceMessage = "Informe o preço, ex.: 89,90";
function money(message: string) {
  return z
    .string({ error: message })
    .transform(reaisToCents)
    .pipe(
      z
        .number({ error: message })
        .int({ error: message })
        .nonnegative({ error: message }),
    );
}
function integer(min: number, max: number, message: string) {
  return z
    .string({ error: message })
    .trim()
    .regex(/^\d+$/, { error: message })
    .transform(Number)
    .pipe(
      z
        .number()
        .int({ error: message })
        .min(min, { error: message })
        .max(max, { error: message }),
    );
}
const optionalMoney = z
  .preprocess(emptyToUndefined, money(priceMessage).optional())
  .transform((value) => value ?? null);
const dimension = z
  .string({ error: "Informe a medida em cm, ex.: 2,5" })
  .trim()
  .regex(/^\d+(?:[.,]\d)?$/, { error: "Use no máximo uma casa decimal" })
  .transform((value) => Number(value.replace(",", ".")))
  .pipe(
    z
      .number()
      .positive({ error: "A medida precisa ser maior que zero" })
      .max(200, { error: "A medida máxima é 200 cm" }),
  );

export const variantSchema = z
  .object({
    id: optionalId,
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .min(1, { error: "Informe o SKU" })
      .max(40, { error: "SKU deve ter até 40 caracteres" })
      .regex(/^[A-Z0-9-]+$/, { error: "SKU aceita letras, números e hífen" }),
    nome: z
      .string()
      .trim()
      .max(60, { error: "Nome da variação deve ter até 60 caracteres" }),
    preco: money(priceMessage).refine((value) => value > 0, {
      error: priceMessage,
    }),
    precoDe: optionalMoney,
    custo: optionalMoney,
    estoque: integer(0, 99999, "Estoque precisa ser inteiro entre 0 e 99999"),
    pesoG: integer(1, 30000, "Peso em gramas"),
    alturaCm: dimension,
    larguraCm: dimension,
    comprimentoCm: dimension,
    ean: z
      .preprocess(
        emptyToUndefined,
        z
          .string()
          .trim()
          .regex(/^\d{8,14}$/, { error: "EAN precisa ter de 8 a 14 dígitos" })
          .optional(),
      )
      .transform((value) => value ?? null),
  })
  .superRefine((value, context) => {
    if (value.precoDe !== null && value.precoDe <= value.preco)
      context.addIssue({
        code: "custom",
        path: ["precoDe"],
        message: "O preço 'de' precisa ser maior que o preço de venda",
      });
  })
  .transform((value) => ({
    ...(value.id ? { id: value.id } : {}),
    sku: value.sku,
    nome: value.nome,
    preco_cents: value.preco,
    preco_de_cents: value.precoDe,
    custo_cents: value.custo,
    estoque: value.estoque,
    peso_g: value.pesoG,
    altura_cm: value.alturaCm,
    largura_cm: value.larguraCm,
    comprimento_cm: value.comprimentoCm,
    ean: value.ean,
  }));

export const productSchema = z
  .object({
    id: optionalId,
    nome: z
      .string()
      .trim()
      .min(3, { error: "Nome do produto deve ter pelo menos 3 caracteres" })
      .max(120, { error: "Nome do produto deve ter até 120 caracteres" }),
    slug: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(80, { error: "Endereço do produto deve ter até 80 caracteres" })
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
          error: "Use letras minúsculas, números e hífen no endereço",
        })
        .optional(),
    ),
    descricao: z
      .string()
      .max(5000, { error: "Descrição deve ter até 5000 caracteres" })
      .default(""),
    categoryId: z.uuid({ error: "Escolha a categoria" }),
    brandId: optionalId,
    ncm: z
      .string({ error: "NCM tem 8 dígitos, ex.: 8518.30.00" })
      .trim()
      .transform((value) => value.replace(/\./g, ""))
      .pipe(
        z
          .string()
          .regex(/^\d{8}$/, { error: "NCM tem 8 dígitos, ex.: 8518.30.00" }),
      ),
    cfop: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .regex(/^\d{4}$/, { error: "CFOP precisa ter 4 dígitos" })
        .default("5102"),
    ),
    origem: z.preprocess(
      emptyToUndefined,
      integer(0, 8, "Origem deve ser de 0 a 8").prefault("0"),
    ),
    ativo: z
      .unknown()
      .optional()
      .transform((value) => value === "on"),
    destaque: z
      .unknown()
      .optional()
      .transform((value) => value === "on"),
    variantes: z
      .array(variantSchema, { error: "Variações inválidas" })
      .min(1, { error: "Cadastre pelo menos uma variação" }),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();
    value.variantes.forEach((variant, index) => {
      if (seen.has(variant.sku))
        context.addIssue({
          code: "custom",
          path: ["variantes", index, "sku"],
          message: `SKU repetido: ${variant.sku}`,
        });
      seen.add(variant.sku);
    });
    if (!value.slug && !slugify(value.nome))
      context.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Informe um endereço com letras ou números",
      });
  })
  .transform((value) => ({
    ...(value.id ? { id: value.id } : {}),
    nome: value.nome,
    slug: value.slug ?? slugify(value.nome),
    descricao: value.descricao,
    category_id: value.categoryId,
    brand_id: value.brandId ?? null,
    ncm: value.ncm,
    cfop: value.cfop,
    origem: value.origem,
    ativo: value.ativo,
    destaque: value.destaque,
    variantes: value.variantes,
  }));

export function parseProductForm(formData: FormData) {
  const fields = Object.fromEntries(
    [
      "id",
      "nome",
      "slug",
      "descricao",
      "categoryId",
      "brandId",
      "ncm",
      "cfop",
      "origem",
      "ativo",
      "destaque",
    ].map((name) => [name, formData.get(name) ?? undefined]),
  );
  let variants: unknown;
  try {
    const raw = formData.get("variantes");
    variants = typeof raw === "string" ? JSON.parse(raw) : [];
  } catch {
    variants = null;
  }
  return productSchema.safeParse({ ...fields, variantes: variants });
}
