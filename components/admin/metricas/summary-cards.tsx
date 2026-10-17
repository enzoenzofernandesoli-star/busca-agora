import { StatCard } from "@/components/admin/stat-card";
import { formatBRL } from "@/lib/format";
import type { MetricsSummary } from "@/lib/metrics/types";

export function SummaryCards({ summary }: { summary: MetricsSummary }) {
  const percent =
    summary.conversao === null
      ? "—"
      : new Intl.NumberFormat("pt-BR", {
          style: "percent",
          maximumFractionDigits: 2,
        }).format(summary.conversao);
  return (
    <section aria-label="Resumo das métricas">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          compacto
          titulo="Visitantes"
          valor={summary.visitantes.toLocaleString("pt-BR")}
        />
        <StatCard
          compacto
          titulo="Compras"
          valor={summary.compras.toLocaleString("pt-BR")}
        />
        <StatCard compacto titulo="Conversão" valor={percent} />
        <StatCard
          compacto
          titulo="Faturamento"
          valor={formatBRL(summary.faturamentoCents)}
        />
        <StatCard
          compacto
          titulo="Margem"
          valor={formatBRL(summary.margemCents)}
        />
      </div>
      <p className="mt-2 text-xs text-texto-2">
        visitantes = soma dos visitantes de cada dia
      </p>
    </section>
  );
}
