import { describe, expect, it } from "vitest";

import { isLocalSupabase, supabaseStoragePatterns } from "@/lib/images";

describe("supabaseStoragePatterns", () => {
  it("allows only the public Storage path of the Supabase host", () => {
    expect(
      supabaseStoragePatterns("https://projeto-falso.supabase.co"),
    ).toEqual([
      {
        protocol: "https",
        hostname: "projeto-falso.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ]);
  });

  it("allows nothing when the URL is missing", () => {
    expect(supabaseStoragePatterns(undefined)).toEqual([]);
  });
});

describe("local Supabase", () => {
  it("keeps http and the port for 127.0.0.1", () => {
    expect(supabaseStoragePatterns("http://127.0.0.1:54321")).toEqual([
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
    ]);
  });

  it("allows local IPs only for the local Supabase", () => {
    expect(isLocalSupabase("http://127.0.0.1:54321")).toBe(true);
    expect(isLocalSupabase("https://projeto-falso.supabase.co")).toBe(false);
    expect(isLocalSupabase(undefined)).toBe(false);
  });
});
