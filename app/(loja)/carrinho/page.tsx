import type { Metadata } from "next";
import Link from "next/link";

import { CartCountSync } from "@/components/carrinho/cart-count-sync";
import { CartLine } from "@/components/carrinho/cart-line";
import { CartSummary } from "@/components/carrinho/cart-summary";
import { EmptyCart } from "@/components/carrinho/empty-cart";
import { CheckoutBar } from "@/components/carrinho/checkout-bar";
import { CheckoutSteps } from "@/components/carrinho/checkout-steps";
import { Marquee } from "@/components/loja/marquee";
import { ShippingQuote } from "@/components/loja/shipping-quote";
import { removeFromCart, setCartQuantity } from "@/lib/cart/actions";
import { getCart } from "@/lib/cart/server";

export const metadata: Metadata = {
  title: "Carrinho",
  robots: { index: false, follow: false },
};

// Always fresh: prices and stock come from the database on every visit.
export default async function CarrinhoPage() {
  const cart = await getCart();
  const disponiveis = cart.linhas.filter((l) => l.disponivel);

  return (
    <>
      <CartCountSync count={cart.quantidadeItens} />
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="ba-entra m-0 font-display text-[34px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">
            Carrinho
          </h1>
          {cart.quantidadeItens > 0 ? (
            <span
              style={{ animationDelay: "120ms" }}
              className="ba-entra inline-flex rounded-full bg-noite px-3 py-1 text-[13px] font-bold text-white"
            >
              {cart.quantidadeItens === 1
                ? "1 item"
                : `${cart.quantidadeItens} itens`}
            </span>
          ) : null}
        </div>
        {cart.linhas.length > 0 ? <CheckoutSteps /> : null}
      </header>

      {cart.linhas.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <section
            aria-label="Itens do carrinho"
            className="flex min-w-0 flex-1 flex-col gap-3"
          >
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {cart.linhas.map((linha) => (
                <li key={linha.id}>
                  <CartLine
                    item={linha}
                    setQuantity={setCartQuantity}
                    remove={removeFromCart}
                  />
                </li>
              ))}
            </ul>
            <Link href="/" className="self-start text-[15px] font-bold">
              Continuar comprando
            </Link>
          </section>

          <div className="md:sticky md:top-6 md:w-[380px] md:flex-none">
            <CartSummary
              subtotalCents={cart.subtotalCents}
              quantidadeItens={cart.quantidadeItens}
              economiaCents={cart.economiaCents}
            >
              {disponiveis.length > 0 ? (
                <>
                  <ShippingQuote
                    itens={disponiveis.map((l) => ({
                      variantId: l.variantId,
                      quantidade: Math.min(l.quantidade, l.estoque),
                    }))}
                  />
                  <Link
                    id="carrinho-continuar"
                    href="/checkout"
                    className="flex min-h-14 items-center justify-center rounded-2xl bg-ultramar font-display text-[17px] font-bold text-white no-underline hover:bg-ultramar-700 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar"
                  >
                    Continuar para o pagamento
                  </Link>
                </>
              ) : (
                <p className="m-0 text-[15px] text-rosa-ink">
                  Os itens do carrinho esgotaram. Remova-os para continuar.
                </p>
              )}
            </CartSummary>
          </div>
        </div>
      )}
      {cart.linhas.length > 0 ? (
        <Marquee
          itens={[
            "Nota fiscal em todo pedido",
            "Despacho em até 24 h",
            "Troca em até 7 dias",
            "Pix aprovado na hora",
            "Buscou? Tá aqui.",
          ]}
          className="-mx-4 w-[calc(100%+2rem)] md:mx-0 md:w-full md:rounded-[22px]"
        />
      ) : null}
      {disponiveis.length > 0 ? (
        <CheckoutBar subtotalCents={cart.subtotalCents} />
      ) : null}
    </>
  );
}
