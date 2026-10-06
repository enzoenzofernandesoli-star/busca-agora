import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

// Local Supabase only (same guard as tests/db and scripts/seed-dev.ts).
export function localAdmin() {
  const output = execSync("npx supabase status -o json", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const status = JSON.parse(output.slice(output.indexOf("{"))) as {
    API_URL: string;
    SERVICE_ROLE_KEY: string;
  };
  const host = new URL(status.API_URL).hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(`e2e só roda no Supabase local, não em ${host}`);
  }
  return createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A confirmed customer who already accepted the terms. */
export async function createTestCustomer(nome = "Cliente E2E") {
  const admin = localAdmin();
  const email = `e2e-${randomUUID().slice(0, 8)}@example.test`;
  const senha = `Senha${randomUUID().slice(0, 6)}1`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error || !data.user) throw error ?? new Error("createUser");
  await admin
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", data.user.id);
  return { id: data.user.id, email, senha };
}
