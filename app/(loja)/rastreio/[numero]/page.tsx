import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/admin/status-badge";
import { OrderProgress } from "@/components/conta/order-progress";
import { OrderTracking } from "@/components/conta/order-tracking";
import { CustomerTimeline } from "@/components/pedido/customer-timeline";
import { getTrackedOrder } from "@/lib/orders/customer";
import { trackingUrl } from "@/lib/orders/notice-data";
import { verifyTrackingToken } from "@/lib/orders/tracking-token";

export const metadata: Metadata = {
  title: "Rastrear pedido",
  robots: { index: false, follow: false },
};

const card =
  "flex flex-col gap-4 rounded-[22px] border border-borda bg-white p-5 md:p-7";

export default async function RastreioPedidoPage(
  props: PageProps<"/rastreio/[numero]">,
) {
  const { numero } = await props.params;
  const { t } = await props.searchParams;
  // Only after number + e-mail were proven on /rastreio (signed, 1 hour).
  if (!verifyTrackingToken(numero, typeof t === "string" ? t : undefined)) {
    redirect("/rastreio");
  }
  const pedido = await getTrackedOrder(numero);
  if (!pedido) redirect("/rastreio");
  const rastreio = pedido.shipment?.rastreio ?? null;

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
      <Link href="/rastreio" className="self-start text-[15px] font-bold">
        ← Rastrear outro pedido
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
          {pedido.numero}
        </h1>
        <StatusBadge status={pedido.status} />
      </div>
      <OrderProgress status={pedido.status} />
      <OrderTracking
        status={pedido.status}
        transportadora={pedido.shipment?.transportadora ?? null}
        servico={pedido.shipment?.servico ?? null}
        rastreio={rastreio}
        rastreioUrl={trackingUrl(rastreio)}
      />
      <section className={card} aria-labelledby="historico">
        <h2 id="historico" className="m-0 font-display text-xl font-bold">
          Histórico
        </h2>
        <CustomerTimeline eventos={pedido.eventos} />
      </section>
    </div>
  );
}
