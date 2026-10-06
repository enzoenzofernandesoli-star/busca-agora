import type { MetadataRoute } from "next";

import { getAllProductSlugs } from "@/lib/catalog/queries";
import { publicEnv } from "@/lib/env-public";

// Rebuilt at most once an hour.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const produtos = await getAllProductSlugs();

  return [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    {
      url: `${siteUrl}/c/eletronicos`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/c/cosmeticos`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...produtos.map((p) => ({
      url: `${siteUrl}/p/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
