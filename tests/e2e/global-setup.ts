import { execSync } from "node:child_process";

import { localAdmin } from "./supabase";

// The store pages need products: seed the LOCAL Supabase (the script itself
// refuses any other database). Requires `npx supabase start`.
// Login/signup rate limits are cleared, so repeated runs from 127.0.0.1 do
// not lock themselves out (the limits have their own tests in tests/db).
export default async function globalSetup() {
  execSync("node scripts/seed-dev.ts", { stdio: "inherit" });
  const { error } = await localAdmin()
    .from("auth_rate_limits")
    .delete()
    .neq("chave", "");
  if (error) throw error;
}
