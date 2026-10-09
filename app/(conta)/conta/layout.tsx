import { redirect } from "next/navigation";

import { AccountNav } from "@/components/conta/account-nav";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";

// Every /conta page: server-side session check (the proxy redirect is only
// a shortcut) and the account menu.
export default async function ContaLayout({ children }: LayoutProps<"/conta">) {
  const user = await requireUser("/conta");

  // Google sign-ups accept the terms before using the account.
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("terms_accepted_at")
    .eq("id", user.id)
    .single();
  if (!profile?.terms_accepted_at) redirect("/aceite-termos");

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
      <AccountNav nome={user.nome} admin={user.role === "admin"} />
      <div className="flex min-w-0 flex-1 flex-col gap-5">{children}</div>
    </div>
  );
}
