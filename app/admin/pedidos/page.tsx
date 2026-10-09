import Link from "next/link";

import { DataTable } from "@/components/admin/data-table";
import { STATUS_LABEL, StatusBadge } from "@/components/admin/status-badge";
import {
  ORDER_STATUSES,
  listOrders,
  type OrderStatus,
  type Periodo,
} from "@/lib/admin/queries";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Pedidos" };

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const pagamento: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
};

export default async function AdminPedidos(props: PageProps<"/admin/pedidos">) {
  const params = await props.searchParams;
  const status =
    params.status === "a_enviar"
      ? "a_enviar"
      : ORDER_STATUSES.find((s) => s === params.status);
  const busca = typeof params.q === "string" ? params.q : "";
  const periodo = (["hoje", "7d", "30d"] as const).find(
    (p) => p === params.periodo,
  ) as Periodo | undefined;
  const pedidos = await listOrders({ status, busca, periodo });
  // Sold in the list: paid at some point (not waiting, canceled or refunded).
  const vendidos = pedidos.filter(
    (p) => !["pending_payment", "canceled", "refunded"].includes(p.status),
  );
  const totalVendido = vendidos.reduce((t, p) => t + p.total_cents, 0);
  const link = (mudar: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const base = { status: status ?? undefined, periodo, ...mudar };
    for (const [k, v] of Object.entries(base)) if (v) q.set(k, v);
    const s = q.toString();
    return `/admin/pedidos${s ? `?${s}` : ""}`;
  };

  const filtros: { valor: string; label: string }[] = [
    { valor: "", label: "Todos" },
    { valor: "a_enviar", label: "A enviar" },
    ...ORDER_STATUSES.map((s: OrderStatus) => ({
      valor: s,
      label: STATUS_LABEL[s],
    })),
  ];

  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        Pedidos
      </h1>

      <form className="flex flex-wrap gap-3" action="/admin/pedidos">
        <label htmlFor="q" className="sr-only">
          Buscar pelo número do pedido
        </label>
        <input
          id="q"
          name="q"
          defaultValue={busca}
          placeholder="Número do pedido, ex.: 123 ou BA-000123"
          className="h-12 min-w-0 flex-1 rounded-[14px] border-[1.5px] border-borda-forte bg-white px-4 text-base"
        />
        <button
          type="submit"
          className="min-h-12 cursor-pointer rounded-[14px] bg-noite px-6 font-bold text-white"
        >
          Buscar
        </button>
      </form>

      <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
        {filtros.map((f) => {
          const atual = (status ?? "") === f.valor;
          return (
            <Link
              key={f.valor}
              href={link({ status: f.valor || undefined })}
              aria-current={atual ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-full border px-4 text-sm font-bold no-underline ${
                atual
                  ? "border-ultramar bg-ultramar-50 text-ultramar"
                  : "border-borda bg-white text-noite"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Período" className="flex flex-wrap gap-2">
          {(
            [
              [undefined, "Tudo"],
              ["hoje", "Hoje"],
              ["7d", "7 dias"],
              ["30d", "30 dias"],
            ] as const
          ).map(([valor, label]) => {
            const atual = periodo === valor;
            return (
              <Link
                key={label}
                href={link({ periodo: valor })}
                aria-current={atual ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-full border px-4 text-sm font-bold no-underline ${
                  atual
                    ? "border-noite bg-noite text-white"
                    : "border-borda bg-white text-noite"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="m-0 text-[15px] text-texto-2" role="status">
          {vendidos.length === 1 ? "1 venda" : `${vendidos.length} vendas`} ·{" "}
          <b className="font-display text-lg text-noite">
            {formatBRL(totalVendido)}
          </b>
        </p>
      </div>

      <DataTable
        linhas={pedidos}
        chave={(p) => p.id}
        vazio="Nenhum pedido com esse filtro."
        colunas={[
          {
            titulo: "Pedido",
            render: (p) => (
              <Link href={`/admin/pedidos/${p.numero}`} className="font-bold">
                {p.numero}
              </Link>
            ),
          },
          {
            titulo: "Data",
            render: (p) => dataHora.format(new Date(p.created_at)),
          },
          { titulo: "Cliente", render: (p) => p.cliente_nome },
          {
            titulo: "Pagamento",
            render: (p) => pagamento[p.payment_method] ?? p.payment_method,
          },
          { titulo: "Total", render: (p) => formatBRL(p.total_cents) },
          {
            titulo: "Situação",
            render: (p) => <StatusBadge status={p.status} />,
          },
        ]}
      />
    </>
  );
}
