import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/conta/auth-card";
import { AuthForm } from "@/components/conta/auth-form";
import { Field } from "@/components/conta/field";
import { requestPasswordReset } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Recuperar senha",
  robots: { index: false, follow: false },
};

export default function RecuperarSenhaPage() {
  return (
    <AuthCard
      titulo="Recuperar senha"
      subtitulo="Informe o e-mail da sua conta e enviamos um link para criar uma senha nova."
    >
      <AuthForm action={requestPasswordReset} submitLabel="Enviar link">
        <Field
          id="email"
          name="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
        />
      </AuthForm>
      <p className="m-0 text-center text-[15px]">
        <Link href="/entrar" className="font-bold">
          Voltar para Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
