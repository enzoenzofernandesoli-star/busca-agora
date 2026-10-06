import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Role checked on the server, from the database, on every request.
// Customers get a 404 (lib/auth/session.ts). The panel itself is phase 8.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin("/admin");
  return (
    <div className="min-h-dvh bg-fundo font-sans text-noite">{children}</div>
  );
}
