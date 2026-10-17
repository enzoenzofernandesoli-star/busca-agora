import { z } from "zod";
import { toCents } from "./schemas";

export type PreferenceOrder = {
  id: string;
  numero: string;
  totalCents: number;
  freteCents: number;
  freteServico: string;
  pagamento: "pix" | "card";
  cliente: { nome: string; email: string; cpf: string };
  itens: {
    sku: string;
    nome: string;
    quantidade: number;
    precoCents: number;
  }[];
};

const cents = z.number().int().nonnegative().safe();
const orderSchema = z.object({
  id: z.string().min(1),
  numero: z.string().min(1),
  totalCents: cents.positive(),
  freteCents: cents,
  freteServico: z.string().min(1),
  pagamento: z.enum(["pix", "card"]),
  cliente: z.object({
    nome: z.string().trim().min(1),
    email: z.email(),
    cpf: z.string().regex(/^\d{11}$/),
  }),
  itens: z
    .array(
      z.object({
        sku: z.string().min(1),
        nome: z.string().min(1),
        quantidade: z.number().int().positive().safe(),
        precoCents: cents.positive(),
      }),
    )
    .min(1),
});
const optionsSchema = z.object({
  siteUrl: z.url({ protocol: /^https?$/ }),
  webhookUrl: z.url({ protocol: /^https?$/ }),
  expiresAt: z.date(),
});

function toReais(value: number): number {
  const reais = value / 100;
  if (toCents(reais) !== value)
    throw new RangeError(
      "Amount cannot be represented in reais without losing cents",
    );
  return reais;
}

/** Pure Checkout Pro payload builder. All amounts originate from the server's order. */
export function buildPreferenceBody(
  order: PreferenceOrder,
  opts: { siteUrl: string; webhookUrl: string; expiresAt: Date },
): Record<string, unknown> {
  const parsed = orderSchema.parse(order);
  const options = optionsSchema.parse(opts);
  let total = BigInt(parsed.freteCents);
  for (const item of parsed.itens)
    total += BigInt(item.precoCents) * BigInt(item.quantidade);
  if (total !== BigInt(parsed.totalCents))
    throw new Error("Order items plus shipping must match totalCents");

  const items = parsed.itens.map((item) => ({
    id: item.sku,
    title: item.nome,
    quantity: item.quantidade,
    unit_price: toReais(item.precoCents),
    currency_id: "BRL",
  }));
  // Shipping is an explicit item: no Mercado Envios setup or duplicated shipment charge.
  if (parsed.freteCents > 0)
    items.push({
      id: "shipping",
      title: `Frete · ${parsed.freteServico}`,
      quantity: 1,
      unit_price: toReais(parsed.freteCents),
      currency_id: "BRL",
    });
  const returnUrl = `${options.siteUrl.replace(/\/+$/, "")}/pedido/${encodeURIComponent(parsed.numero)}/obrigado`;
  const [name, ...surname] = parsed.cliente.nome.split(/\s+/);
  // Checkout Pro always retains account balance; its API cannot exclude account_money.
  const excluded =
    parsed.pagamento === "pix"
      ? [
          "credit_card",
          "debit_card",
          "prepaid_card",
          "ticket",
          "atm",
          "digital_currency",
        ]
      : [
          "bank_transfer",
          "debit_card",
          "prepaid_card",
          "ticket",
          "atm",
          "digital_currency",
        ];

  return {
    external_reference: parsed.id,
    items,
    payer: {
      name,
      ...(surname.length ? { surname: surname.join(" ") } : {}),
      email: parsed.cliente.email,
      identification: { type: "CPF", number: parsed.cliente.cpf },
    },
    back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
    auto_return: "approved",
    notification_url: options.webhookUrl,
    payment_methods: {
      excluded_payment_types: excluded.map((id) => ({ id })),
      ...(parsed.pagamento === "card"
        ? { excluded_payment_methods: [{ id: "pix" }] }
        : {}),
      installments: parsed.pagamento === "card" ? 12 : 1,
    },
    expires: true,
    expiration_date_to: options.expiresAt.toISOString(),
    statement_descriptor: "BUSCAAGORA",
  };
}
