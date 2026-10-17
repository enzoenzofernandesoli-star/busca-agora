import { ArrowRightIcon } from "@/components/loja/icons";
import type { FunnelData } from "@/lib/metrics/types";

export function ProductFunnel({ data }: { data: FunnelData }) {
  const steps = [
    { label: "Viu", value: data.viu },
    { label: "Carrinho", value: data.carrinho },
    { label: "Checkout", value: data.checkout },
    { label: "Comprou", value: data.comprou },
  ];
  return (
    <section className="rounded-[22px] border border-borda bg-fundo p-5 text-noite md:p-7">
      <h2 className="font-display text-lg font-bold">Funil do produto</h2>
      <ol className="mt-5 grid gap-4 md:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.label} className="min-w-0">
            {index > 0 && (
              <p className="mb-3 flex items-center gap-2 text-sm text-texto-2">
                <ArrowRightIcon size={18} className="rotate-90 md:rotate-0" />
                <span>
                  {!steps[index - 1]?.value
                    ? "—"
                    : new Intl.NumberFormat("pt-BR", {
                        style: "percent",
                        maximumFractionDigits: 1,
                      }).format(
                        step.value / (steps[index - 1]?.value ?? 1),
                      )}{" "}
                  da etapa anterior
                </span>
              </p>
            )}
            <div
              className={`rounded-[16px] border p-4 ${index === 3 ? "border-ultramar bg-lavanda" : "border-borda"}`}
            >
              <p className="text-sm font-bold text-texto-2">{step.label}</p>
              <p className="mt-2 font-display text-2xl font-extrabold">
                {step.value.toLocaleString("pt-BR")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
