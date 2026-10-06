"use client";

import Link from "next/link";

import { useFieldErrors, useFieldValue } from "@/components/conta/auth-form";

// Mandatory acceptance (phase 3). Never pre-checked.
export function TermsCheckbox() {
  const errors = useFieldErrors("aceite");
  const marcado = useFieldValue("aceite") === "on";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px] leading-normal">
        <input
          type="checkbox"
          name="aceite"
          required
          defaultChecked={marcado}
          aria-invalid={errors ? true : undefined}
          aria-describedby={errors ? "aceite-erro" : undefined}
          className="mt-0.5 size-5 flex-none accent-ultramar"
        />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="font-bold">
            Termos de uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="font-bold">
            Política de privacidade
          </Link>
          .
        </span>
      </label>
      {errors ? (
        <p id="aceite-erro" className="m-0 text-sm text-rosa-ink">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}
