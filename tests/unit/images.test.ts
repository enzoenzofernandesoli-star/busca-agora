import { describe, expect, it } from "vitest";

import { supabaseStoragePatterns } from "@/lib/images";

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
