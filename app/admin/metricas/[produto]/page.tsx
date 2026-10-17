import Link from "next/link";
import { notFound } from "next/navigation";

import { DailyChart } from "@/components/admin/metricas/daily-chart";
import { ForecastPanel } from "@/components/admin/metricas/forecast-panel";
import { OriginsBreakdown } from "@/components/admin/metricas/origins-breakdown";
import { PeriodPicker } from "@/components/admin/metricas/period-picker";
import { ProductFunnel } from "@/components/admin/metricas/product-funnel";
import { ViewersList } from "@/components/admin/metricas/viewers-list";
import { requireAdmin } from "@/lib/auth/session";
import { parseHorizon, toSearchParams } from "@/lib/metrics/params";
import { parsePeriod } from "@/lib/metrics/period";
import {
  forecastFor,
  productBySlug,
  productDetail,
} from "@/lib/metrics/queries";

export const metadata = { title: "Métricas do produto" };

export default async function AdminMetricasProduto(
  props: PageProps<"/admin/metricas/[produto]">,
) {
  const { produto: slug } = await props.params;
  await requireAdmin(`/admin/metricas/${slug}`);
  const produto = await productBySlug(slug);
  if (!produto) notFound();
  const params = await props.searchParams;
  const now = new Date();
  const period = parsePeriod(params, now);
  const horizonte = parseHorizon(params);
  const [detalhe, previsao] = await Promise.all([
    productDetail(produto.id, period),
    forecastFor(horizonte, now, produto.id),
  ]);
  const search = toSearchParams(params);
  const action = `/admin/metricas/${produto.slug}`;

  return (
    <>
      <Link
        href={`/admin/metricas?${search.toString()}`}
        className="text-[15px] font-bold"
      >
        ← Todos os produtos
      </Link>
      <h1 className="m-0 font-display text-[28px] font-extrabold md:text-[34px]">
        {produto.nome}
      </h1>
      <PeriodPicker period={period} searchParams={search} action={action} />
      <DailyChart days={detalhe.dias} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ProductFunnel data={detalhe.funil} />
        <OriginsBreakdown rows={detalhe.origens} />
      </div>
      <ForecastPanel
        result={previsao}
        horizonDays={horizonte}
        searchParams={search}
        action={action}
      />
      <ViewersList rows={detalhe.quemViu} />
    </>
  );
}
