import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusPoller } from "@/components/checkout/order-status-poller";
import { BoxIcon, ShieldCheckIcon, ReceiptIcon } from "@/components/loja/icons";
import { requireUser } from "@/lib/auth/session";
import { formatCep } from "@/lib/br/cep-format";
import { formatBRL } from "@/lib/format";
import { getMyOrder } from "@/lib/orders/customer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seu pedido | Busca Agora",
  robots: { index: false, follow: false },
};
const button =
  "inline-flex min-h-11 items-center justify-center rounded-[14px] bg-ultramar px-6 py-3 font-display font-bold text-white hover:bg-ultramar-700";

export default async function ObrigadoPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const user = await requireUser(
    `/pedido/${encodeURIComponent(numero)}/obrigado`,
  );
  const order = await getMyOrder(user.id, numero);
  if (!order) notFound();
  const pending = order.status === "pending_payment";
  const canceled = order.status === "canceled";
  const refunded = order.status === "refunded";
  const Icon = pending
    ? ReceiptIcon
    : canceled || refunded
      ? BoxIcon
      : ShieldCheckIcon;
  const title = pending
    ? "Falta pouco!"
    : canceled
      ? "Pedido cancelado"
      : refunded
        ? "Pagamento estornado"
        : "Pedido confirmado!";

  return (
    <div className="mx-auto w-full max-w-[980px] font-sans text-noite">
      <article className="motion-safe:ba-entra overflow-hidden rounded-[28px] border border-borda bg-white">
        <div
          className={`h-3 ${canceled || refunded ? "bg-noite" : "bg-ultramar"}`}
        />
        <div className="flex flex-col gap-6 p-5 sm:p-8 lg:p-10">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-[16px] bg-lima">
              <Icon size={30} />
            </span>
            <div>
              <p className="text-sm font-bold text-texto-2">
                Pedido {order.numero}
              </p>
              <h1 className="mt-1 font-display text-[28px] leading-tight font-extrabold sm:text-[36px]">
                {title}
              </h1>
            </div>
          </header>
          {pending ? (
            <>
              <p className="text-base leading-relaxed text-texto-2">
                Assim que o Mercado Pago confirmar, esta página atualiza sozinha
              </p>
              <dl className="grid gap-4 rounded-[16px] bg-fundo p-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-texto-2">Total</dt>
                  <dd className="mt-1 font-display text-[28px] font-extrabold">
                    {formatBRL(order.totalCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-texto-2">Forma de pagamento</dt>
                  <dd className="mt-2 font-bold">
                    {order.metodo === "pix"
                      ? "Pix"
                      : order.metodo === "card"
                        ? "Cartão de crédito"
                        : "Boleto"}
                  </dd>
                </div>
              </dl>
              <OrderStatusPoller numero={order.numero} status={order.status} />
            </>
          ) : canceled ? (
            <>
              <p className="text-texto-2">O pagamento não foi feito a tempo.</p>
              <Link href="/carrinho" className={`${button} self-start`}>
                Voltar ao carrinho
              </Link>
            </>
          ) : (
            <>
              {refunded ? (
                <p className="text-texto-2">
                  Consulte os detalhes do estorno nos seus pedidos.
                </p>
              ) : (
                <p className="text-texto-2">
                  Despacho em até 24 h depois do pagamento
                </p>
              )}
              <section aria-labelledby="order-items">
                <h2
                  id="order-items"
                  className="mb-4 font-display text-xl font-bold"
                >
                  Resumo do pedido
                </h2>
                <ul className="divide-y divide-borda">
                  {order.itens.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-4 py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-bold break-words">{item.nome}</p>
                        <p className="mt-1 text-sm text-texto-2">
                          {item.quantidade}{" "}
                          {item.quantidade === 1 ? "unidade" : "unidades"}
                        </p>
                      </div>
                      <span className="shrink-0 font-display font-bold">
                        {formatBRL(item.preco_cents * item.quantidade)}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-3 border-t border-borda pt-4">
                  <div className="flex justify-between gap-3">
                    <dt className="text-texto-2">Subtotal</dt>
                    <dd>{formatBRL(order.subtotalCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-texto-2">
                      Frete
                      {order.freteServico ? ` · ${order.freteServico}` : ""}
                    </dt>
                    <dd>{formatBRL(order.freteCents)}</dd>
                  </div>
                  {order.descontoCents > 0 && (
                    <div className="flex justify-between gap-3">
                      <dt>Desconto</dt>
                      <dd>− {formatBRL(order.descontoCents)}</dd>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-3 border-t border-borda pt-4 font-display font-bold">
                    <dt>Total</dt>
                    <dd className="text-[28px]">
                      {formatBRL(order.totalCents)}
                    </dd>
                  </div>
                </dl>
              </section>
              <section
                className="rounded-[16px] bg-fundo p-5"
                aria-labelledby="delivery-address"
              >
                <h2
                  id="delivery-address"
                  className="mb-2 font-display text-lg font-bold"
                >
                  Endereço de entrega
                </h2>
                <p className="break-words">
                  {order.endereco.rua}, {order.endereco.numero}
                  {order.endereco.complemento
                    ? ` · ${order.endereco.complemento}`
                    : ""}
                </p>
                <p className="text-texto-2">
                  {order.endereco.bairro} · {order.endereco.cidade} –{" "}
                  {order.endereco.uf}
                </p>
                <p className="text-texto-2">
                  CEP {formatCep(order.endereco.cep)}
                </p>
              </section>
            </>
          )}
          {!canceled && (
            <nav
              aria-label="Próximos passos"
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Link
                className={button}
                href={`/conta/pedidos/${encodeURIComponent(order.numero)}`}
              >
                Ver meu pedido
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-borda-forte px-6 py-3 font-bold text-ultramar"
                href="/"
              >
                Continuar comprando
              </Link>
            </nav>
          )}
        </div>
      </article>
    </div>
  );
}
