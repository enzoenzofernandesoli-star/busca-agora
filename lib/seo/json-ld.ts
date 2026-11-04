import {
  EMPRESA,
  formatCep,
  formatCnpj,
  type Empresa,
} from "@/lib/config/empresa";

export type ProductJsonLdInput = {
  siteUrl: string;
  slug: string;
  nome: string;
  descricao: string;
  imagens: string[];
  marca?: string;
  sku: string;
  precoCents: number;
  precoMaxCents?: number;
  emEstoque: boolean;
  categoria: string;
};

function priceString(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new TypeError("Price must be a non-negative safe integer in cents");
  }
  return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

/** Same id on every page, so the product seller points at the store. */
export function organizationId(siteUrl: string): string {
  return `${siteUrl}/#organization`;
}

/** The seller (schema.org Organization), from lib/config/empresa.ts. */
export function organizationJsonLd(siteUrl: string, e: Empresa = EMPRESA) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(siteUrl),
    name: e.nomeFantasia,
    legalName: e.razaoSocial,
    taxID: formatCnpj(e.cnpj),
    url: siteUrl,
    logo: `${siteUrl}/brand/logo-e-escuro.svg`,
    email: e.email,
    ...(e.whatsapp ? { telephone: `+${e.whatsapp}` } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: [
        e.endereco.logradouro,
        e.endereco.numero,
        e.endereco.complemento,
      ]
        .filter(Boolean)
        .join(", "),
      addressLocality: e.endereco.cidade,
      addressRegion: e.endereco.uf,
      postalCode: formatCep(e.endereco.cep),
      addressCountry: "BR",
    },
  };
}

export function productJsonLd(input: ProductJsonLdInput) {
  const price = priceString(input.precoCents);
  const maxPrice =
    input.precoMaxCents === undefined
      ? undefined
      : priceString(input.precoMaxCents);
  const offer = {
    priceCurrency: "BRL",
    availability: `https://schema.org/${input.emEstoque ? "InStock" : "OutOfStock"}`,
    url: `${input.siteUrl}/p/${input.slug}`,
    seller: {
      "@type": "Organization",
      "@id": organizationId(input.siteUrl),
      name: EMPRESA.nomeFantasia,
    },
  };
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.nome,
    description: input.descricao,
    image: [...input.imagens],
    sku: input.sku,
    category: input.categoria,
    ...(input.marca ? { brand: { "@type": "Brand", name: input.marca } } : {}),
    offers:
      maxPrice !== undefined &&
      input.precoMaxCents !== undefined &&
      input.precoMaxCents > input.precoCents
        ? {
            ...offer,
            "@type": "AggregateOffer",
            lowPrice: price,
            highPrice: maxPrice,
          }
        : { ...offer, "@type": "Offer", price },
  };
}

export function breadcrumbJsonLd(
  siteUrl: string,
  itens: { nome: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.nome,
      item: siteUrl + item.path,
    })),
  };
}

export function jsonLdScript(data: unknown): string {
  const json = JSON.stringify(data);
  if (json === undefined) throw new TypeError("Data must be JSON serializable");
  return json.replace(/</g, "\\u003c");
}
