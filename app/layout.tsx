import type { Metadata, Viewport } from "next";
import { DM_Sans, Sora } from "next/font/google";

import { Suspense } from "react";

import { NavigationProgress } from "@/components/navegacao/navigation-progress";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";

import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://buscaagora.com.br",
  ),
  title: {
    default: "Busca Agora · Buscou? Tá aqui.",
    template: "%s · Busca Agora",
  },
  description:
    "Eletrônicos e cosméticos selecionados, com frete calculado no seu CEP e nota fiscal em todo pedido.",
  // Default share image: app/opengraph-image.png (logo + slogan).
  // Installed app on iPhone (Android reads app/manifest.ts).
  appleWebApp: {
    capable: true,
    title: "Busca Agora",
    statusBarStyle: "default",
  },
  icons: { apple: "/icons/apple-touch-icon.png" },
  openGraph: {
    siteName: "Busca Agora",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#3324F5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} ${dmSans.variable} antialiased`}
    >
      <body className="min-h-dvh bg-fundo font-sans text-noite">
        {/* useSearchParams needs a boundary so static pages stay static. */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
