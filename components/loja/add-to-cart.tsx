"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type AddToCartProps = {
  variantId: string;
  quantidade: number;
  disponivel: boolean;
  addToCart: (
    formData: FormData,
  ) => Promise<{ ok: boolean; message?: string; cartCount?: number }>;
};
type Feedback = { key: string; added: boolean; error?: string };

export function AddToCart({
  variantId,
  quantidade,
  disponivel,
  addToCart,
}: AddToCartProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const key = `${variantId}:${quantidade}`;
  const current = feedback?.key === key ? feedback : null;
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  function submit(buyNow: boolean) {
    if (!disponivel || busyRef.current) return;
    busyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setFeedback(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("variantId", variantId);
      formData.set("quantidade", String(quantidade));
      try {
        const result = await addToCart(formData);
        if (!result.ok) {
          setFeedback({
            key,
            added: false,
            error:
              result.message ||
              "Não foi possível adicionar ao carrinho. Tente de novo.",
          });
          return;
        }
        if (result.cartCount !== undefined)
          window.dispatchEvent(
            new CustomEvent("ba:carrinho", {
              detail: { count: result.cartCount },
            }),
          );
        setFeedback({ key, added: true });
        if (buyNow) router.push("/carrinho");
        else
          timerRef.current = setTimeout(
            () =>
              setFeedback((previous) =>
                previous?.key === key ? null : previous,
              ),
            2000,
          );
      } catch {
        setFeedback({
          key,
          added: false,
          error: "Não foi possível adicionar ao carrinho. Tente de novo.",
        });
      } finally {
        busyRef.current = false;
      }
    });
  }

  const buttonClass =
    "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 font-display text-[17px] font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar disabled:cursor-not-allowed disabled:opacity-60";
  return (
    <div aria-busy={pending} className="flex flex-col gap-2.5 font-sans">
      {!disponivel ? (
        <button
          type="button"
          disabled
          className={`${buttonClass} bg-ultramar text-white`}
        >
          Esgotado
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={pending}
            className={`${buttonClass} bg-ultramar text-white hover:bg-ultramar-700`}
          >
            Comprar agora
          </button>
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={pending}
            className={`${buttonClass} border-2 border-ultramar bg-white text-ultramar`}
          >
            {current?.added ? (
              <>
                Adicionado
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4 10-10" />
                </svg>
              </>
            ) : (
              "Adicionar ao carrinho"
            )}
          </button>
        </>
      )}
      {current?.error && (
        <p role="alert" className="text-sm text-rosa-ink">
          {current.error}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {current?.added ? "Produto adicionado ao carrinho" : ""}
      </p>
    </div>
  );
}
