import { CheckoutSteps as CartCheckoutSteps } from "@/components/carrinho/checkout-steps";

export function CheckoutSteps() {
  return (
    <CartCheckoutSteps
      currentStep={1}
      labels={["Carrinho", "Entrega e pagamento", "Confirmação"]}
    />
  );
}
