"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BoxIcon, CartIcon, HomeIcon, UserIcon } from "@/components/loja/icons";
import { cn } from "@/lib/utils";

// Every store page lights exactly one tab: the first match wins and
// anything else (home, categories, products, search, legal) is "Início".
const items = [
  {
    label: "Carrinho",
    href: "/carrinho",
    Icon: CartIcon,
    match: (p: string) =>
      p.startsWith("/carrinho") || p.startsWith("/checkout"),
  },
  {
    label: "Pedidos",
    href: "/conta/pedidos",
    Icon: BoxIcon,
    match: (p: string) =>
      p.startsWith("/conta/pedidos") ||
      p.startsWith("/pedido/") ||
      p.startsWith("/rastreio"),
  },
  {
    label: "Conta",
    href: "/conta",
    Icon: UserIcon,
    match: (p: string) =>
      p.startsWith("/conta") ||
      [
        "/entrar",
        "/cadastro",
        "/recuperar-senha",
        "/redefinir-senha",
        "/aceite-termos",
      ].includes(p),
  },
];
const home = { label: "Início", href: "/", Icon: HomeIcon };

function activeTab(pathname: string): string {
  return items.find((item) => item.match(pathname))?.label ?? home.label;
}

/** App-style bottom bar, mobile only (< md). */
export function BottomNav() {
  const active = activeTab(usePathname());

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-borda bg-white px-1 pt-2 pb-[max(22px,env(safe-area-inset-bottom))] md:hidden"
    >
      {[home, ...items].map(({ label, href, Icon }) => {
        const current = label === active;
        return (
          <Link
            key={label}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] no-underline",
              current
                ? "font-bold text-ultramar hover:text-ultramar"
                : "font-medium text-texto-2 hover:text-noite",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full",
                current && "bg-ultramar-50",
              )}
            >
              <Icon size={22} strokeWidth={current ? 2.2 : 1.8} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
