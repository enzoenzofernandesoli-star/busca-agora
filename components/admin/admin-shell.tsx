"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

const entries = [
  {
    title: "Painel",
    href: "/admin",
    path: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  },
  {
    title: "Pedidos",
    href: "/admin/pedidos",
    path: "m3 7 9-4 9 4v10l-9 4-9-4ZM3 7l9 5 9-5M12 12v9",
  },
  {
    title: "Produtos",
    href: "/admin/produtos",
    path: "M4 4h16v16H4zM4 9h16M9 4v5",
  },
  {
    title: "Categorias",
    href: "/admin/categorias",
    path: "M4 6h16M4 12h16M4 18h16",
  },
  {
    title: "Banners",
    href: "/admin/banners",
    path: "M3 4h18v16H3zM3 16l5-5 4 4 4-6 5 7M7 8h.01",
  },
  {
    title: "Clientes",
    href: "/admin/clientes",
    path: "M8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 21v-2a8 8 0 0 1 16 0v2",
  },
  {
    title: "Configurações",
    href: "/admin/configuracoes",
    path: "M4 7h16M4 17h16M8 4v6M16 14v6",
  },
  {
    title: "Equipe",
    href: "/admin/equipe",
    path: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
];
const focusClass =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar";

export function AdminShell({
  children,
  nome,
}: {
  children: ReactNode;
  nome: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const firstName = nome.trim().split(/\s+/)[0] || "administrador";
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeDesktop = () => {
      if (media.matches) dialogRef.current?.close();
    };
    media.addEventListener("change", closeDesktop);
    return () => media.removeEventListener("change", closeDesktop);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function menu() {
    return (
      <div className="flex min-h-full flex-col gap-6 p-5">
        <Image
          src="/brand/logo-d-branco.svg"
          alt="Busca Agora"
          width={177}
          height={28}
          unoptimized
          style={{ width: "auto", height: 28 }}
          className="h-7 w-auto"
        />
        <nav aria-label="Administração">
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => {
              const active =
                entry.href === "/admin"
                  ? pathname === entry.href
                  : pathname === entry.href ||
                    pathname.startsWith(`${entry.href}/`);
              return (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-[15px] font-bold ${focusClass} ${active ? "bg-ultramar text-white" : "text-white hover:bg-white/10"}`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d={entry.path} />
                    </svg>
                    {entry.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-white/20 pt-4">
          <Link
            href="/"
            className={`flex min-h-12 items-center rounded-[14px] px-3 text-white ${focusClass}`}
          >
            Ver a loja
          </Link>
          <form action="/auth/sair" method="post">
            <button
              type="submit"
              className={`min-h-12 w-full rounded-[14px] px-3 text-left text-white ${focusClass}`}
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-dvh bg-fundo font-sans text-noite md:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] overflow-y-auto bg-noite text-white md:block">
        {menu()}
      </aside>
      <header className="flex min-h-16 items-center justify-between gap-4 bg-noite px-6 text-white md:hidden">
        <Image
          src="/brand/logo-d-branco.svg"
          alt="Busca Agora"
          width={177}
          height={28}
          unoptimized
          style={{ width: "auto", height: 28 }}
          className="h-7 w-auto"
        />
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            dialogRef.current?.showModal();
            setOpen(true);
          }}
          className={`flex min-h-12 items-center gap-2 rounded-[14px] px-3 font-bold ${focusClass}`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Menu
        </button>
      </header>
      <dialog
        ref={dialogRef}
        id={id}
        aria-label="Menu administrativo"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]',
            ),
          ).filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus({ preventScroll: true });
        }}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.target === event.currentTarget &&
            (event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom)
          )
            dialogRef.current?.close();
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[248px] max-w-[90vw] border-0 bg-noite p-0 text-white backdrop:bg-noite/60 md:hidden"
      >
        <div
          onClickCapture={(event) => {
            if ((event.target as Element).closest("a"))
              dialogRef.current?.close();
          }}
        >
          {menu()}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={`mx-5 mb-5 min-h-12 rounded-[14px] border border-white/40 px-4 ${focusClass}`}
          >
            Fechar menu
          </button>
        </div>
      </dialog>
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-6 md:p-10">
        <p className="font-display text-xl font-bold">Olá, {firstName}</p>
        {children}
      </main>
    </div>
  );
}
