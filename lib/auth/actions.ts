"use server";

import { redirect } from "next/navigation";

import { mergeGuestCart } from "@/lib/cart/server";
import { createAdminClient } from "@/lib/db/admin";
import { createClient } from "@/lib/db/server";
import { publicEnv } from "@/lib/env-public";
import { echoValues, type FormState } from "@/lib/forms/state";

import { allowAttempt, clientIp } from "./rate-limit";
import { safeNext } from "./redirect";
import {
  fieldErrors,
  newPasswordSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";
import { requireUser } from "./session";

const TOO_MANY: FormState = {
  ok: false,
  message:
    "Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.",
};

const GENERIC_ERROR: FormState = {
  ok: false,
  message: "Não deu certo agora. Tente de novo em instantes.",
};

function siteUrl(path: string): string {
  return `${publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}${path}`;
}

function callbackUrl(next: string): string {
  return siteUrl(`/auth/callback?volta=${encodeURIComponent(safeNext(next))}`);
}

/** Terms and privacy acceptance is written by the server, never the form. */
async function markTermsAccepted(userId: string) {
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new Error(`terms_accepted_at: ${error.message}`);
}

export async function signUp(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: echoValues(formData),
    };
  }
  if (
    !(await allowAttempt([{ kind: "cadastro:ip", value: await clientIp() }]))
  ) {
    return { ...TOO_MANY, values: echoValues(formData) };
  }

  const volta = safeNext(formData.get("volta"));
  const { nome, email, senha } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome }, emailRedirectTo: callbackUrl(volta) },
  });

  if (error) {
    // Same answer whether or not the e-mail exists (no account enumeration).
    return {
      ok: false,
      message:
        "Não foi possível criar a conta com esse e-mail. Se você já tem conta, entre ou recupere a senha.",
    };
  }
  if (data.user) await markTermsAccepted(data.user.id);

  // E-mail confirmation on (production): no session until the link is used.
  if (!data.session) {
    return {
      ok: true,
      message: `Quase lá! Enviamos um link para ${email}. Abra o e-mail para ativar sua conta.`,
    };
  }
  if (data.user) await mergeGuestCart(data.user.id);
  redirect(volta);
}

export async function signIn(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: echoValues(formData),
    };
  }
  const { email, senha } = parsed.data;
  const allowed = await allowAttempt([
    { kind: "login:email", value: email },
    { kind: "login:ip", value: await clientIp() },
  ]);
  if (!allowed) return { ...TOO_MANY, values: echoValues(formData) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        ok: false,
        message: "Confirme seu e-mail pelo link que enviamos antes de entrar.",
      };
    }
    return {
      ok: false,
      message: "E-mail ou senha incorretos.",
      values: echoValues(formData),
    };
  }
  // What the visitor put in the cart before logging in is kept.
  await mergeGuestCart(data.user.id);
  redirect(safeNext(formData.get("volta")));
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(safeNext(formData.get("volta"))) },
  });
  if (error || !data.url) redirect("/entrar?erro=google");
  redirect(data.url);
}

export async function requestPasswordReset(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: echoValues(formData),
    };
  }
  const { email } = parsed.data;
  const allowed = await allowAttempt([
    { kind: "recuperar:email", value: email },
    { kind: "recuperar:ip", value: await clientIp() },
  ]);
  if (!allowed) return { ...TOO_MANY, values: echoValues(formData) };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl("/redefinir-senha"),
  });
  // Same message whether or not the e-mail has an account.
  return {
    ok: true,
    message:
      "Se houver uma conta com esse e-mail, você vai receber um link para criar uma senha nova.",
  };
}

export async function updatePassword(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser("/redefinir-senha");
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrors(parsed.error),
      values: echoValues(formData),
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.senha,
  });
  if (error) {
    return error.code === "same_password"
      ? { ok: false, message: "Use uma senha diferente da atual." }
      : GENERIC_ERROR;
  }
  redirect("/conta?senha=ok");
}

/** Google accounts accept the terms on their first visit (/aceite-termos). */
export async function acceptTerms(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/aceite-termos");
  if (formData.get("aceite") !== "on") {
    return {
      ok: false,
      fieldErrors: {
        aceite: [
          "Para usar sua conta, aceite os Termos de uso e a Política de privacidade.",
        ],
      },
    };
  }
  await markTermsAccepted(user.id);
  redirect(safeNext(formData.get("volta")));
}
