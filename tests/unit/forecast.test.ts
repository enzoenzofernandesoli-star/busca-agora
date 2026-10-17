import { describe, expect, it } from "vitest";
import { forecast } from "@/lib/metrics/forecast";
import type { DailyPoint, ForecastResult } from "@/lib/metrics/types";

const start = new Date("2026-10-05T12:00:00-03:00"); // Monday.
function history(length = 28): DailyPoint[] {
  return Array.from({ length }, (_, index) => {
    const date = new Date(Date.UTC(2026, 8, 7 + index));
    const weekend = [0, 6].includes(date.getUTCDay());
    return {
      data: date.toISOString().slice(0, 10),
      views: weekend ? 40 : 10,
      vendas: weekend ? 4 : 1,
      faturamentoCents: weekend ? 4003 : 1001,
    };
  });
}
function sufficient(result: ForecastResult) {
  expect(result.suficiente).toBe(true);
  if (!result.suficiente) throw new Error(result.motivo);
  return result;
}

describe("forecast", () => {
  it("separa médias úteis e de fim de semana em um horizonte misto", () => {
    const result = sufficient(forecast(history(), 7, start));
    expect(result.views.previsto).toBeCloseTo(130);
    expect(result.vendas.previsto).toBeCloseTo(13);
    expect(result.faturamento.previsto).toBe(13011);
  });
  it("projeta horizonte sem fim de semana e inclui start", () => {
    const result = sufficient(forecast(history(), 5, start));
    expect(result.views.previsto).toBeCloseTo(50);
    expect(result.vendas.previsto).toBeCloseTo(5);
  });
  it("projeta somente fim de semana", () => {
    expect(
      sufficient(forecast(history(), 2, new Date("2026-10-10T12:00:00-03:00")))
        .views.previsto,
    ).toBeCloseTo(80);
  });
  it("preenche datas ausentes entre os limites observados com zero", () => {
    const sparse = history().filter((_, index) => index === 0 || index === 27);
    const explicit = history().map((point, index) =>
      index === 0 || index === 27
        ? point
        : { ...point, views: 0, vendas: 0, faturamentoCents: 0 },
    );
    expect(forecast(sparse, 7, start)).toEqual(forecast(explicit, 7, start));
  });
  it("nunca produz faixa negativa e mantém centavos inteiros", () => {
    const input = history().map((point, index) => ({
      ...point,
      views: index === 0 ? 1000 : 0,
      vendas: index === 0 ? 10 : 0,
      faturamentoCents: index === 0 ? 10001 : 0,
    }));
    const result = sufficient(forecast(input, 13, start));
    for (const range of [result.views, result.vendas, result.faturamento]) {
      expect(range.minimo).toBeGreaterThanOrEqual(0);
      expect(range.minimo).toBeLessThanOrEqual(range.previsto);
      expect(range.maximo).toBeGreaterThanOrEqual(range.previsto);
    }
    expect(Object.values(result.faturamento).every(Number.isSafeInteger)).toBe(
      true,
    );
    expect(result.faturamento.previsto).toBe(Math.round((10001 / 20) * 10));
  });
  it("usa desvio padrão populacional por tipo e soma faixas diárias", () => {
    const input = history().map((point, index) => ({
      ...point,
      views: index < 14 ? 0 : 20,
    }));
    const result = sufficient(forecast(input, 7, start));
    expect(result.views.previsto).toBeCloseTo(70);
    expect(result.views.minimo).toBeCloseTo(0);
    expect(result.views.maximo).toBeCloseTo(140);
  });
  it("recusa histórico inferior a 14 dias, inclusive vazio", () => {
    expect(forecast(history(13), 7, start)).toEqual({
      suficiente: false,
      motivo: expect.stringContaining("14 dias"),
    });
    expect(forecast([], 7, start).suficiente).toBe(false);
    expect(forecast(history(14), 7, start).suficiente).toBe(true);
  });
  it("recusa menos de cinco vendas no período usado", () => {
    const input = history().map((point, index) => ({
      ...point,
      vendas: index === 0 ? 4 : 0,
    }));
    expect(forecast(input, 7, start)).toEqual({
      suficiente: false,
      motivo: expect.stringContaining("5 vendas"),
    });
  });
  it("ignora dias anteriores à janela de 28 dias e não altera entrada", () => {
    const input = [
      {
        data: "2026-09-06",
        views: 99999,
        vendas: 999,
        faturamentoCents: 999999,
      },
      ...history(),
    ].reverse();
    const before = structuredClone(input);
    expect(forecast(input, 7, start)).toEqual(forecast(history(), 7, start));
    expect(input).toEqual(before);
  });
  it("não usa observações do dia previsto nem posteriores e respeita São Paulo", () => {
    const input = [
      ...history(),
      {
        data: "2026-10-05",
        views: 99999,
        vendas: 999,
        faturamentoCents: 999999,
      },
    ];
    expect(forecast(input, 1, start)).toEqual(forecast(history(), 1, start));
    // 01:00 UTC on Monday is still Sunday in São Paulo.
    expect(
      sufficient(forecast(history(), 1, new Date("2026-10-12T01:00:00Z"))).views
        .previsto,
    ).toBeCloseTo(40);
  });
  it.each([0, -1, 366, 1.5, NaN, Infinity])(
    "rejeita horizonte inválido %s",
    (horizon) => {
      expect(() => forecast(history(), horizon, start)).toThrow(RangeError);
    },
  );
  it("aceita os limites 1 e 365", () => {
    expect(forecast(history(), 1, start).suficiente).toBe(true);
    expect(forecast(history(), 365, start).suficiente).toBe(true);
  });
  it("rejeita datas e métricas inválidas", () => {
    expect(() => forecast(history(), 7, new Date(NaN))).toThrow(TypeError);
    expect(() =>
      forecast(
        [
          {
            ...{
              data: "2026-09-07",
              views: 10,
              vendas: 1,
              faturamentoCents: 1001,
            },
            data: "2026-02-30",
          },
        ],
        7,
        start,
      ),
    ).toThrow(TypeError);
    expect(() =>
      forecast(
        [
          {
            ...{
              data: "2026-09-07",
              views: 10,
              vendas: 1,
              faturamentoCents: 1001,
            },
            faturamentoCents: 1.5,
          },
        ],
        7,
        start,
      ),
    ).toThrow(TypeError);
    expect(() =>
      forecast(
        [
          ...history(),
          { data: "2026-09-07", views: 10, vendas: 1, faturamentoCents: 1001 },
        ],
        7,
        start,
      ),
    ).toThrow(TypeError);
  });
});
