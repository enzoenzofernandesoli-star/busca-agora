/** "e-mail e WhatsApp" from the marketing channels of a profile. */
export function canaisTexto(canais: string[]): string {
  return canais
    .map((c) => (c === "whatsapp" ? "WhatsApp" : "e-mail"))
    .join(" e ");
}
