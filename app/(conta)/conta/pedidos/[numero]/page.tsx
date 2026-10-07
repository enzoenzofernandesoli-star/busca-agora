import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/admin/status-badge";
import { OrderProgress } from "@/components/conta/order-progress";
import { OrderTracking } from "@/components/conta/order-tracking";
import { ReturnRequestDialog } from "@/components/conta/return-request-dialog";
import { CustomerTimeline } from "@/components/pedido/customer-timeline";
import { requireUser } from "@/lib/auth/session";
import { formatBRL } from "@/lib/format";
import { requestReturn } from "@/lib/orders/actions";
import { getMyOrder } from "@/lib/orders/customer";
import { trackingUrl } from "@/lib/orders/notice-data";
import { canRequestReturn } from "@/lib/orders/return-schema";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false, follow: false },
};

const card =
  "flex flex-col gap-4 rounded-[22px] border border-borda bg-white p-5 md:p-7";
const h2 = "m-0 font-display text-xl font-bold";

const dataBR = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "America/Sao_Paulo",
});

export default async function PedidoPage(
  props: PageProps<"/conta/pedidos/[numero]">,
) {
  const { numero } = await props.params;
  const user = await requireUser(`/conta/pedidos/${numero}`);
  if (!/^BA-\d{6,}$/.test(numero)) notFound();
  const pedido = await getMyOrder(user.id, numero);
  if (!pedido) notFound();

  const podeTrocar =
    !pedido.trocaPedida &&
    canRequestReturn(pedido.status, pedido.entregueEm, new Date());
  const e = pedido.endereco;
  const rastreio = pedido.shipment?.rastreio ?? null;

  return (
    <>
      <Link href="/conta/pedidos" className="self-start text-[15px] font-bold">
        ← Pedidos
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
          {pedido.numero}
        </h1>
        <StatusBadge status={pedido.status} />
      </div>
      <p className="m-0 text-[15px] text-texto-2">
        Feito em {dataBR.format(new Date(pedido.criadoEm))}
      </p>
      <OrderProgress status={pedido.status} />

      <OrderTracking
        status={pedido.status}
        transportadora={pedido.shipment?.transportadora ?? null}
        servico={pedido.shipment?.servico ?? pedido.freteServico}
        rastreio={rastreio}
        rastreioUrl={trackingUrl(rastreio)}
      />

      <section className={card} aria-labelledby="itens">
        <h2 id="itens" className={h2}>
          Itens
        </h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {pedido.itens.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 text-[15px]">
              <span>
                {i.nome}{" "}
                <span className="text-texto-2">· Qtd. {i.quantidade}</span>
              </span>
              <b className="font-display">
                {formatBRL(i.preco_cents * i.quantidade)}
              </b>
            </li>
          ))}
        </ul>
        <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-borda pt-4 text-[15px]">
          <dt>Subtotal</dt>
          <dd className="m-0 text-right">{formatBRL(pedido.subtotalCents)}</dd>
          <dt>Frete{pedido.freteServico ? ` (${pedido.freteServico})` : ""}</dt>
          <dd className="m-0 text-right">
            {pedido.freteCents === 0 ? "Grátis" : formatBRL(pedido.freteCents)}
          </dd>
          {pedido.descontoCents > 0 ? (
            <>
              <dt>Desconto</dt>
              <dd className="m-0 text-right">
                −{formatBRL(pedido.descontoCents)}
              </dd>
            </>
          ) : null}
          <dt className="font-display font-extrabold">Total</dt>
          <dd className="m-0 text-right font-display font-extrabold">
            {formatBRL(pedido.totalCents)}
          </dd>
        </dl>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className={card} aria-labelledby="entrega">
          <h2 id="entrega" className={h2}>
            Entrega
          </h2>
          <p className="m-0 text-[15px] leading-relaxed">
            {e.rua}, {e.numero}
            {e.complemento ? ` · ${e.complemento}` : ""}
            <br />
            {e.bairro} · {e.cidade}/{e.uf}
            <br />
            CEP {e.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
          </p>
        </section>

        <section className={card} aria-labelledby="historico">
          <h2 id="historico" className={h2}>
            Histórico
          </h2>
          <CustomerTimeline eventos={pedido.eventos} />
        </section>
      </div>

      <section className={card} aria-labelledby="ajuda">
        <h2 id="ajuda" className={h2}>
          Nota e ajuda
        </h2>
        {pedido.invoice?.danfe_url || podeTrocar ? (
          <div className="flex flex-wrap gap-3">
            {pedido.invoice?.danfe_url ? (
              <a
                href={pedido.invoice.danfe_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center rounded-[14px] bg-ultramar px-5 font-display font-bold text-white hover:bg-ultramar-700"
              >
                Baixar nota fiscal (PDF)
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            ) : null}
            {podeTrocar ? (
              <ReturnRequestDialog
                numero={pedido.numero}
                action={requestReturn}
              />
            ) : null}
          </div>
        ) : null}
        {pedido.trocaPedida ? (
          <p className="m-0 text-[15px] text-texto-2">
            Recebemos seu pedido de troca ou devolução. Vamos responder pelo seu
            e-mail em até 1 dia útil.
          </p>
        ) : !podeTrocar ? (
          <p className="m-0 text-[15px] text-texto-2">
            Precisa de ajuda com este pedido?{" "}
            <Link href="/contato" className="font-bold">
              Fale com a gente
            </Link>
            .
          </p>
        ) : null}
      </section>
    </>
  );
}
