import type { Metadata } from "next";

import { AuthCard } from "@/components/conta/auth-card";
import { AuthForm } from "@/components/conta/auth-form";
import { TermsCheckbox } from "@/components/conta/terms-checkbox";
import { acceptTerms } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Termos de uso",
  robots: { index: false, follow: false },
};

// First visit of accounts created with Google: they never saw the checkbox.
export default async function AceiteTermosPage() {
  const user = await requireUser("/aceite-termos");
  return (
    <AuthCard
      titulo={`Bem-vindo${user.nome ? `, ${user.nome.split(" ")[0]}` : ""}!`}
      subtitulo="Antes de continuar, confirme que leu e aceita nossos termos."
    >
      <AuthForm action={acceptTerms} submitLabel="Continuar">
        <input type="hidden" name="volta" value="/conta" />
        <TermsCheckbox />
      </AuthForm>
    </AuthCard>
  );
}
