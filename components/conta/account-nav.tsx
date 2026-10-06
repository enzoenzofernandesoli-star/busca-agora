"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, PinIcon, UserIcon } from "@/components/loja/icons";

const items = [
  { label: "Meus dados", href: "/conta", Icon: UserIcon },
  { label: "Endereços", href: "/conta/enderecos", Icon: PinIcon },
  { label: "Pedidos", href: "/conta/pedidos", Icon: BoxIcon },
];

export function AccountNav({ nome }: { nome: string }) {
  const pathname = usePathname();
  const firstName = nome.trim().split(/\s+/)[0] || "visitante";
  const itemClass =
    "inline-flex min-h-11 shrink-0 items-center gap-3 rounded-full px-4 font-sans text-[15px] font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar md:w-full md:rounded-[14px]";
  return (
    <nav
      aria-label="Menu da conta"
      className="min-w-0 md:w-[260px] md:shrink-0 md:rounded-[22px] md:border md:border-borda md:bg-white md:p-5"
    >
      <p className="mb-5 hidden font-display text-lg font-bold text-noite md:block">
        Olá, {firstName}
      </p>
      <ul className="flex gap-2 overflow-x-auto p-1 md:flex-col md:overflow-visible">
        {items.map(({ label, href, Icon }) => {
          const active =
            href === "/conta"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`${itemClass} ${active ? "bg-ultramar-50 text-ultramar" : "bg-white text-noite hover:bg-fundo"}`}
              >
                <Icon size={20} />
                {label}
              </Link>
            </li>
          );
        })}
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
