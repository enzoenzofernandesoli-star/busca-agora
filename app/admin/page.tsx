import { AutoRefresh } from "@/components/admin/auto-refresh";
import {
  DashboardAlerts,
  KpiCard,
  QuickActions,
} from "@/components/admin/dashboard-cards";
import { RecentOrders } from "@/components/admin/recent-orders";
import { SalesChart } from "@/components/admin/sales-chart";
import { getDashboardV2 } from "@/lib/admin/queries";
import { emailEnabled } from "@/lib/email";
import { env } from "@/lib/env";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Painel" };

const hojeLongo = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Sao_Paulo",
});

/** Percent change; null when there is nothing to compare with. */
function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

export default async function AdminHome() {
  const d = await getDashboardV2();
  const agora = new Date();
  const ticket = d.pedidos7d ? Math.round(d.vendas7dCents / d.pedidos7d) : 0;
  const ticketAnterior = d.pedidos7dAnterior
    ? Math.round(d.vendas7dAnteriorCents / d.pedidos7dAnterior)
    : 0;

  const alertas: Parameters<typeof DashboardAlerts>[0]["alertas"] = [];
  if (d.aEnviar > 0) {
    alertas.push({
      tipo: "aviso",
      texto:
        d.aEnviar === 1
          ? "1 pedido pago esperando envio."
          : `${d.aEnviar} pedidos pagos esperando envio.`,
      href: "/admin/pedidos?status=a_enviar",
      acao: "Ver pedidos",
    });
  }
  if (d.notasPendentes > 0) {
    alertas.push({
      tipo: "aviso",
      texto:
        d.notasPendentes === 1
          ? "1 nota fiscal para emitir à mão."
          : `${d.notasPendentes} notas fiscais para emitir à mão.`,
      href: "/admin/pedidos?status=a_enviar",
      acao: "Ver pedidos",
    });
  }
  if (d.jobsErro > 0) {
    alertas.push({
      tipo: "erro",
      texto:
        d.jobsErro === 1
          ? "1 tarefa automática falhou (e-mail, etiqueta ou impressão)."
          : `${d.jobsErro} tarefas automáticas falharam (e-mail, etiqueta ou impressão).`,
      href: "/admin/pedidos?status=a_enviar",
      acao: "Resolver",
    });
  }
  if (d.estoqueBaixo > 0) {
    alertas.push({
      tipo: "aviso",
      texto:
        d.estoqueBaixo === 1
          ? "1 variação com 3 unidades ou menos."
          : `${d.estoqueBaixo} variações com 3 unidades ou menos.`,
      href: "/admin/produtos?filtro=estoque",
      acao: "Ver estoque",
    });
  }
  if (!emailEnabled()) {
    alertas.push({
      tipo: "aviso",
      texto: "E-mails aos clientes desligados (falta a senha de app do Gmail).",
      href: "/admin/configuracoes",
      acao: "Ver",
    });
  }
  if (!env.PRINTNODE_API_KEY) {
    alertas.push({
      tipo: "aviso",
      texto:
        "Impressão automática desligada: baixe etiqueta e resumo em cada pedido.",
      href: "/admin/configuracoes",
      acao: "Ver",
    });
  }

  return (
    <>
      <AutoRefresh segundos={30} />
      <header className="flex flex-col gap-1">
        <p className="m-0 text-[15px] text-texto-2 first-letter:uppercase">
          {hojeLongo.format(agora)}
        </p>
        {/* The panel shell already greets by name: the page title says where. */}
        <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
          Painel
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Vendas de hoje"
          valor={formatBRL(d.vendasHojeCents)}
          comparacao={{
            texto:
              d.pedidosHoje === 1 ? "1 pedido" : `${d.pedidosHoje} pedidos`,
            variacao: null,
          }}
          href="/admin/pedidos?periodo=hoje"
          destaque
        />
        <KpiCard
          titulo="Últimos 7 dias"
          valor={formatBRL(d.vendas7dCents)}
          comparacao={{
            texto: "vs. 7 dias antes",
            variacao: variacao(d.vendas7dCents, d.vendas7dAnteriorCents),
          }}
          href="/admin/pedidos?periodo=7d"
        />
        <KpiCard
          titulo="Ticket médio (7 dias)"
          valor={formatBRL(ticket)}
          comparacao={{
            texto: "vs. 7 dias antes",
            variacao: variacao(ticket, ticketAnterior),
          }}
        />
        <KpiCard
          titulo="Pedidos a enviar"
          valor={String(d.aEnviar)}
          href="/admin/pedidos?status=a_enviar"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <SalesChart dias={d.dias} />
        <DashboardAlerts alertas={alertas} />
      </div>

      <RecentOrders pedidos={d.ultimos} agora={agora.toISOString()} />

      <QuickActions
        acoes={[
          {
            titulo: "Novo produto",
            descricao: "Cadastrar com fotos e preço",
            href: "/admin/produtos/novo",
            icone: "produto",
          },
          {
            titulo: "Pedidos a enviar",
            descricao: "Etiqueta, nota e despacho",
            href: "/admin/pedidos?status=a_enviar",
            icone: "pedidos",
          },
          {
            titulo: "Equipe",
            descricao: "Quem acessa o painel",
            href: "/admin/equipe",
            icone: "equipe",
          },
          {
            titulo: "Configurações",
            descricao: "Dados da loja e integrações",
            href: "/admin/configuracoes",
            icone: "config",
          },
        ]}
      />
    </>
  );
}
