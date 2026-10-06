"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BoxIcon,
  CartIcon,
  GridIcon,
  HomeIcon,
  UserIcon,
} from "@/components/loja/icons";
import { cn } from "@/lib/utils";

const items = [
  {
    label: "Início",
    href: "/",
    Icon: HomeIcon,
    match: (p: string) => p === "/",
  },
  {
    label: "Categorias",
    href: "/#categorias",
    Icon: GridIcon,
    match: (p: string) => p.startsWith("/c/"),
  },
  {
    label: "Carrinho",
    href: "/carrinho",
    Icon: CartIcon,
    match: (p: string) => p.startsWith("/carrinho"),
  },
  {
    label: "Pedidos",
    href: "/conta/pedidos",
    Icon: BoxIcon,
    match: (p: string) => p.startsWith("/conta/pedidos"),
  },
  {
    label: "Conta",
    href: "/conta",
    Icon: UserIcon,
    match: (p: string) =>
      p === "/conta" || p === "/entrar" || p === "/cadastro",
  },
];

/** App-style bottom bar, mobile only (< md). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-borda bg-white px-1 pt-2 pb-[max(22px,env(safe-area-inset-bottom))] md:hidden"
    >
      {items.map(({ label, href, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] no-underline",
              active
                ? "font-bold text-ultramar hover:text-ultramar"
                : "font-medium text-texto-2 hover:text-noite",
            )}
          >
            <Icon size={22} strokeWidth={active ? 2 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
