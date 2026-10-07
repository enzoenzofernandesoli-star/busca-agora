import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Busca Agora" },
  robots: { index: false, follow: false },
};

// Role checked on the server, from the database, on every request.
// Customers get a 404 (lib/auth/session.ts). Each action checks again.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin("/admin");
  return <AdminShell nome={user.nome || user.email}>{children}</AdminShell>;
}
