import type { DailyPoint, ForecastRange, ForecastResult } from "./types";

const DAY_MS = 86_400_000;
const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayNumber(value: string): number {
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== value
  ) {
    throw new TypeError("Data inválida no histórico.");
  }
  return timestamp / DAY_MS;
}

function isWeekend(day: number): boolean {
  const weekday = new Date(day * DAY_MS).getUTCDay();
  return weekday === 0 || weekday === 6;
}

/** Missing dates between the first and last observed day count as zero.
 * start is the first forecast day, interpreted in America/Sao_Paulo.
 * Standard deviations are population deviations; daily bounds are added.
 */
export function forecast(
  days: DailyPoint[],
  horizonDays: number,
  start: Date,
): ForecastResult {
  if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 365) {
    throw new RangeError("O horizonte deve ser um inteiro entre 1 e 365 dias.");
  }
  if (!Number.isFinite(start.getTime()))
    throw new TypeError("Data inicial inválida.");
  const startDay = dayNumber(dateFormat.format(start));
  const history = new Map<number, DailyPoint>();
  for (const point of days) {
    const day = dayNumber(point.data);
    for (const value of [point.views, point.vendas, point.faturamentoCents]) {
      if (!Number.isSafeInteger(value) || value < 0)
        throw new TypeError(
          "Métricas devem ser inteiros não negativos seguros.",
        );
    }
    if (history.has(day))
      throw new TypeError("Histórico contém datas repetidas.");
    if (day < startDay) history.set(day, point);
  }
  const dates = [...history.keys()].sort((a, b) => a - b);
  const end = dates.at(-1);
  const earliest = dates[0];
  if (end === undefined || earliest === undefined)
    return {
      suficiente: false,
      motivo: "São necessários pelo menos 14 dias de histórico.",
    };

  const first = Math.max(earliest, end - 27);
  if (end - first + 1 < 14)
    return {
      suficiente: false,
      motivo: "São necessários pelo menos 14 dias de histórico.",
    };
  const groups: [DailyPoint[], DailyPoint[]] = [[], []];
  let sales = 0;
  for (let day = first; day <= end; day++) {
    const point = history.get(day) ?? {
      data: "",
      views: 0,
      vendas: 0,
      faturamentoCents: 0,
    };
    groups[isWeekend(day) ? 1 : 0].push(point);
    sales += point.vendas;
  }
  if (sales < 5)
    return {
      suficiente: false,
      motivo: "São necessárias pelo menos 5 vendas no período usado.",
    };
  const counts: [number, number] = [0, 0];
  for (let offset = 0; offset < horizonDays; offset++)
    counts[isWeekend(startDay + offset) ? 1 : 0]++;
  function project(
    key: "views" | "vendas" | "faturamentoCents",
    money = false,
  ): ForecastRange {
    const result = { previsto: 0, minimo: 0, maximo: 0 };
    groups.forEach((group, index) => {
      const count = counts[index] ?? 0;
      const mean = group.reduce(
        (sum, point) => sum + point[key] / group.length,
        0,
      );
      const deviation = Math.sqrt(
        group.reduce(
          (sum, point) => sum + (point[key] - mean) ** 2 / group.length,
          0,
        ),
      );
      result.previsto += mean * count;
      result.minimo += Math.max(0, mean - deviation) * count;
      result.maximo += (mean + deviation) * count;
    });
    if (money) {
      result.previsto = Math.round(result.previsto);
      result.minimo = Math.round(result.minimo);
      result.maximo = Math.round(result.maximo);
    }
    if (
      !Object.values(result).every(
        (value) =>
          Number.isFinite(value) && (!money || Number.isSafeInteger(value)),
      )
    ) {
      throw new RangeError("Previsão excede o limite numérico seguro.");
    }
    return result;
  }
  return {
    suficiente: true,
    dias: horizonDays,
    views: project("views"),
    vendas: project("vendas"),
    faturamento: project("faturamentoCents", true),
  };
}
