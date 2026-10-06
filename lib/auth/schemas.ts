import { z } from "zod";

// Auth form schemas. Pure module so it can be unit tested. Messages are
// shown to the customer as-is.

const email = z
  .string({ error: "Informe seu e-mail." })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Informe um e-mail válido." }).max(254));

// Same rule as supabase/config.toml (8+ chars, letters and digits).
const novaSenha = z
  .string({ error: "Crie uma senha." })
  .min(8, { error: "A senha precisa ter pelo menos 8 caracteres." })
  .max(72, { error: "A senha pode ter no máximo 72 caracteres." })
  .refine((s) => /[a-zA-Z]/.test(s) && /\d/.test(s), {
    error: "Use letras e números na senha.",
  });

export const signUpSchema = z.object({
  nome: z
    .string({ error: "Informe seu nome." })
    .trim()
    .min(2, { error: "Informe seu nome." })
    .max(120),
  email,
  senha: novaSenha,
  // Checkbox: present ("on") only when checked.
  aceite: z.literal("on", {
    error:
      "Para criar a conta, aceite os Termos de uso e a Política de privacidade.",
  }),
});

export const signInSchema = z.object({
  email,
  senha: z.string({ error: "Informe sua senha." }).min(1, {
    error: "Informe sua senha.",
  }),
});

export const resetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ senha: novaSenha, confirmacao: z.string() })
  .refine((v) => v.senha === v.confirmacao, {
    error: "As senhas não são iguais.",
    path: ["confirmacao"],
  });

/** zod issues -> { field: [messages] } for the forms. */
export function fieldErrors(
  error: z.ZodError,
): Partial<Record<string, string[]>> {
  const out: Partial<Record<string, string[]>> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
