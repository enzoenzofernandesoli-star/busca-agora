import "server-only";

import { createAdminClient } from "@/lib/db/admin";

import type { Job, JobStore } from "./worker";

type Admin = ReturnType<typeof createAdminClient>;

async function update(
  admin: Admin,
  job: Job,
  values: Partial<
    Pick<Job, "status" | "tentativas" | "ultimo_erro" | "run_at">
  >,
) {
  // Only the worker that claimed it (status still running) closes the job.
  const { error } = await admin
    .from("jobs")
    .update(values)
    .eq("id", job.id)
    .eq("status", "running");
  if (error) throw new Error(`jobs: ${error.message}`);
}

export function supabaseJobStore(admin = createAdminClient()): JobStore {
  return {
    async claim(tipos, limit) {
      const { data, error } = await admin.rpc("claim_jobs", {
        p_tipos: tipos,
        p_limit: limit,
      });
      if (error) throw new Error(`claim_jobs: ${error.message}`);
      return data ?? [];
    },
    done: (job) => update(admin, job, { status: "done", ultimo_erro: null }),
    retry: (job, tentativas, runAt, erro) =>
      update(admin, job, {
        status: "pending",
        tentativas,
        ultimo_erro: erro,
        run_at: runAt.toISOString(),
      }),
    async fail(job, tentativas, erro) {
      await update(admin, job, {
        status: "failed",
        tentativas,
        ultimo_erro: erro,
      });
      await admin.from("order_events").insert({
        order_id: job.order_id,
        evento: "job_falhou",
        // The error text stays in jobs (admin only): customers read their
        // order's events.
        detalhe: { tipo: job.tipo, etapa: job.etapa, tentativas },
      });
    },
  };
}
