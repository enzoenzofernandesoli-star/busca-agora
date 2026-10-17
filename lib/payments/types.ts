/**
 * Our payment interface (CLAUDE.md rule 9): the store only talks to this.
 * Today: Mercado Pago Checkout Pro, plus a fake for development and tests.
 */

export type CheckoutRequest = {
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
  expiresAt: Date;
};

export type CheckoutSession = { preferenceId: string; url: string };

export type PaymentInfo = {
  id: string;
  /** Mercado Pago status: approved, pending, in_process, rejected, ... */
  status: string;
  /** Our order id (external_reference), or null. */
  externalReference: string | null;
  valorCents: number;
  moeda: string;
  metodo: "pix" | "card" | "boleto";
  parcelas: number;
  raw: unknown;
};

export interface PaymentProvider {
  readonly name: "mercadopago" | "fake";
  createCheckout(order: CheckoutRequest): Promise<CheckoutSession>;
  /** Always read from the provider's API: never trust the webhook body. */
  getPayment(paymentId: string): Promise<PaymentInfo>;
  refund(paymentId: string): Promise<void>;
  /** Secret used to sign webhooks for this provider. */
  webhookSecret(): string;
}
