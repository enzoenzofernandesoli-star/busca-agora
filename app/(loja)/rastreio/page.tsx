import type { Metadata } from "next";

import { TrackingForm } from "@/components/loja/tracking-form";
import { TruckIcon } from "@/components/loja/icons";
import { trackOrder } from "@/lib/orders/actions";

export const metadata: Metadata = {
  title: "Rastrear pedido",
  description:
    "Acompanhe seu pedido da Busca Agora com o número e o e-mail da compra.",
};

export default function RastreioPage() {
  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4 rounded-[22px] border border-borda bg-white p-6 md:rounded-[28px] md:p-8 [&>form]:rounded-none [&>form]:border-0 [&>form]:p-0">
      <div className="flex size-12 items-center justify-center rounded-[14px] bg-ciano-tile text-ciano-ink">
        <TruckIcon size={24} />
      </div>
      <h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">
        Seu pedido, passo a passo.
      </h1>
      <p className="m-0 text-base leading-relaxed text-texto-2">
        Informe o número do pedido e o e-mail usado na compra.
      </p>
      <TrackingForm action={trackOrder} />
    </div>
  );
}
