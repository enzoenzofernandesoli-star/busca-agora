import { describe, expect, it } from "vitest";

import { cepSchema } from "@/lib/br/cep";
import { formatCep, parseCep } from "@/lib/br/cep-format";

describe("parseCep (zod-free, same rule as cepSchema)", () => {
  const casos = [
    "01310-100",
    "01310100",
    " 01310 100 ",
    "0131-0100",
    "1234567",
    "123456789",
    "abc01310100",
    "",
    "01310-10a",
  ];
  it.each(casos)("%s", (valor) => {
    const zod = cepSchema.safeParse(valor);
    expect(parseCep(valor)).toBe(zod.success ? zod.data : null);
  });

  it("formats while typing", () => {
    expect(formatCep("01310100")).toBe("01310-100");
    expect(formatCep("0131")).toBe("0131");
  });
});
