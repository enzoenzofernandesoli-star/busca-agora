"use client";

import { useFieldValue } from "@/components/conta/auth-form";

export const MARKETING_LABEL =
  "Quero receber ofertas, descontos e novidades por e-mail ou WhatsApp";

// Optional marketing consent (LGPD): separate from the terms, never
// pre-checked, never required. Inside AuthForm it keeps the value after an
// error; elsewhere pass `defaultChecked`.
export function MarketingCheckbox({
  defaultChecked,
}: {
  defaultChecked?: boolean;
}) {
  const echoed = useFieldValue("marketing") === "on";
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px] leading-normal">
      <input
        type="checkbox"
        name="marketing"
        defaultChecked={defaultChecked ?? echoed}
        className="mt-0.5 size-5 flex-none accent-ultramar"
      />
      <span>
        {MARKETING_LABEL}{" "}
        <span className="text-texto-2">
          (opcional, dá para desligar quando quiser)
        </span>
      </span>
    </label>
  );
}
