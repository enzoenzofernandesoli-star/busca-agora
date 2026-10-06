"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { UserIcon } from "@/components/loja/icons";
import { createClient } from "@/lib/db/client";

// Header greeting. Read in the browser (session cookie, no network call) so
// the store pages stay cacheable for everyone. Display only: account pages
// check the session on the server.
export function AccountLink() {
  const [nome, setNome] = useState<string | null>(null);
  // Login and logout happen on the server (actions + redirect), which the
  // browser client does not hear about: re-read the cookie on navigation.
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    function fromSession(meta: Record<string, unknown> | undefined) {
      const raw = meta?.nome ?? meta?.full_name ?? meta?.name;
      const first = typeof raw === "string" ? raw.trim().split(/\s+/)[0] : "";
      return first || "cliente";
    }
    supabase.auth.getSession().then(({ data }) => {
      setNome(
        data.session ? fromSession(data.session.user.user_metadata) : null,
      );
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setNome(session ? fromSession(session.user.user_metadata) : null);
    });
    return () => data.subscription.unsubscribe();
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
