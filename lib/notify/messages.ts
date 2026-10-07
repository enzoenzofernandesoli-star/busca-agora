import { formatBRL } from "@/lib/format";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function cut(value: string, max: number): string {
  return value.length <= max
    ? value
    : value.slice(0, max - 1).replace(/[\uD800-\uDBFF]$/, "") + "…";
}
// Truncate only between complete entities/tags and close any open tags.
function boundedHtml(value: string): string {
  if (value.length <= 4096) return value;
  const tokens =
    value.match(/<\/?[a-z]+\b[^>]*>|&(?:amp|lt|gt|quot);|[\s\S]/gu) ?? [];
  let output = "";
  let closing: string[] = [];
  for (const token of tokens) {
    const next = [...closing];
    if (/^<(b|a)\b/.test(token))
      next.push(token.startsWith("<b") ? "</b>" : "</a>");
    else if (/^<\/(b|a)>$/.test(token)) next.pop();
    if (output.length + token.length + next.join("").length + 1 > 4096) break;
    output += token;
    closing = next;
  }
  return output + "…" + closing.reverse().join("");
}
export function paidOrderMessage(p: {
  numero: string;
  totalCents: number;
  itens: number;
  cidade: string;
  uf: string;
  adminUrl: string;
}): string {
  return boundedHtml(
    `<b>Novo pedido pago</b>\n<b>${escapeHtml(p.numero)}</b> · ${formatBRL(p.totalCents)} · ${p.itens} ${p.itens === 1 ? "item" : "itens"} · ${escapeHtml(p.cidade)}/${escapeHtml(p.uf)}\n<a href="${escapeHtml(p.adminUrl)}">Abrir no admin</a>`,
  );
}
export function jobFailedMessage(p: {
  tipo: "notify" | "invoice" | "label" | "print" | "email";
  numero: string;
  tentativas: number;
  erro: string;
  adminUrl: string;
}): string {
  const labels = {
    notify: "Aviso interno",
    invoice: "Nota fiscal",
    label: "Etiqueta",
    print: "Impressão",
    email: "E-mail ao cliente",
  };
  return boundedHtml(
    `<b>Falha na fila</b>\n${labels[p.tipo]} do pedido <b>${escapeHtml(p.numero)}</b> falhou ${p.tentativas} vezes.\nÚltimo erro: ${escapeHtml(cut(p.erro, 300))}\n<a href="${escapeHtml(p.adminUrl)}">Abrir pedido no admin</a>`,
  );
}
export function returnRequestedMessage(p: {
  numero: string;
  tipo: "troca" | "devolucao";
  motivo: string;
  detalhe: string;
  adminUrl: string;
}): string {
  return boundedHtml(
    `<b>Pedido de ${p.tipo === "troca" ? "troca" : "devolução"}</b>\n<b>${escapeHtml(p.numero)}</b>\nMotivo: ${escapeHtml(p.motivo)}\n${escapeHtml(cut(p.detalhe, 500))}\n<a href="${escapeHtml(p.adminUrl)}">Abrir pedido no admin</a>`,
  );
}
