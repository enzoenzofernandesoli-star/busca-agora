import { BottomNav } from "@/components/loja/bottom-nav";
import { Footer } from "@/components/loja/footer";
import { Header, MobileCategoryChips } from "@/components/loja/header";
import { TopBar } from "@/components/loja/top-bar";

// Cart arrives in phase 4; until then the counter stays at zero (badge hidden).
const CART_COUNT = 0;

export default function LojaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(78px+env(safe-area-inset-bottom))] md:pb-0">
      <TopBar />
      <Header cartCount={CART_COUNT} />
      <MobileCategoryChips />
      <main
        id="conteudo"
        className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pt-3 pb-6 md:gap-10 md:px-8 md:pt-8 md:pb-[72px]"
      >
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
