import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/env-public";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or utility pages: nothing to index there.
      disallow: ["/admin", "/conta", "/checkout", "/carrinho", "/api/", "/dev/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
