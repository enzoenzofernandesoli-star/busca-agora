import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Footer } from "@/components/loja/footer";
import {
  EMPRESA,
  cnpjValido,
  enderecoEmLinha,
  formatCep,
  formatCnpj,
} from "@/lib/config/empresa";
import { jsonLdScript, organizationJsonLd } from "@/lib/seo/json-ld";

const SITE = "https://buscaagora.com.br";

describe("dados da empresa", () => {
  it("CNPJ do arquivo é válido e formata", () => {
    expect(cnpjValido(EMPRESA.cnpj)).toBe(true);
    expect(formatCnpj(EMPRESA.cnpj)).toBe("69.919.406/0001-79");
  });

  it("recusa CNPJ com dígito errado ou repetido", () => {
    expect(cnpjValido("69919406000178")).toBe(false);
    expect(cnpjValido("11111111111111")).toBe(false);
    expect(cnpjValido("123")).toBe(false);
  });

  it("monta o endereço numa linha", () => {
    expect(formatCep(EMPRESA.endereco.cep)).toBe("01036-100");
    expect(enderecoEmLinha()).toBe(
      "Avenida São João, 802, Apto 56, República, São Paulo - SP, CEP 01036-100",
    );
  });
});

describe("rodapé", () => {
  it("mostra razão social, CNPJ formatado, endereço e e-mail", async () => {
    const html = renderToStaticMarkup(await Footer());
    expect(html).toContain("CNPJ 69.919.406/0001-79");
    expect(html).toContain(EMPRESA.razaoSocial);
    expect(html).toContain("Avenida São João, 802");
    expect(html).toContain(EMPRESA.email);
    // No phone yet: nothing fake is shown.
    expect(html).not.toContain("WhatsApp (");
    // Single seller: no "Vendedor" label, no placeholder left.
    expect(html).not.toMatch(/vendedor/i);
    expect(html).not.toContain("[a preencher]");
    expect(html).not.toContain("CPF");
  });
});

describe("organizationJsonLd", () => {
  const ld = organizationJsonLd(SITE);

  it("tem os campos do schema.org Organization", () => {
    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "Busca Agora",
      legalName: EMPRESA.razaoSocial,
      taxID: "69.919.406/0001-79",
      email: EMPRESA.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Avenida São João, 802, Apto 56",
        addressLocality: "São Paulo",
        addressRegion: "SP",
        postalCode: "01036-100",
        addressCountry: "BR",
      },
    });
  });

  it("só tem telefone quando houver um", () => {
    expect(ld).not.toHaveProperty("telephone");
    expect(
      organizationJsonLd(SITE, { ...EMPRESA, whatsapp: "5511999998888" }),
    ).toHaveProperty("telephone", "+5511999998888");
  });

  it("vira JSON válido dentro da tag script", () => {
    const parsed: unknown = JSON.parse(jsonLdScript(ld));
    expect(parsed).toEqual(ld);
  });
});
