import { execSync } from "node:child_process";

// The store pages need products: seed the LOCAL Supabase (the script itself
// refuses any other database). Requires `npx supabase start`.
export default function globalSetup() {
  execSync("node scripts/seed-dev.ts", { stdio: "inherit" });
}
