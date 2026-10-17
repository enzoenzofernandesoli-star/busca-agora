import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { requireUser } from "@/lib/auth/session";
import { getCart } from "@/lib/cart/server";
import type { CheckoutData } from "@/lib/checkout/types";
import { createClient } from "@/lib/db/server";
import { placeOrder } from "@/lib/orders/checkout";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

// Always fresh: cart, prices, stock and addresses are read on every visit.
// Prices shown here are display only; placeOrder recalculates everything.
export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const cart = await getCart();
  const linhas = cart.linhas.filter((l) => l.disponivel);
  if (linhas.length === 0 || linhas.length !== cart.linhas.length) {
    redirect("/carrinho");
  }

  const supabase = await createClient();
  const [{ data: perfil }, { data: enderecos }] = await Promise.all([
    supabase
      .from("profiles")
      .select("cpf, marketing_opt_in")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("addresses")
      .select(
        "id, cep, rua, numero, complemento, bairro, cidade, uf, principal",
      )
      .eq("user_id", user.id)
      .order("principal", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const data: CheckoutData = {
    nome: user.nome,
    cpf: perfil?.cpf ?? null,
    enderecos: enderecos ?? [],
    itens: linhas.map((l) => ({
      variantId: l.variantId,
      nome: l.nome,
      variante: l.varianteNome || null,
      quantidade: Math.min(l.quantidade, l.estoque),
      precoCents: l.precoCents,
      imagemUrl: l.imagemUrl,
      categoria: l.categoria,
    })),
    subtotalCents: cart.subtotalCents,
    marketingOptIn: perfil?.marketing_opt_in ?? false,
  };

  return (
    <>
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="ba-entra m-0 font-display text-[34px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">
          Finalizar compra
        </h1>
        <CheckoutSteps />
      </header>
      <CheckoutForm data={data} action={placeOrder} />
    </>
  );
}
