import type { Metadata, Viewport } from "next";
import { DM_Sans, Sora } from "next/font/google";

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
  weight: ["400", "500", "700"],
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
        {children}
      </body>
    </html>
  );
}
