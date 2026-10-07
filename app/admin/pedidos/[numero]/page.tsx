import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { OrderTimeline } from "@/components/admin/order-timeline";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  cancelOrder,
  markInvoiceManual,
  requeueJob,
  retryJob,
} from "@/lib/admin/actions";
import { getOrderByNumber } from "@/lib/admin/queries";
import { formatCpf } from "@/lib/br/cpf";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Pedido" };

const card =
  "flex flex-col gap-4 rounded-[22px] border border-borda bg-white p-5 md:p-7";

const JOB_LABEL: Record<string, string> = {
  notify: "Avisos",
  email: "E-mail",
  invoice: "Nota fiscal",
  label: "Etiqueta",
  print: "Impressão",
};

const ETAPA_LABEL: Record<string, string> = {
  pending_payment: "pedido recebido",
  paid: "pagamento aprovado",
  invoiced: "nota emitida",
  shipped: "pedido enviado",
  delivered: "pedido entregue",
  devolucao: "troca ou devolução",
};

const JOB_STATUS: Record<string, string> = {
  pending: "Na fila",
  running: "Rodando",
  done: "Feito",
  failed: "Falhou",
};

export default async function AdminPedido(
  props: PageProps<"/admin/pedidos/[numero]">,
) {
  const { numero } = await props.params;
  if (!/^BA-\d{6,}$/.test(numero)) notFound();
  const data = await getOrderByNumber(numero);
  if (!data) notFound();
  const { order, eventos, jobs } = data;
  const endereco = (order.endereco ?? {}) as Record<string, string | undefined>;
  const pago = !["pending_payment", "canceled"].includes(order.status);

  return (
    <>
      <Link href="/admin/pedidos" className="text-[15px] font-bold">
        ← Pedidos
      </Link>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
          {order.numero}
        </h1>
        <StatusBadge status={order.status} />
      </div>

      <section className={card} aria-labelledby="acoes">
        <h2 id="acoes" className="m-0 font-display text-xl font-bold">
          Ações
        </h2>
        <div className="flex flex-wrap gap-3">
          {order.status === "pending_payment" ? (
            <ConfirmDialog
              gatilho="Cancelar pedido"
              titulo={`Cancelar ${order.numero}?`}
              texto="O pedido é cancelado e o estoque volta para a loja. Isso não pode ser desfeito."
              confirmarLabel="Cancelar pedido"
              perigo
              action={cancelOrder}
              campos={{ orderId: order.id }}
            />
          ) : null}
          {order.status === "paid" ? (
            <ConfirmDialog
              gatilho="Marcar nota manual emitida"
              titulo="A nota deste pedido já foi emitida à mão?"
              texto="Use quando a nota fiscal foi feita fora do site (venda no CPF ou emissão manual). O pedido passa para “Nota emitida”."
              confirmarLabel="Sim, nota emitida"
              action={markInvoiceManual}
              campos={{ orderId: order.id }}
            />
          ) : null}
          {pago ? (
            <>
              <ConfirmDialog
                gatilho="Reimprimir"
                titulo="Imprimir de novo?"
                texto="Resumo, nota e etiqueta voltam para a fila de impressão."
                confirmarLabel="Reimprimir"
                action={requeueJob}
                campos={{ orderId: order.id, tipo: "print" }}
              />
              <ConfirmDialog
                gatilho="Reemitir nota"
                titulo="Emitir a nota de novo?"
                texto="A emissão da nota volta para a fila. Use só se a anterior falhou."
                confirmarLabel="Reemitir nota"
                action={requeueJob}
                campos={{ orderId: order.id, tipo: "invoice" }}
              />
            </>
          ) : null}
          <button
            type="button"
            disabled
            title="Disponível quando o Mercado Pago estiver ligado (fase 5)"
            className="min-h-12 rounded-[14px] border-[1.5px] border-borda-forte px-5 font-bold text-texto-3"
          >
            Estornar (em breve)
          </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className={card} aria-labelledby="itens">
          <h2 id="itens" className="m-0 font-display text-xl font-bold">
            Itens
          </h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {order.order_items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap justify-between gap-2 border-b border-borda pb-3 last:border-0"
              >
                <span>
                  <b>{item.quantidade}×</b> {item.nome}
                  <span className="block text-sm text-texto-2">
                    SKU {item.sku} · NCM {item.ncm}
                  </span>
                </span>
                <span className="font-display font-bold">
                  {formatBRL(item.preco_cents * item.quantidade)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-[15px]">
            <dt>Produtos</dt>
            <dd className="m-0 text-right">
              {formatBRL(order.subtotal_cents)}
            </dd>
            <dt>
              Frete {order.frete_servico ? `(${order.frete_servico})` : ""}
            </dt>
            <dd className="m-0 text-right">{formatBRL(order.frete_cents)}</dd>
            {order.desconto_cents > 0 ? (
              <>
                <dt>Desconto</dt>
                <dd className="m-0 text-right">
                  −{formatBRL(order.desconto_cents)}
                </dd>
              </>
            ) : null}
            <dt className="font-bold">Total</dt>
            <dd className="m-0 text-right font-display text-lg font-extrabold">
              {formatBRL(order.total_cents)}
            </dd>
          </dl>
        </section>

        <section className={card} aria-labelledby="cliente">
          <h2 id="cliente" className="m-0 font-display text-xl font-bold">
            Cliente e entrega
          </h2>
          <p className="m-0 text-[15px] leading-relaxed">
            <b>{order.cliente_nome}</b>
            <br />
            CPF {formatCpf(order.cliente_cpf)}
            <br />
            {[endereco.rua, endereco.numero].filter(Boolean).join(", ")}
            {endereco.complemento ? ` — ${endereco.complemento}` : ""}
            <br />
            {[
              endereco.bairro,
              endereco.cidade && `${endereco.cidade}/${endereco.uf ?? ""}`,
            ]
              .filter(Boolean)
              .join(" · ")}
            <br />
            {endereco.cep ? `CEP ${endereco.cep}` : null}
          </p>
          {order.shipments?.rastreio ? (
            <p className="m-0 text-[15px]">
              Rastreio: <b>{order.shipments.rastreio}</b>
            </p>
          ) : null}
        </section>
      </div>

      {jobs.length > 0 ? (
        <section className={card} aria-labelledby="fila">
          <h2 id="fila" className="m-0 font-display text-xl font-bold">
            Fila de trabalho
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap gap-2">
                <b>
                  {JOB_LABEL[j.tipo] ?? j.tipo}
                  {j.etapa ? ` (${ETAPA_LABEL[j.etapa] ?? j.etapa})` : ""}:
                </b>
                <span
                  className={
                    j.status === "failed"
                      ? "font-bold text-rosa-ink"
                      : undefined
                  }
                >
                  {j.status === "done" && j.ultimo_erro
                    ? "Não enviado"
                    : (JOB_STATUS[j.status] ?? j.status)}
                </span>
                {j.tentativas > 0 ? (
                  <span className="text-texto-2">
                    ({j.tentativas} tentativas)
                  </span>
                ) : null}
                {j.ultimo_erro && j.status !== "pending" ? (
                  <span className="basis-full text-sm text-texto-2">
                    {j.ultimo_erro}
                  </span>
                ) : null}
                {j.status === "failed" ? (
                  <ConfirmDialog
                    gatilho="Tentar de novo"
                    titulo="Tentar de novo?"
                    texto="O trabalho volta para a fila agora, com 5 tentativas novas."
                    confirmarLabel="Tentar de novo"
                    action={retryJob}
                    campos={{ jobId: j.id }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={card} aria-labelledby="historico">
        <h2 id="historico" className="m-0 font-display text-xl font-bold">
          Histórico
        </h2>
        <OrderTimeline
          eventos={eventos.map((e) => ({
            ...e,
            detalhe: (e.detalhe ?? {}) as Record<string, unknown>,
          }))}
        />
      </section>
    </>
  );
}
