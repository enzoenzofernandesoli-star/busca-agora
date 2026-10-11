import { describe, expect, it } from "vitest";

import { typingFrames } from "@/components/loja/use-typing-placeholder";

describe("typingFrames", () => {
  it("types the example and deletes it back to the prefix", () => {
    expect(typingFrames("ab")).toEqual([
      "Busque a",
      "Busque ab",
      "Busque a",
      "Busque ",
    ]);
  });

  it("preserves accents", () => {
    expect(typingFrames("áç")).toEqual([
      "Busque á",
      "Busque áç",
      "Busque á",
      "Busque ",
    ]);
  });

  it("does not split Unicode surrogate pairs", () => {
    expect(typingFrames("𝄞a", "")).toEqual(["𝄞", "𝄞a", "𝄞", ""]);
  });

  it("supports a custom prefix and a single letter", () => {
    expect(typingFrames("a", "Procure ")).toEqual(["Procure a", "Procure "]);
  });

  it("returns no frames for an empty example", () => {
    expect(typingFrames("")).toEqual([]);
  });
});
