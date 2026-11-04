import { BottomNav } from "@/components/loja/bottom-nav";
import { CookieNotice } from "@/components/loja/cookie-notice";
import { Footer } from "@/components/loja/footer";
import { Header, MobileCategoryChips } from "@/components/loja/header";
import { OriginCapture } from "@/components/loja/origin-capture";
import { MotionGate } from "@/components/loja/motion-gate";
import { TopBar } from "@/components/loja/top-bar";
import { publicEnv } from "@/lib/env-public";
import { jsonLdScript, organizationJsonLd } from "@/lib/seo/json-ld";

export default function LojaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(56px+max(22px,env(safe-area-inset-bottom)))] md:pb-0">
      <TopBar />
      <Header />
      <MobileCategoryChips />
      <main
        id="conteudo"
        className="mx-auto flex w-full max-w-[1760px] flex-1 flex-col gap-6 px-4 pt-3 pb-6 md:gap-10 md:px-8 md:pt-8 md:pb-[72px] 2xl:px-14"
      >
        {children}
      </main>
      <Footer />
      <BottomNav />
      <CookieNotice />
      <MotionGate />
      <OriginCapture />
      <script
        type="application/ld+json"
        // jsonLdScript escapes "<", so the payload cannot close this tag.
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(organizationJsonLd(siteUrl)),
        }}
      />
    </div>
  );
}
