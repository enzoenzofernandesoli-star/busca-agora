import { beforeEach, describe, expect, it, vi } from "vitest";

// The client is server-only and reads the validated env: replace both.
vi.mock("server-only", () => ({}));
const envState = vi.hoisted(() => ({
  token: "token-de-teste" as string | null,
}));
vi.mock("@/lib/env", () => ({
  env: { MELHORENVIO_ENV: "sandbox" },
  requireEnv: (key: string) => {
    if (key === "MELHORENVIO_TOKEN" && envState.token) return envState.token;
    throw new Error(`${key} missing`);
  },
}));

import { createMelhorEnvio } from "@/lib/shipping/melhorenvio/client";
import type { ShippingItem } from "@/lib/shipping/types";

const itens: ShippingItem[] = [
  {
    variantId: "11111111-1111-4111-8111-111111111111",
    quantidade: 2,
    pesoG: 300,
    alturaCm: 5,
    larguraCm: 10,
    comprimentoCm: 15,
    precoCents: 8990,
  },
];

const input = { cepOrigem: "01001000", cepDestino: "20040002", itens };

// Shape from the official docs (calculo-de-fretes-por-produtos).
const apiResponse = [
  {
    id: 1,
    name: "PAC",
    price: "25.10",
    custom_price: "23.45",
    delivery_time: 8,
    custom_delivery_time: 7,
    company: { id: 1, name: "Correios" },
  },
  {
    id: 2,
    name: "SEDEX",
    price: "40.00",
    custom_price: "39.9",
    delivery_time: 3,
    custom_delivery_time: 3,
    company: { id: 1, name: "Correios" },
  },
  {
    id: 3,
    name: ".Package",
    error: "Serviço indisponível",
    company: { id: 2, name: "Jadlog" },
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Melhor Envio quote", () => {
  beforeEach(() => {
    envState.token = "token-de-teste";
  });

  it("calls the sandbox calculate endpoint with the documented headers", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(apiResponse));
    await createMelhorEnvio(fetchMock).quote(input);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate",
    );
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-de-teste");
    expect(headers.Accept).toBe("application/json");
    expect(headers["User-Agent"]).toMatch(/^Busca Agora \(.+@.+\)$/);

    const body = JSON.parse(String(init.body));
    expect(body.from).toEqual({ postal_code: "01001000" });
    expect(body.to).toEqual({ postal_code: "20040002" });
    expect(body.products[0]).toMatchObject({ quantity: 2, weight: 0.3 });
  });

  it("returns options in cents, cheapest first, skipping unavailable services", async () => {
    const result = await createMelhorEnvio(async () =>
      jsonResponse(apiResponse),
    ).quote(input);
    expect(result).toEqual({
      ok: true,
      opcoes: [
        expect.objectContaining({
          servicoId: "1",
          servico: "PAC",
          precoCents: 2345,
          prazoDias: 7,
        }),
        expect.objectContaining({
          servicoId: "2",
          servico: "SEDEX",
          precoCents: 3990,
          prazoDias: 3,
        }),
      ],
    });
  });

  it.each([
    [
      "no service available",
      async () => jsonResponse([apiResponse[2]]),
      "sem_servico",
    ],
    [
      "422 from the API",
      async () => jsonResponse({ message: "invalid" }, 422),
      "cep_invalido",
    ],
    ["500 from the API", async () => jsonResponse({}, 500), "indisponivel"],
    [
      "network failure",
      async () => Promise.reject(new TypeError("fetch failed")),
      "indisponivel",
    ],
    [
      "broken JSON",
      async () => new Response("<html>", { status: 200 }),
      "indisponivel",
    ],
  ] as const)("%s -> %s", async (_name, impl, motivo) => {
    const result = await createMelhorEnvio(
      impl as unknown as typeof fetch,
    ).quote(input);
    expect(result).toEqual({ ok: false, motivo });
  });

  it("without a token it never calls the API", async () => {
    envState.token = null;
    const fetchMock = vi.fn();
    const result = await createMelhorEnvio(fetchMock).quote(input);
    expect(result).toEqual({ ok: false, motivo: "indisponivel" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
