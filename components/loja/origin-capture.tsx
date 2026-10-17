"use client";

import { useEffect } from "react";

import {
  ORIGIN_COOKIE,
  ORIGIN_MAX_AGE,
  originFromSearch,
} from "@/lib/attribution/origin";

/**
 * Saves the landing UTM/ref in a first-party cookie for 30 days (a new
 * visit with UTM replaces it). Runs in the browser so cached pages stay
 * static; the server re-validates the cookie before using it.
 */
export function OriginCapture() {
  useEffect(() => {
    const origin = originFromSearch(window.location.search);
    if (!origin) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ORIGIN_COOKIE}=${encodeURIComponent(JSON.stringify(origin))}; Max-Age=${ORIGIN_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  }, []);
  return null;
}
