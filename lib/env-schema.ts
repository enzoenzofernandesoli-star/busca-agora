import { z } from "zod";

// Pure schema (no "server-only") so it can be unit tested.
// Error messages list variable NAMES only, never values.

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const requiredString = z.preprocess(
  emptyToUndefined,
  z.string({ error: "obrigatória e não definida" }),
);

const requiredUrl = z.preprocess(
  emptyToUndefined,
  z.url({ error: "obrigatória; precisa ser uma URL válida" }),
);

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: requiredUrl,
  NEXT_PUBLIC_SUPABASE_URL: requiredUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredString,
});

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: requiredString,

  MELHORENVIO_ENV: z.preprocess(
    emptyToUndefined,
    z
      .enum(["sandbox", "production"], {
        error: 'precisa ser "sandbox" ou "production"',
      })
      .default("sandbox"),
  ),
  NFE_ENABLED: z.preprocess(
    emptyToUndefined,
    z
      .enum(["true", "false"], { error: 'precisa ser "true" ou "false"' })
      .default("false")
      .transform((value) => value === "true"),
  ),
  NFE_ENV: z.preprocess(
    emptyToUndefined,
    z
      .enum(["homologacao", "producao"], {
        error: 'precisa ser "homologacao" ou "producao"',
      })
      .default("homologacao"),
  ),

  // Optional at boot; demanded at the point of use through requireEnv().
  MP_ACCESS_TOKEN: optionalString,
  MP_WEBHOOK_SECRET: optionalString,
  MELHORENVIO_TOKEN: optionalString,
  NFE_API_TOKEN: optionalString,
  PRINTNODE_API_KEY: optionalString,
  PRINTNODE_PRINTER_ID: optionalString,
  RESEND_API_KEY: optionalString,
  TELEGRAM_BOT_TOKEN: optionalString,
  TELEGRAM_CHAT_ID: optionalString,
  SENTRY_DSN: optionalString,
  CRON_SECRET: optionalString,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export type OptionalEnvKey =
  | "MP_ACCESS_TOKEN"
  | "MP_WEBHOOK_SECRET"
  | "MELHORENVIO_TOKEN"
  | "NFE_API_TOKEN"
  | "PRINTNODE_API_KEY"
  | "PRINTNODE_PRINTER_ID"
  | "RESEND_API_KEY"
  | "TELEGRAM_BOT_TOKEN"
  | "TELEGRAM_CHAT_ID"
  | "SENTRY_DSN"
  | "CRON_SECRET";

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

function parseOrThrow<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const lines = result.error.issues.map(
    (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
  );
  throw new EnvError(
    `Variáveis de ambiente inválidas ou faltando:\n${lines.join("\n")}\n` +
      "Confira o .env.local (dev) ou as variáveis do projeto na Vercel.",
  );
}

export function parsePublicEnv(
  source: Record<string, string | undefined>,
): PublicEnv {
  return parseOrThrow(publicEnvSchema, source);
}

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  return parseOrThrow(serverEnvSchema, source);
}

export function createRequireEnv(env: ServerEnv) {
  return function requireEnv(key: OptionalEnvKey): string {
    const value = env[key];
    if (!value) {
      throw new EnvError(
        `Variável de ambiente ${key} é necessária para esta operação e não está definida.`,
      );
    }
    return value;
  };
}
