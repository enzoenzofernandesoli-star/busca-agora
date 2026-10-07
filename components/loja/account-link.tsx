"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { UserIcon } from "@/components/loja/icons";
import { firstNameFromCookies } from "@/lib/auth/session-cookie";

// Header greeting, read from the session cookie in the browser so the store
// pages stay cacheable for everyone. Display only: account pages check the
// session on the server.
export function AccountLink() {
  const [nome, setNome] = useState<string | null>(null);
  // Login and logout happen on the server (actions + redirect): re-read the
  // cookie on every navigation.
  const pathname = usePathname();

  useEffect(() => {
    setNome(firstNameFromCookies(document.cookie));
  }, [pathname]);

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
