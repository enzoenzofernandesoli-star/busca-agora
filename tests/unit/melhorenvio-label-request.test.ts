import { describe, expect, it } from "vitest";
import {
  buildCartRequest,
  packageFor,
  type LabelInput,
  type LabelItem,
  type LabelParty,
} from "@/lib/shipping/melhorenvio/label-request";
const party: LabelParty = {
  nome: "Pessoa Exemplo",
  telefone: "(11) 99999-8888",
  email: "pessoa@example.test",
  documento: "529.982.247-25",
  rua: "Rua Exemplo",
  numero: "1",
  complemento: null,
  bairro: "Centro",
  cidade: "São Paulo",
  uf: "SP",
  cep: "01001-000",
};
const item: LabelItem = {
  nome: "Fone",
  quantidade: 2,
  precoCents: 8990,
  pesoG: 200,
  alturaCm: 3.2,
  larguraCm: 12,
  comprimentoCm: 20,
};
const input: LabelInput = {
  numero: "BA-000123",
  servicoId: 1,
  remetente: party,
  destinatario: party,
  itens: [item],
  notaChave: null,
};
describe("Melhor Envio cart request", () => {
  it("stacks quantities and combines weight in grams", () => {
    expect(
      packageFor([
        item,
        {
          ...item,
          quantidade: 1,
          pesoG: 100,
          alturaCm: 2,
          larguraCm: 13,
          comprimentoCm: 21,
        },
      ]),
    ).toEqual({ height: 9, width: 13, length: 21, weight: 0.5 });
  });
  it("applies conservative dimensions and rounds grams upward", () => {
    expect(
      packageFor([
        {
          ...item,
          quantidade: 1,
          pesoG: 0.2,
          alturaCm: 0.1,
          larguraCm: 1,
          comprimentoCm: 1,
        },
      ]),
    ).toEqual({ height: 2, width: 11, length: 16, weight: 0.001 });
  });
  it("normalizes party fields and uses company_document for CNPJ", () => {
    const r = buildCartRequest({
      ...input,
      remetente: { ...party, documento: "11.222.333/0001-81" },
    });
    expect(r.from).toMatchObject({
      company_document: "11222333000181",
      phone: "11999998888",
      postal_code: "01001000",
    });
    expect(r.from).not.toHaveProperty("document");
    expect(r.to).toHaveProperty("document", "52998224725");
  });
  it("sets content declaration and converts only at the JSON boundary", () => {
    const r = buildCartRequest(input);
    expect(r.products[0]?.unitary_value).toBe(89.9);
    expect(r.options.insurance_value).toBe(179.8);
    expect(r.options.non_commercial).toBe(true);
    expect(r.options).not.toHaveProperty("invoice");
    expect(r.options.tags).toEqual([{ tag: "BA-000123" }]);
  });
  it("keeps cent addition exact and includes invoice key", () => {
    const r = buildCartRequest({
      ...input,
      itens: [
        { ...item, quantidade: 1, precoCents: 10 },
        { ...item, quantidade: 1, precoCents: 20 },
      ],
      notaChave: "1".repeat(44),
    });
    expect(r.options.insurance_value).toBe(0.3);
    expect(r.options.invoice).toEqual({ key: "1".repeat(44) });
    expect(r.options.non_commercial).toBe(false);
  });
  it("limits product names", () => {
    expect(
      buildCartRequest({
        ...input,
        itens: [{ ...item, nome: "x".repeat(300) }],
      }).products[0]?.name.length,
    ).toBe(255);
  });
  it.each([
    { ...input, itens: [] },
    { ...input, remetente: { ...party, documento: "" } },
    { ...input, destinatario: { ...party, cep: "123" } },
    { ...input, itens: [{ ...item, pesoG: 0 }] },
    { ...input, itens: [{ ...item, alturaCm: NaN }] },
    { ...input, itens: [{ ...item, quantidade: 1.5 }] },
    { ...input, itens: [{ ...item, precoCents: 89.9 }] },
    { ...input, itens: [{ ...item, precoCents: Number.MAX_SAFE_INTEGER }] },
    { ...input, notaChave: "123" },
  ])("rejects invalid input", (value) => {
    expect(() => buildCartRequest(value)).toThrow();
  });
});
