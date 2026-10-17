import type { Period, PeriodKey } from "@/lib/metrics/types";

export function PeriodPicker({
  period,
  searchParams = new URLSearchParams(),
  action = "/admin/metricas",
}: {
  period: Period;
  searchParams?: URLSearchParams;
  action?: string;
}) {
  const options: { key: PeriodKey; label: string }[] = [
    { key: "hoje", label: "Hoje" },
    { key: "7", label: "7 dias" },
    { key: "30", label: "30 dias" },
    { key: "90", label: "90 dias" },
  ];
  return (
    <section
      aria-label="Período das métricas"
      className="rounded-[22px] border border-borda bg-fundo p-5 font-sans text-noite"
    >
      <nav aria-label="Períodos rápidos" className="flex flex-wrap gap-2">
        {options.map(({ key, label }) => {
          const params = new URLSearchParams(searchParams);
          params.delete("de");
          params.delete("ate");
          params.set("periodo", key);
          return (
            <a
              key={key}
              href={`${action}?${params}`}
              aria-current={period.key === key ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-[14px] border px-4 text-sm font-bold ${period.key === key ? "border-ultramar bg-ultramar text-lavanda" : "border-borda text-noite hover:bg-lavanda"}`}
            >
              {label}
            </a>
          );
        })}
      </nav>
      <form
        action={action}
        method="get"
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        {Array.from(searchParams.entries())
          .filter(([key]) => !["periodo", "de", "ate"].includes(key))
          .map(([key, value], index) => (
            <input
              key={`${key}-${index}`}
              type="hidden"
              name={key}
              value={value}
            />
          ))}
        <input type="hidden" name="periodo" value="personalizado" />
        <label className="grid min-w-0 gap-1 text-sm font-bold">
          De
          <input
            type="date"
            name="de"
            required
            defaultValue={period.de}
            className="min-h-11 min-w-0 rounded-[14px] border border-borda bg-fundo px-3 font-normal"
          />
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-bold">
          Até
          <input
            type="date"
            name="ate"
            required
            defaultValue={period.ate}
            className="min-h-11 min-w-0 rounded-[14px] border border-borda bg-fundo px-3 font-normal"
          />
        </label>
        <button className="min-h-11 rounded-[14px] bg-ultramar px-4 text-sm font-bold text-lavanda hover:bg-ultramar-700">
          Aplicar período
        </button>
      </form>
    </section>
  );
}
