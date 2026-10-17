"use client";

import { AuthForm } from "@/components/conta/auth-form";
import { MARKETING_LABEL } from "@/components/conta/marketing-checkbox";
import type { FormState } from "@/lib/forms/state";

const box = "mt-0.5 size-5 flex-none accent-ultramar";
const row =
  "flex min-h-11 cursor-pointer items-start gap-3 text-[15px] leading-normal";

/** /conta: marketing consent on/off and channels, at any time (LGPD). */
export function MarketingPreferences({
  action,
  optIn,
  canais,
  desligadoEm,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  optIn: boolean;
  canais: string[];
  desligadoEm: string | null;
}) {
  // Channels pre-checked only when the customer already chose them.
  const email = optIn ? canais.includes("email") : true;
  const whatsapp = optIn ? canais.includes("whatsapp") : true;
  return (
    <AuthForm action={action} submitLabel="Salvar preferências">
      <label className={row}>
        <input
          type="checkbox"
          name="marketing"
          defaultChecked={optIn}
          className={box}
        />
        <span>{MARKETING_LABEL}</span>
      </label>
      <fieldset className="m-0 flex flex-col gap-1 border-0 p-0 pl-8">
        <legend className="mb-1 text-sm font-bold text-texto-2">
          Por onde
        </legend>
        <label className={row}>
          <input
            type="checkbox"
            name="canal_email"
            defaultChecked={email}
            className={box}
          />
          E-mail
        </label>
        <label className={row}>
          <input
            type="checkbox"
            name="canal_whatsapp"
            defaultChecked={whatsapp}
            className={box}
          />
          WhatsApp
        </label>
      </fieldset>
      <p className="m-0 text-sm text-texto-2">
        É opcional e não muda nada nas suas compras.
        {!optIn && desligadoEm
          ? ` Desligado em ${new Date(desligadoEm).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`
          : ""}
      </p>
    </AuthForm>
  );
}
