export const MAX_ATTEMPTS = 5;

export function nextRunAt(tentativas: number, agora: Date): Date | null {
  if (
    !Number.isInteger(tentativas) ||
    tentativas < 1 ||
    tentativas > MAX_ATTEMPTS
  )
    throw new RangeError("Attempts must be an integer from 1 to 5");
  if (Number.isNaN(agora.getTime()))
    throw new RangeError("Invalid current date");
  if (tentativas === MAX_ATTEMPTS) return null;
  const minutes = [1, 5, 15, 60][tentativas - 1];
  return new Date(agora.getTime() + (minutes ?? 0) * 60_000);
}
export function errorText(e: unknown): string {
  const message =
    e instanceof Error
      ? e.message
      : typeof e === "string"
        ? e
        : "Erro desconhecido";
  return message
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [oculto]")
    .replace(/\bre_[A-Za-z0-9_-]+/g, "[oculto]")
    .replace(/\b\d+:[A-Za-z0-9_-]{30,}/g, "[oculto]")
    .replace(/[A-Za-z0-9]{32,}/g, "[oculto]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}
