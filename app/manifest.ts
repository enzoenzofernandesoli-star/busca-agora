import type { MetadataRoute } from "next";

// Installed app (PWA). start_url carries ?origem=pwa so the home shows the
// opening animation when launched from the home screen (phase 2).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Busca Agora",
    short_name: "Busca Agora",
    description: "Eletrônicos e cosméticos. Buscou? Tá aqui.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/?origem=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#3324F5",
    theme_color: "#3324F5",
    categories: ["shopping"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Buscar",
        url: "/busca",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Meus pedidos",
        url: "/conta/pedidos",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
