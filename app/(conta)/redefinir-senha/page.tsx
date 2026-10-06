import type { Metadata } from "next";

import { AuthCard } from "@/components/conta/auth-card";
import { AuthForm } from "@/components/conta/auth-form";
import { PasswordField } from "@/components/conta/password-field";
import { updatePassword } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Nova senha",
  robots: { index: false, follow: false },
};

// Reached through the e-mail link: /auth/callback opens the session first.
export default async function RedefinirSenhaPage() {
  await requireUser("/redefinir-senha");
  return (
    <AuthCard titulo="Criar senha nova">
      <AuthForm action={updatePassword} submitLabel="Salvar senha">
        <PasswordField
          id="senha"
          name="senha"
          label="Senha nova"
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres, com letras e números."
          showStrength
          required
        />
        <PasswordField
          id="confirmacao"
          name="confirmacao"
          label="Repita a senha nova"
          autoComplete="new-password"
          required
        />
      </AuthForm>
    </AuthCard>
  );
}
