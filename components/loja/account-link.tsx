"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { UserIcon } from "@/components/loja/icons";
import { firstNameFromCookies } from "@/lib/auth/session-cookie";

// Header greeting, read from the session cookie in the browser so the store
// pages stay cacheable for everyone. Display only: account pages check the
// session on the server.
const noSubscription = () => () => {};

export function AccountLink() {
  // Login and logout happen on the server (actions + redirect): the
  // navigation re-renders this, and the snapshot re-reads the cookie.
  usePathname();
  const nome = useSyncExternalStore(
    noSubscription,
    () => firstNameFromCookies(document.cookie),
    // Server and first render: the logged-out label (no document).
    () => null,
  );

  return (
    <Link
      href={nome ? "/conta" : "/entrar"}
      className="flex min-h-11 items-center gap-2.5 text-white no-underline hover:text-white"
    >
      <UserIcon size={26} />
      <span className="flex flex-col leading-[1.2]">
        <span className="text-xs text-lavanda">
          {nome ? `Olá, ${nome}` : "Olá, faça seu"}
        </span>
        <span className="text-[15px] font-bold">
          {nome ? "Minha conta" : "login"}
        </span>
      </span>
    </Link>
  );
}
