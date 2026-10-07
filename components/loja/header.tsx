import Link from "next/link";

import { CartButton } from "@/components/loja/cart-button";
import { CategoryNav } from "@/components/loja/category-nav";
import { CepButton } from "@/components/loja/cep-button";
import { PhoneIcon } from "@/components/loja/icons";
import { LogoD } from "@/components/loja/logo";
import { AccountLink } from "@/components/loja/account-link";
import { SearchForm } from "@/components/loja/search-form";
import { CategoryChip } from "@/components/loja/category-chip";
import { navCategories } from "@/lib/site";

/** Desktop header (>= md), per docs/design/Home.dc.html. */
function HeaderDesktop() {
  return (
    <div className="hidden md:block">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-8 gap-y-5 px-8 pt-5">
        <Link
          href="/"
          aria-label="Busca Agora, página inicial"
          className="flex min-h-11 flex-none items-center"
        >
          <LogoD height={38} priority />
        </Link>
        <SearchForm
          id="busca"
          variant="desktop"
          placeholder="Busque fones, smartwatches, skincare..."
          className="flex-[1_1_420px]"
        />
        <nav aria-label="Conta" className="flex flex-none items-center gap-7">
          <AccountLink />
          <Link
            href="/conta/pedidos"
            className="flex min-h-11 flex-col justify-center leading-[1.2] text-white no-underline hover:text-white"
          >
            <span className="text-xs text-lavanda">Acompanhe</span>
            <span className="text-[15px] font-bold">Meus pedidos</span>
          </Link>
          <CartButton variant="desktop" />
        </nav>
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-7 gap-y-3 px-8 pt-3.5 pb-4 text-[15px]">
        <CepButton variant="desktop" />
        <CategoryNav />
        <Link
          href="/#instalar"
          className="ml-auto inline-flex min-h-11 items-center gap-2 text-sm text-lima no-underline hover:text-lima hover:underline"
        >
          <PhoneIcon size={18} />
          Instale no celular
        </Link>
      </div>
    </div>
  );
}

/** Compact mobile header (< md), per docs/design/Celular-Home.dc.html. */
function HeaderMobile() {
  return (
    <div className="flex flex-col gap-3.5 px-4 pt-[18px] pb-4 md:hidden">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Busca Agora, início"
          className="flex min-h-11 items-center"
        >
          <LogoD height={26} priority />
        </Link>
        <CartButton variant="mobile" />
      </div>
      <SearchForm
        id="busca-m"
        variant="mobile"
        placeholder="O que você está buscando?"
      />
      <CepButton variant="mobile" />
    </div>
  );
}

export function Header() {
  return (
    <header className="bg-ultramar text-white">
      <HeaderDesktop />
      <HeaderMobile />
    </header>
  );
}

/** Mobile category chips under the header (< md). */
export function MobileCategoryChips() {
  return (
    <nav
      aria-label="Categorias"
      className="scrollbar-none flex gap-2 overflow-x-auto px-4 pt-4 pb-1 md:hidden"
    >
      {navCategories.map((c) => (
        <CategoryChip key={c.href} href={c.href} label={c.label} cor={c.cor} />
      ))}
    </nav>
  );
}
