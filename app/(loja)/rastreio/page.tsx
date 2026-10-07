import type { Metadata } from "next";

import { TrackingForm } from "@/components/loja/tracking-form";
import { trackOrder } from "@/lib/orders/actions";

export const metadata: Metadata = {
  title: "Rastrear pedido",
  description:
    "Acompanhe seu pedido da Busca Agora com o número e o e-mail da compra.",
};

export default function RastreioPage() {
  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-5">
      <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
        Rastrear pedido
      </h1>
      <div className="rounded-[22px] border border-borda bg-white p-5 md:p-7">
        <TrackingForm action={trackOrder} />
      </div>
    </div>
  );
}
