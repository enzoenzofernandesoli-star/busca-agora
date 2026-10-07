import { describe, expect, it } from "vitest";

import { photoPathFromUrl } from "@/lib/admin/storage-url";

const SUPABASE = "https://projeto-falso.supabase.co";
const DIR = `${SUPABASE}/storage/v1/object/public/produtos`;
const PATH = "2026-10/0b8f3c7e-1d2a-4f5b-9c6d-7e8f9a0b1c2d.webp";

describe("photoPathFromUrl", () => {
  it("returns the path of a photo uploaded to our bucket", () => {
    expect(photoPathFromUrl(`${DIR}/${PATH}`, SUPABASE)).toBe(PATH);
  });

  it.each([
    ["another bucket via ../", `${DIR}/../outro/${PATH}`],
    ["another bucket via %2e%2e", `${DIR}/%2e%2e/outro/${PATH}`],
    ["another bucket via .%2E", `${DIR}/.%2E/outro/${PATH}`],
    [
      "encoded slash",
      `${DIR}/2026-10%2F0b8f3c7e-1d2a-4f5b-9c6d-7e8f9a0b1c2d.webp`,
    ],
    ["another bucket", `${SUPABASE}/storage/v1/object/public/outro/${PATH}`],
    [
      "another host",
      `https://outro.supabase.co/storage/v1/object/public/produtos/${PATH}`,
    ],
    ["same host over http", `${DIR.replace("https", "http")}/${PATH}`],
    ["query string", `${DIR}/${PATH}?x=1`],
    ["fragment", `${DIR}/${PATH}#x`],
    [
      "user info",
      `https://a@projeto-falso.supabase.co/storage/v1/object/public/produtos/${PATH}`,
    ],
    ["a name we never hand out", `${DIR}/2026-10/foto.png`],
    [
      "a file type we never accept",
      `${DIR}/2026-10/0b8f3c7e-1d2a-4f5b-9c6d-7e8f9a0b1c2d.svg`,
    ],
    ["not a URL", "produtos/foto.png"],
  ])("rejects %s", (_caso, url) => {
    expect(photoPathFromUrl(url, SUPABASE)).toBeNull();
  });
});
