import { ForecastPanel } from "@/components/admin/metricas/forecast-panel";
import { PeriodPicker } from "@/components/admin/metricas/period-picker";
import { ProductsTable } from "@/components/admin/metricas/products-table";
import { SummaryCards } from "@/components/admin/metricas/summary-cards";
import { requireAdmin } from "@/lib/auth/session";
import { parseHorizon, parseSort, toSearchParams } from "@/lib/metrics/params";
import { parsePeriod } from "@/lib/metrics/period";
import { forecastFor, productsTable, sortRows } from "@/lib/metrics/queries";

export const metadata = { title: "Métricas" };

// Product metrics (request of 18/10). Reads the hourly summary
// (product_metrics_daily); figures of the current hour arrive on the next
// refresh.
export default async function AdminMetricas(
  props: PageProps<"/admin/metricas">,
) {
  await requireAdmin("/admin/metricas");
  const params = await props.searchParams;
  const now = new Date();
  const period = parsePeriod(params, now);
  const { key, dir } = parseSort(params);
  const horizonte = parseHorizon(params);
  const [{ rows, summary }, previsao] = await Promise.all([
    productsTable(period),
    forecastFor(horizonte, now),
  ]);
  const search = toSearchParams(params);

  return (
    <>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        Métricas
      </h1>
      <PeriodPicker period={period} searchParams={search} />
      <SummaryCards summary={summary} />
      <ProductsTable rows={sortRows(rows, key, dir)} searchParams={search} />
      <ForecastPanel
        result={previsao}
        horizonDays={horizonte}
        searchParams={search}
      />
      <p className="m-0 text-sm text-texto-2">
        Os números são atualizados a cada hora.
      </p>
    </>
  );
}
