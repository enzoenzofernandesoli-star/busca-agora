import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard, OrDivider } from "@/components/conta/auth-card";
import { AuthForm } from "@/components/conta/auth-form";
import { Field } from "@/components/conta/field";
import { GoogleButton } from "@/components/conta/google-button";
import { PasswordField } from "@/components/conta/password-field";
import { signIn } from "@/lib/auth/actions";
import { safeNext } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

const erros: Record<string, string> = {
  link: "O link expirou ou já foi usado. Entre com e-mail e senha ou peça um novo.",
  google: "Não foi possível entrar com o Google agora. Tente de novo.",
};

export default async function EntrarPage(props: PageProps<"/entrar">) {
  const params = await props.searchParams;
  const volta = safeNext(params.volta);
  if (await getCurrentUser()) redirect(volta);
  const erro = typeof params.erro === "string" ? erros[params.erro] : undefined;

  return (
    <AuthCard
      titulo="Entrar"
      subtitulo="Acompanhe seus pedidos e compre mais rápido."
    >
      {erro ? (
        <p
          role="alert"
          className="m-0 rounded-[14px] bg-rosa-tile px-4 py-3 text-[15px] text-rosa-ink"
        >
          {erro}
        </p>
      ) : null}
      <AuthForm
        action={signIn}
        submitLabel="Entrar"
        footer={
          <Link href="/recuperar-senha" className="text-[15px] font-bold">
            Esqueci minha senha
          </Link>
        }
      >
        <input type="hidden" name="volta" value={volta} />
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
          autoComplete="current-password"
          required
        />
      </AuthForm>
      <OrDivider />
      <GoogleButton volta={volta} />
      <p className="m-0 text-center text-[15px] text-texto-2">
        Ainda não tem conta?{" "}
        <Link
          href={`/cadastro?volta=${encodeURIComponent(volta)}`}
          className="font-bold"
        >
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}
