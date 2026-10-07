import { StatCard } from "@/components/admin/stat-card";
import { getDashboard } from "@/lib/admin/queries";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Painel" };

export default async function AdminHome() {
  const d = await getDashboard();
  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        Painel
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Vendas de hoje"
          valor={formatBRL(d.vendasHojeCents)}
          detalhe={
            d.pedidosHoje === 1 ? "1 pedido" : `${d.pedidosHoje} pedidos`
          }
          href="/admin/pedidos"
          tom="ok"
        />
        <StatCard
          titulo="Pedidos a enviar"
          valor={String(d.aEnviar)}
          detalhe="Pagos, ainda não postados"
          href="/admin/pedidos?status=a_enviar"
          tom={d.aEnviar > 0 ? "alerta" : "neutro"}
        />
        <StatCard
          titulo="Erros na fila"
          valor={String(d.jobsErro)}
          detalhe="Nota, etiqueta ou impressão que falharam"
          href="/admin/pedidos?status=a_enviar"
          tom={d.jobsErro > 0 ? "alerta" : "ok"}
        />
        <StatCard
          titulo="Estoque baixo"
          valor={String(d.estoqueBaixo)}
          detalhe="Variações com 3 ou menos"
          href="/admin/produtos?filtro=estoque"
          tom={d.estoqueBaixo > 0 ? "alerta" : "ok"}
        />
      </div>
    </>
  );
}
