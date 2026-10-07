import type { Database } from "@/lib/db/types";

import { errorText, MAX_ATTEMPTS, nextRunAt } from "./backoff";

// Pure worker loop: storage, handlers and alerts are passed in, so the unit
// tests run it without a database or network.

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobType = Database["public"]["Enums"]["job_type"];

/**
 * Throws to fail (the job is retried); returns to finish it. A returned
 * string finishes it without doing the work and says why (shown in admin).
 */
export type JobHandler = (job: Job) => Promise<string | void>;

export interface JobStore {
  claim(tipos: JobType[], limit: number): Promise<Job[]>;
  done(job: Job, skipped: string | null): Promise<void>;
  retry(job: Job, tentativas: number, runAt: Date, erro: string): Promise<void>;
  fail(job: Job, tentativas: number, erro: string): Promise<void>;
}

export type RunSummary = { done: number; retried: number; failed: number };

export async function runJobs(opts: {
  store: JobStore;
  handlers: Partial<Record<JobType, JobHandler>>;
  /** Called once when a job uses its last attempt. Must not throw. */
  onExhausted: (job: Job, erro: string) => Promise<void>;
  now?: () => Date;
  limit?: number;
}): Promise<RunSummary> {
  const now = opts.now ?? (() => new Date());
  const tipos = Object.keys(opts.handlers) as JobType[];
  const summary: RunSummary = { done: 0, retried: 0, failed: 0 };
  if (tipos.length === 0) return summary;

  const jobs = await opts.store.claim(tipos, opts.limit ?? 10);
  for (const job of jobs) {
    const handler = opts.handlers[job.tipo];
    try {
      if (!handler) throw new Error(`Sem executor para ${job.tipo}`);
      const skipped = await handler(job);
      await opts.store.done(job, skipped ?? null);
      summary.done++;
    } catch (e) {
      const erro = errorText(e);
      const tentativas = Math.min(job.tentativas + 1, MAX_ATTEMPTS);
      const runAt = nextRunAt(tentativas, now());
      if (runAt) {
        await opts.store.retry(job, tentativas, runAt, erro);
        summary.retried++;
      } else {
        await opts.store.fail(job, tentativas, erro);
        await opts.onExhausted(job, erro);
        summary.failed++;
      }
    }
  }
  return summary;
}
