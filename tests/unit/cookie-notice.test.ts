import { describe, expect, it } from "vitest";
import { shouldShowNotice } from "@/components/loja/cookie-notice";

describe("cookie notice", () => {
  it.each([
    "",
    "a=1; b=2",
    "ba_cookies_ok_x=1",
    "x_ba_cookies_ok=1",
    "a=ba_cookies_ok=1",
  ])("shows when the exact cookie is missing: %s", (header) => {
    expect(shouldShowNotice(header)).toBe(true);
  });
  it.each([
    "ba_cookies_ok=1",
    "a=1; ba_cookies_ok=1; b=2",
    "  ba_cookies_ok=1  ",
    "ba_cookies_ok=",
  ])("hides when the exact cookie exists: %s", (header) => {
    expect(shouldShowNotice(header)).toBe(false);
  });
});
