import type { Address } from "@/components/conta/address-card";

/**
 * Contracts of the checkout (phase 5). The page (Claude Code) loads these
 * on the server; the form components (Codex C4) only render them and post
 * the fields below to the placeOrder Server Action. Prices here are for
 * display only: the server recalculates everything when placing the order.
 */

export type CheckoutItem = {
  variantId: string;
  nome: string;
  /** Variant name ("Preto", "30 ml"), or null when the product has one. */
  variante: string | null;
  quantidade: number;
  precoCents: number;
  imagemUrl: string | null;
  categoria: "eletronicos" | "cosmeticos";
};

export type CheckoutData = {
  nome: string;
  /** Digits only, from the profile; null when the customer has none yet. */
  cpf: string | null;
  enderecos: Address[];
  itens: CheckoutItem[];
  subtotalCents: number;
  /** Already accepted marketing: the optional box is not shown again. */
  marketingOptIn: boolean;
};

export type PaymentChoice = "pix" | "card";

/**
 * Field names posted to placeOrder (FormData):
 * - enderecoId: id of a saved address, or "novo"
 * - when "novo": cep, rua, numero, complemento, bairro, cidade, uf,
 *   salvarEndereco ("on" to keep it in the account)
 * - cpf: 11 digits (formatting is stripped on the server)
 * - freteServicoId: ShippingOption.servicoId chosen by the customer
 * - pagamento: PaymentChoice
 * - marketing: "on" when the optional marketing box was checked
 * On success the action redirects to the Mercado Pago page; on error it
 * returns FormState (message + fieldErrors keyed by the names above).
 */
export const CHECKOUT_FIELDS = [
  "enderecoId",
  "cep",
  "rua",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "uf",
  "salvarEndereco",
  "cpf",
  "freteServicoId",
  "pagamento",
  "marketing",
] as const;
