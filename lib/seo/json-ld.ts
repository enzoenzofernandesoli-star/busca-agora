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
    seller: { "@type": "Organization", name: "Busca Agora" },
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
