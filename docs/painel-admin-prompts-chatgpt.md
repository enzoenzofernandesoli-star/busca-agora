# Painel do admin — prompts para o ChatGPT (G36 a G38)

Plano aprovado em 08/10: login do admin, Equipe, excluir produto, vendas por período e painel bonito. O ChatGPT faz as peças visuais do painel; o Claude Code faz banco, segurança, telas e integração, e revisa tudo.

Mesmo esquema: uma conversa por prompt. Ele **só cria os arquivos listados**, não mexe em nenhum outro, não instala nada, não faz commit nem push. Branch: `admin-painel`. Os 3 são independentes.

Bloco de contexto (já incluído em cada prompt):

> Projeto: loja virtual Busca Agora, painel administrativo para um usuário NÃO técnico (o dono). Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4. Sem "any", sem console.log, sem biblioteca nova (nada de biblioteca de gráfico: tudo com HTML/CSS/SVG). Textos em português do Brasil; código e comentários em inglês. Importações com "@/". Ícones SVG de traço (estilo Lucide, stroke="currentColor", strokeWidth 2, aria-hidden), nunca emoji. DINHEIRO SEMPRE EM CENTAVOS INTEIROS; para mostrar use formatBRL(cents) de "@/lib/format". Datas em America/Sao_Paulo. Cores do Tailwind: ultramar (#3324F5), ultramar-700, ultramar-50, noite (#0A0F3D), lima (#C6FF3D), fundo (#F4F5FA), borda (#E3E5F2), texto-2 (#4A4F70), lavanda (#DCDFFF), estoque (verde de "ok"), rosa-tile, rosa-ink, ciano-tile, ciano-ink. Fontes: font-display (Sora, números e títulos), font-sans (DM Sans). Cartões brancos com borda borda e cantos 22px (28px no desktop), sombra suave opcional (shadow-[0_1px_2px_rgba(10,15,61,.06)]). Contraste ≥ 4.5:1, alvos de toque ≥ 44px, foco visível. Pensado primeiro para 390 px e bonito em 1440 px. Server Components (sem "use client") salvo quando dito.

---

## G36 — Gráfico de vendas dos últimos 14 dias

```
[cole o bloco de contexto]

Tarefa: crie components/admin/sales-chart.tsx (Server Component).

export type SalesDay = { dia: string /* "2026-10-08" (data em São Paulo) */; totalCents: number; pedidos: number };
export function SalesChart({ dias, titulo = "Vendas dos últimos 14 dias" }: { dias: SalesDay[]; titulo?: string })

- Cartão branco com título (font-display bold) e, à direita, o total do período em font-display extrabold.
- Gráfico de barras verticais feito com divs (flex, altura proporcional ao maior valor; mínimo 4px quando > 0; dia sem venda mostra só uma linha fina borda). Barras em ultramar; a barra do último dia (hoje) em lima com borda noite fina. Cantos arredondados no topo (6px).
- Eixo de baixo: dia/mês curto ("08/10") a cada barra no desktop; no celular (< 640px) só a cada 2 dias para caber em 390px sem rolagem lateral.
- Ao passar o mouse ou focar uma barra (cada barra é focável, tabIndex 0), mostra um balão com a data por extenso ("qua, 08/10"), o valor e "N pedidos". Sem JavaScript: use CSS (group-hover/group-focus).
- Acessibilidade: o gráfico tem role="img" com aria-label resumindo ("Vendas dos últimos 14 dias: total R$ X, melhor dia 08/10 com R$ Y") e, logo abaixo, uma <table className="sr-only"> com dia, valor e pedidos.
- Sem dados (todos zero): mostra o eixo e a mensagem "Ainda sem vendas nesse período." centralizada.

Entregue o arquivo completo.
```

---

## G37 — Últimos pedidos

```
[cole o bloco de contexto]

Já existe: import { StatusBadge } from "@/components/admin/status-badge"; — <StatusBadge status={...} /> com os 9 status do pedido (pending_payment, paid, invoiced, label_ready, printed, shipped, delivered, canceled, refunded).

Tarefa: crie components/admin/recent-orders.tsx (Server Component).

export type RecentOrder = { numero: string; cliente: string; totalCents: number; status: "pending_payment" | "paid" | "invoiced" | "label_ready" | "printed" | "shipped" | "delivered" | "canceled" | "refunded"; criadoEm: string /* ISO */; itens: number };
export function RecentOrders({ pedidos, agora }: { pedidos: RecentOrder[]; agora: string /* ISO, para calcular "há 5 min" sem depender do relógio do navegador */ })

- Cartão branco "Últimos pedidos" com link "Ver todos" para /admin/pedidos (alinhado à direita).
- Cada pedido é uma linha clicável inteira (<a href="/admin/pedidos/{numero}">), min-h 56px: número em font-display bold, primeiro nome do cliente, "N itens", valor (font-display), StatusBadge e tempo relativo em texto-2: "agora" (< 1 min), "há N min", "há N h", "ontem", senão "08/10".
- Pedido com menos de 10 minutos ganha destaque: fundo lima/20 (bg-lima/20), uma bolinha lima pulsando (motion-safe:animate-pulse) e o texto escondido "(novo)".
- No celular, cada linha empilha em 2 linhas (número + valor em cima; cliente, status e tempo embaixo). No desktop, uma linha só em colunas.
- Lista vazia: ícone de caixa e "Nenhum pedido ainda. Quando alguém comprar, aparece aqui na hora."
- Exporte também function tempoRelativo(criadoEm: string, agora: string): string (pura) e crie tests/unit/recent-orders.test.ts testando agora, 5 min, 2 h, ontem e data antiga.

Entregue os 2 arquivos completos.
```

---

## G38 — Números do painel, avisos e atalhos

```
[cole o bloco de contexto]

Tarefa: crie components/admin/dashboard-cards.tsx (Server Component) com 3 exports.

1) export function KpiCard({ titulo, valor, comparacao, href, destaque }: { titulo: string; valor: string; comparacao?: { texto: string /* "vs. 7 dias antes" */; variacao: number | null /* percentual, ex.: 12.5 ou -8; null = sem base */ }; href?: string; destaque?: boolean })
- Cartão com título (texto-2, 15px bold), valor grande (font-display extrabold 32px; 36px no desktop) e a comparação: seta para cima em verde (text-estoque) quando variacao > 0, para baixo em rosa-ink quando < 0, traço em texto-2 quando 0 ou null ("sem comparação"). Formato "↑ 12,5%" com vírgula (Intl pt-BR, 1 casa).
- destaque: fundo ultramar, texto branco, valor em lima (para "Vendas de hoje").
- href: o cartão inteiro vira link, com foco visível.

2) export function DashboardAlerts({ alertas }: { alertas: { tipo: "erro" | "aviso" | "ok"; texto: string; href?: string; acao?: string }[] })
- Cartão "Precisa da sua atenção". Cada alerta numa linha com ícone (erro: triângulo em rosa-ink sobre rosa-tile; aviso: relógio/info em ciano-ink sobre ciano-tile; ok: check em estoque) e, se href, um link-botão com o texto de acao (ou "Ver").
- Sem alertas de erro/aviso: mostra uma linha "Tudo em dia." com check.

3) export function QuickActions({ acoes }: { acoes: { titulo: string; descricao: string; href: string; icone: "produto" | "pedidos" | "config" | "equipe" }[] })
- Grade de atalhos (2 colunas no celular, 4 no desktop), cada um um link grande (min-h 88px) com ícone de traço em ultramar-50/ultramar, título bold e descrição curta em texto-2; hover com borda ultramar.

Entregue o arquivo completo.
```
