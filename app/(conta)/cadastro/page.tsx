import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard, OrDivider } from "@/components/conta/auth-card";
import { AuthForm } from "@/components/conta/auth-form";
import { Field } from "@/components/conta/field";
import { GoogleButton } from "@/components/conta/google-button";
import { PasswordField } from "@/components/conta/password-field";
import { TermsCheckbox } from "@/components/conta/terms-checkbox";
import { signUp } from "@/lib/auth/actions";
import { safeNext } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Criar conta",
  robots: { index: false, follow: false },
};

export default async function CadastroPage(props: PageProps<"/cadastro">) {
  const volta = safeNext((await props.searchParams).volta);
  if (await getCurrentUser()) redirect(volta);

  return (
    <AuthCard titulo="Criar conta" subtitulo="Leva menos de um minuto.">
      <AuthForm action={signUp} submitLabel="Criar conta">
        <input type="hidden" name="volta" value={volta} />
        <Field
          id="nome"
          name="nome"
          label="Nome completo"
          autoComplete="name"
          required
          maxLength={120}
        />
        <Field
          id="email"
          name="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
        />
        <PasswordField
          id="senha"
          name="senha"
          label="Senha"
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres, com letras e números."
          showStrength
          required
        />
        <TermsCheckbox />
      </AuthForm>
      <OrDivider />
      <GoogleButton volta={volta} />
      <p className="m-0 text-center text-[15px] text-texto-2">
        Já tem conta?{" "}
        <Link
          href={`/entrar?volta=${encodeURIComponent(volta)}`}
          className="font-bold"
        >
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
