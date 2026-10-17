"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const responseSchema = z.object({ status: z.string().min(1) });
const MAX_WAIT = 30 * 60 * 1000;

export function OrderStatusPoller({
  numero,
  status,
}: {
  numero: string;
  status: string;
}) {
  const router = useRouter();
  const started = useRef<{ numero: string; at: number } | null>(null);
  const [message, setMessage] = useState("Aguardando pagamento…");

  useEffect(() => {
    if (status !== "pending_payment") return;
    if (started.current?.numero !== numero)
      started.current = { numero, at: Date.now() };
    const deadline = started.current.at + MAX_WAIT;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | undefined;

    function pause() {
      clearTimeout(timer);
      request?.abort();
    }
    function schedule() {
      if (stopped || document.hidden) return;
      if (Date.now() >= deadline) {
        setMessage(
          "Atualização automática encerrada. Recarregue a página para consultar o pagamento.",
        );
        return;
      }
      timer = setTimeout(
        () => {
          void poll();
        },
        Math.min(4000, deadline - Date.now()),
      );
    }
    async function poll() {
      if (stopped || document.hidden || Date.now() >= deadline) {
        schedule();
        return;
      }
      const controller = new AbortController();
      request = controller;
      const timeout = setTimeout(
        () => controller.abort(),
        Math.min(10000, deadline - Date.now()),
      );
      try {
        const response = await fetch(
          `/api/pedidos/${encodeURIComponent(numero)}/status`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw new Error("Order status request failed");
        const parsed = responseSchema.safeParse(await response.json());
        if (
          controller.signal.aborted ||
          stopped ||
          document.hidden ||
          Date.now() >= deadline
        )
          return;
        if (!parsed.success) throw new Error("Invalid order status");
        if (parsed.data.status !== status) {
          stopped = true;
          router.refresh();
          return;
        }
        setMessage("Aguardando pagamento…");
      } catch {
        if (!stopped && !document.hidden && !controller.signal.aborted)
          setMessage("Não foi possível consultar agora. Tentaremos novamente…");
      } finally {
        clearTimeout(timeout);
        // A hidden request must not restart the timer after the tab resumes.
        if (request === controller) {
          request = undefined;
          schedule();
        }
      }
    }
    function visibilityChanged() {
      pause();
      request = undefined;
      schedule();
    }
    const expiry = setTimeout(
      () => {
        stopped = true;
        pause();
        setMessage(
          "Atualização automática encerrada. Recarregue a página para consultar o pagamento.",
        );
      },
      Math.max(0, deadline - Date.now()),
    );
    document.addEventListener("visibilitychange", visibilityChanged);
    schedule();
    return () => {
      stopped = true;
      pause();
      clearTimeout(expiry);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [numero, status, router]);

  return status === "pending_payment" ? (
    <p role="status" aria-live="polite" className="text-sm text-texto-2">
      {message}
    </p>
  ) : null;
}
