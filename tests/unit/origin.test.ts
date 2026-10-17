import { describe, expect, it } from "vitest";

import { originFromSearch, parseOriginCookie } from "@/lib/attribution/origin";

describe("origem da visita (UTM e ref)", () => {
  it("lê UTM e ref da URL", () => {
    expect(
      originFromSearch(
        "?utm_source=Instagram&utm_medium=social&utm_campaign=lancamento&ref=joana",
      ),
    ).toEqual({
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "lancamento",
      ref: "joana",
    });
  });

  it("sem UTM não substitui a origem anterior", () => {
    expect(originFromSearch("?q=fone")).toBeNull();
    expect(originFromSearch("")).toBeNull();
  });

  it("recusa valores estranhos ou longos", () => {
    expect(originFromSearch("?utm_source=<script>")).toBeNull();
    expect(originFromSearch(`?ref=${"a".repeat(101)}`)).toBeNull();
  });

  it("o cookie adulterado é ignorado", () => {
    expect(parseOriginCookie("nao-e-json")).toBeNull();
    expect(
      parseOriginCookie(encodeURIComponent(JSON.stringify({ ref: "<x>" }))),
    ).toBeNull();
    expect(
      parseOriginCookie(encodeURIComponent(JSON.stringify({ ref: "joana" }))),
    ).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      ref: "joana",
    });
  });
});
