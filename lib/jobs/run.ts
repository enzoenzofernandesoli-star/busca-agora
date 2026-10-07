import "server-only";

import { after } from "next/server";

import { defaultHandlers, exhaustedAlert } from "./handlers";
import { supabaseJobStore } from "./store";
import { runJobs } from "./worker";

export function runDueJobs() {
  return runJobs({
    store: supabaseJobStore(),
    handlers: defaultHandlers(),
    onExhausted: exhaustedAlert(),
  });
}

/**
 * Runs the queue right after the response is sent, so a notice goes out in
 * seconds instead of waiting for the next minute tick. Call after changing an
 * order's status or enqueueing a job.
 */
export function kickJobs() {
  after(async () => {
    try {
      await runDueJobs();
    } catch {
      // The minute tick picks the jobs up anyway.
    }
  });
}
