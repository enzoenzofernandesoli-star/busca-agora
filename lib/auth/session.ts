import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/db/server";

import { loginHref } from "./redirect";

export type CurrentUser = {
  id: string;
  email: string;
  nome: string;
  role: "customer" | "admin";
};

/**
 * The logged-in customer, checked against Supabase Auth (getUser validates
 * the token with the server; never trust the cookie alone). One lookup per
 * request thanks to React cache.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    nome: profile?.nome ?? "",
    role: profile?.role ?? "customer",
  };
});

/** For account pages and actions: the user, or a redirect to /entrar. */
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginHref(next));
  return user;
}

/**
 * For /admin: the role is read from the database on every request. The
 * proxy only does a fast redirect for logged-out visitors; this is the
 * check that counts. Customers get a 404, so /admin does not advertise it
 * exists.
 */
export async function requireAdmin(next = "/admin"): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (user.role !== "admin") notFound();
  return user;
}
