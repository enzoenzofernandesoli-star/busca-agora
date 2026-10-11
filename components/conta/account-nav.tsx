"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, PinIcon, UserIcon } from "@/components/loja/icons";

const items = [
  { label: "Meus dados", href: "/conta", Icon: UserIcon },
  { label: "Endereços", href: "/conta/enderecos", Icon: PinIcon },
  { label: "Pedidos", href: "/conta/pedidos", Icon: BoxIcon },
];

export function AccountNav({
  nome,
  admin = false,
}: {
  nome: string;
  /** Shows "Painel da loja" (the panel itself checks the role again). */
  admin?: boolean;
}) {
  const pathname = usePathname();
  const firstName = nome.trim().split(/\s+/)[0] || "visitante";
  const itemClass =
    "inline-flex min-h-11 shrink-0 items-center gap-3 rounded-full px-4 font-sans text-[15px] font-bold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar md:w-full md:rounded-[14px]";
  // Mobile: the three sections share the width equally, icon over label,
  // so "Pedidos" is never cut off (audit 11/10).
  const tabClass =
    "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[14px] px-2 font-sans text-[13px] font-bold transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar md:min-h-11 md:w-full md:flex-row md:justify-start md:gap-3 md:px-4 md:text-[15px]";
  return (
    <nav
      aria-label="Menu da conta"
      className="min-w-0 md:w-[260px] md:shrink-0 md:rounded-[22px] md:border md:border-borda md:bg-white md:p-5"
    >
      <p className="mb-5 hidden font-display text-lg font-bold text-noite md:block">
        Olá, {firstName}
      </p>
      <ul className="m-0 grid list-none grid-cols-3 gap-2 p-1 md:flex md:flex-col">
        {items.map(({ label, href, Icon }) => {
          const active =
            href === "/conta"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`${tabClass} ${active ? "bg-ultramar-50 text-ultramar" : "bg-white text-noite hover:bg-fundo"}`}
              >
                <Icon size={20} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-1 md:flex-col">
        {admin ? (
          <li className="shrink-0">
            <Link
              href="/admin"
              className={`${itemClass} bg-lima text-noite hover:bg-lima/80`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Painel da loja
            </Link>
          </li>
        ) : null}
        <li className="shrink-0">
          <form action="/auth/sair" method="post">
            <button
              type="submit"
              className={`${itemClass} bg-white text-noite hover:bg-fundo`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sair
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
