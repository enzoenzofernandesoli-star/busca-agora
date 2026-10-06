import path from "node:path";

import { defineConfig } from "vitest/config";

// Database tests: need the local Supabase running (npx supabase start).
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    globalSetup: ["tests/db/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Tests share one database; run files one after the other.
    fileParallelism: false,
  },
});
