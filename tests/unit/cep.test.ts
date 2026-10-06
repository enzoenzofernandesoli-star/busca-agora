import { describe, expect, it, vi } from "vitest";
import { cepSchema, formatCep, lookupCep } from "@/lib/br/cep";

const address = {
  cep: "01001-000",
  logradouro: "Praça da Sé",
  bairro: "Sé",
  localidade: "São Paulo",
  uf: "sp",
};
function fakeFetch(data: unknown, status = 200) {
  return vi.fn<typeof fetch>(async () => Response.json(data, { status }));
}

describe("CEP", () => {
  it.each([
    ["", ""],
    ["01001", "01001"],
    ["010010", "01001-0"],
    ["01001000", "01001-000"],
    ["0100100012", "01001-000"],
  ])("formats %s", (value, expected) => {
    expect(formatCep(value)).toBe(expected);
  });
  it("normalizes masked CEP", () => {
    expect(cepSchema.parse("01001-000")).toBe("01001000");
  });
  it.each(["123", "010010000", "01001000abc", ""])("rejects %s", (value) => {
    expect(cepSchema.safeParse(value).success).toBe(false);
  });
  it("maps and validates ViaCEP with a timeout signal", async () => {
    const fetchImpl = fakeFetch(address);
    expect(await lookupCep("01001-000", fetchImpl)).toEqual({
      cep: "01001000",
      rua: "Praça da Sé",
      bairro: "Sé",
      cidade: "São Paulo",
      uf: "SP",
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://viacep.com.br/ws/01001000/json/",
      { signal: expect.any(AbortSignal) },
    );
  });
  it.each([true, "true"])("returns null for erro=%s", async (erro) => {
    expect(await lookupCep("99999999", fakeFetch({ erro }))).toBeNull();
  });
  it("rejects a complete response flagged as missing", async () => {
    expect(
      await lookupCep("01001000", fakeFetch({ ...address, erro: true })),
    ).toBeNull();
  });
  it("returns null for HTTP 500", async () => {
    expect(await lookupCep("01001000", fakeFetch(address, 500))).toBeNull();
  });
  it("returns null for invalid JSON", async () => {
    expect(
      await lookupCep("01001000", async () => new Response("{broken")),
    ).toBeNull();
  });
  it("returns null for simulated timeout", async () => {
    expect(
      await lookupCep("01001000", async () => {
        throw new DOMException("Timeout", "AbortError");
      }),
    ).toBeNull();
  });
  it("returns null for network failures", async () => {
    expect(
      await lookupCep("01001000", async () => {
        throw new TypeError("Network error");
      }),
    ).toBeNull();
  });
  it.each([{}, { ...address, uf: "S" }, { ...address, logradouro: 42 }])(
    "rejects malformed responses",
    async (data) => {
      expect(await lookupCep("01001000", fakeFetch(data))).toBeNull();
    },
  );
  it("does not fetch invalid CEPs", async () => {
    const fetchImpl = fakeFetch(address);
    expect(await lookupCep("invalid", fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
