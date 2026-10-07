import { describe, expect, it, vi } from "vitest";

import { type Job, type JobStore, runJobs } from "@/lib/jobs/worker";

function job(over: Partial<Job> = {}): Job {
  return {
    id: "j1",
    tipo: "email",
    etapa: "paid",
    order_id: "o1",
    status: "running",
    tentativas: 0,
    ultimo_erro: null,
    run_at: "2026-10-08T12:00:00.000Z",
    created_at: "2026-10-08T12:00:00.000Z",
    updated_at: "2026-10-08T12:00:00.000Z",
    ...over,
  };
}

function fakeStore(jobs: Job[]) {
  const store = {
    claim: vi.fn<JobStore["claim"]>(async () => jobs),
    done: vi.fn<JobStore["done"]>(async () => {}),
    retry: vi.fn<JobStore["retry"]>(async () => {}),
    fail: vi.fn<JobStore["fail"]>(async () => {}),
  };
  return store;
}

const agora = new Date("2026-10-08T12:00:00.000Z");

describe("runJobs", () => {
  it("marks a job done when its handler succeeds", async () => {
    const store = fakeStore([job()]);
    const email = vi.fn(async () => {});
    const summary = await runJobs({
      store,
      handlers: { email },
      onExhausted: vi.fn(),
      now: () => agora,
    });
    expect(email).toHaveBeenCalledOnce();
    expect(store.done).toHaveBeenCalledOnce();
    expect(summary).toEqual({ done: 1, retried: 0, failed: 0 });
  });

  it("only claims the types it has handlers for", async () => {
    const store = fakeStore([]);
    await runJobs({
      store,
      handlers: { email: vi.fn(), notify: vi.fn() },
      onExhausted: vi.fn(),
    });
    expect(store.claim).toHaveBeenCalledWith(["email", "notify"], 10);
  });

  it("a failure is retried later, with the error kept and no secret in it", async () => {
    const store = fakeStore([job({ tentativas: 0 })]);
    const summary = await runJobs({
      store,
      handlers: {
        email: async () => {
          throw new Error("401 Bearer re_abcdefghijklmnopqrstuvwxyz123456");
        },
      },
      onExhausted: vi.fn(),
      now: () => agora,
    });
    expect(summary.retried).toBe(1);
    const [, tentativas, runAt, erro] = store.retry.mock.calls[0]!;
    expect(tentativas).toBe(1);
    expect(runAt.getTime()).toBe(agora.getTime() + 60_000);
    expect(erro).not.toContain("re_abcdefghijklmnopqrstuvwxyz123456");
  });

  it("the 5th failure gives up, marks failed and alerts once", async () => {
    const store = fakeStore([job({ tentativas: 4 })]);
    const onExhausted = vi.fn(async () => {});
    const summary = await runJobs({
      store,
      handlers: {
        email: async () => {
          throw new Error("Resend fora do ar");
        },
      },
      onExhausted,
      now: () => agora,
    });
    expect(summary.failed).toBe(1);
    expect(store.fail).toHaveBeenCalledWith(
      expect.objectContaining({ id: "j1" }),
      5,
      "Resend fora do ar",
    );
    expect(store.retry).not.toHaveBeenCalled();
    expect(onExhausted).toHaveBeenCalledOnce();
  });

  it("one failing job does not stop the others", async () => {
    const store = fakeStore([job({ id: "a" }), job({ id: "b" })]);
    const summary = await runJobs({
      store,
      handlers: {
        email: async (j) => {
          if (j.id === "a") throw new Error("falhou");
        },
      },
      onExhausted: vi.fn(),
      now: () => agora,
    });
    expect(summary).toEqual({ done: 1, retried: 1, failed: 0 });
  });
});
