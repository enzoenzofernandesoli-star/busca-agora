import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/lib/env";
import { fakeIntegrationsAllowed } from "@/lib/payments/policy";

import { simulatePayment } from "./actions";

export const metadata: Metadata = {
  title: "Pagamento de teste",
  robots: { index: false, follow: false },
};

const resultados = [
  { value: "approved", label: "Aprovar pagamento" },
  { value: "pending", label: "Deixar pendente" },
  { value: "rejected", label: "Recusar" },
  { value: "wrongamount", label: "Pagar valor errado" },
] as const;

// Stand-in for the Mercado Pago page while there is no account (phase 5).
// Never in production.
export default async function PagamentoTestePage(
  props: PageProps<"/dev/pagamento-teste">,
) {
  if (!env.PAYMENTS_FAKE || !fakeIntegrationsAllowed()) notFound();
  const params = await props.searchParams;
  const ref = typeof params.ref === "string" ? params.ref : "";
  const pedido = typeof params.pedido === "string" ? params.pedido : "";

  return (
    <section className="mx-auto flex w-full max-w-[520px] flex-col gap-5 rounded-[22px] border-2 border-dashed border-ultramar bg-white p-6 md:rounded-[28px] md:p-10">
      <p className="m-0 text-[13px] font-bold tracking-[.1em] text-ultramar uppercase">
        Mercado Pago simulado
      </p>
      <h1 className="m-0 font-display text-[28px] font-extrabold text-noite">
        Pagamento de teste · {pedido}
      </h1>
      <p className="m-0 text-[15px] text-texto-2">
        Nenhum dinheiro de verdade. O botão manda um aviso assinado para o
        webhook da loja, igual ao Mercado Pago.
      </p>
      <div className="flex flex-col gap-3">
        {resultados.map((r) => (
          <form key={r.value} action={simulatePayment}>
            <input type="hidden" name="ref" value={ref} />
            <input type="hidden" name="pedido" value={pedido} />
            <input type="hidden" name="resultado" value={r.value} />
            <button
              type="submit"
              className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[14px] bg-ultramar font-display text-base font-bold text-white hover:bg-ultramar-700"
            >
              {r.label}
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
