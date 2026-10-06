import { execFileSync } from "node:child_process";

import type { TestProject } from "vitest/node";

/**
 * Database tests run ONLY against the local Supabase (`npx supabase start`),
 * never against the real project. The local URL and keys come from
 * `supabase status`; they are the local stack's own keys, not secrets.
 */
export default function setup(project: TestProject) {
  let output: string;
  try {
    output = execFileSync("npx", ["supabase", "status", "-o", "json"], {
      encoding: "utf8",
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error(
      "Supabase local não está rodando. Abra o Docker Desktop e rode: npx supabase start",
    );
  }

  const status = JSON.parse(output.slice(output.indexOf("{"))) as Record<
    string,
    string | undefined
  >;
  const url = status.API_URL;
  const anonKey = status.ANON_KEY;
  const serviceRoleKey = status.SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      "supabase status não devolveu API_URL, ANON_KEY e SERVICE_ROLE_KEY",
    );
  }

  const host = new URL(url).hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(
      `Testes de banco só rodam no Supabase local, não em ${host}`,
    );
  }

  project.provide("supabaseLocal", { url, anonKey, serviceRoleKey });
}

declare module "vitest" {
  export interface ProvidedContext {
    supabaseLocal: { url: string; anonKey: string; serviceRoleKey: string };
  }
}
