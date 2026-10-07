# Fase 7 — prompts para o ChatGPT (G21 a G25)

Mesmo esquema: uma conversa por prompt. Ele **só cria os arquivos listados**, não mexe em nenhum outro, não instala nada, não faz commit nem push, e no fim te passa o resumo. A branch atual é `fase-7-comunicacao`. As bibliotecas `@react-email/components`, `@react-email/render` e `resend` já estão instaladas (o Claude Code instala antes). A ordem não importa: os 5 são independentes.

Bloco de contexto (já incluído em cada prompt):

> Projeto: loja virtual Busca Agora (eletrônicos e cosméticos, um vendedor só). Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, zod 4, Vitest 4. Sem "any", sem console.log, sem biblioteca nova. Textos da interface em português do Brasil, simples e diretos; código e comentários em inglês. Importações com "@/". Ícones SVG de traço (estilo Lucide), nunca emoji. DINHEIRO SEMPRE EM CENTAVOS INTEIROS (8990 = R$ 89,90), nunca float; para mostrar use formatBRL(cents) de "@/lib/format". Datas: exibir em America/Sao_Paulo. Status do pedido (tipo OrderStatus): "pending_payment" | "paid" | "invoiced" | "label_ready" | "printed" | "shipped" | "delivered" | "canceled" | "refunded". Classes de cor do Tailwind: ultramar (#3324F5), ultramar-700, ultramar-50, noite (#0A0F3D), lima (#C6FF3D), fundo (#F4F5FA), borda (#E3E5F2), texto-2 (#4A4F70), lavanda (#DCDFFF), ciano-tile, ciano-ink, rosa-tile, rosa-ink. Fontes: font-display (Sora, títulos/preços/números), font-sans (DM Sans). Cartões brancos com borda borda e cantos 22px; botões com cantos 14px e altura mínima 48px. Alvos de toque ≥ 44 px, foco visível (outline-3 outline-offset-2 outline-ultramar), labels de verdade em todo campo, contraste ≥ 4.5:1. Pensado primeiro para celular de 390 px.

---

## G21 — Modelos dos e-mails

```
[cole o bloco de contexto]

Tarefa: crie os modelos de e-mail do cliente com React Email (@react-email/components). Arquivos:
- emails/types.ts
- emails/components/email-layout.tsx
- emails/components/order-items.tsx
- emails/pedido-recebido.tsx
- emails/pagamento-aprovado.tsx
- emails/nota-emitida.tsx
- emails/pedido-enviado.tsx
- emails/pedido-entregue.tsx
- emails/subjects.ts
- tests/unit/emails.test.tsx

1) emails/types.ts:
export type EmailItem = { nome: string; variacao: string | null; quantidade: number; precoCents: number };
export type EmailAddress = { rua: string; numero: string; complemento: string | null; bairro: string; cidade: string; uf: string; cep: string };
export type OrderEmailBase = {
  siteUrl: string;        // "https://buscaagora.com.br" (sem barra no fim); imagens e links são absolutos a partir dele
  numero: string;         // "BA-000123"
  clienteNome: string;    // nome completo; use só o primeiro nome na saudação
  itens: EmailItem[];
  subtotalCents: number; freteCents: number; descontoCents: number; totalCents: number;
  freteServico: string | null;  // "PAC", "SEDEX"...
  endereco: EmailAddress;
};
export type PedidoRecebidoProps = OrderEmailBase & { metodo: "pix" | "boleto" | "card" };
export type PagamentoAprovadoProps = OrderEmailBase;
export type NotaEmitidaProps = OrderEmailBase & { danfeUrl: string | null };
export type PedidoEnviadoProps = OrderEmailBase & { transportadora: string | null; rastreio: string | null; rastreioUrl: string | null };
export type PedidoEntregueProps = OrderEmailBase;

2) EmailLayout({ siteUrl, preview, children }): Html lang="pt-BR", Head, Preview, Body com fundo #F4F5FA, Container de no máximo 600px. Topo: faixa #3324F5 com a logo <Img src={`${siteUrl}/brand/logo-email.png`} width={160} height={40} alt="Busca Agora"> (PNG, não SVG: o Gmail não mostra SVG). Conteúdo num cartão branco com cantos 22px e borda #E3E5F2. Rodapé #0A0F3D com o slogan "Buscou? Tá aqui." ("Tá aqui." em #C6FF3D), links "Meus pedidos" (`${siteUrl}/conta/pedidos`), "Trocas e devoluções" (`${siteUrl}/trocas`), "Contato" (`${siteUrl}/contato`) em #DCDFFF, e a frase "Você recebeu este e-mail porque fez um pedido na Busca Agora." Fontes: Sora para títulos e números, DM Sans para texto, sempre com fallback Arial, Helvetica, sans-serif (cliente de e-mail não carrega fonte com segurança). Estilos inline ou pelo objeto style (sem Tailwind no e-mail). Botão principal: fundo #3324F5, texto branco, cantos 14px, padding 14px 24px, Sora 700.

3) OrderItems({ itens, subtotalCents, freteCents, descontoCents, totalCents, freteServico }): tabela (Row/Column) com nome, variação (se houver, em #4A4F70), "Qtd. N" e preço da linha (precoCents × quantidade, formatBRL). Depois: Subtotal, Frete (com o serviço entre parênteses; 0 -> "Grátis"), Desconto (só se > 0, com "−"), Total em Sora 800. Valores alinhados à direita.

4) Os 5 e-mails (export default do componente + export const PreviewProps com dados fictícios, nomes e CEP inventados, nunca dados reais). Todos mostram "Pedido BA-000123", o botão principal para `${siteUrl}/conta/pedidos/${numero}` e o endereço de entrega no fim.
- pedido-recebido: título "Recebemos seu pedido!". Texto conforme o método: pix -> "Pague o Pix em até 30 minutos para garantir seus produtos. Se o prazo passar, o pedido é cancelado e nada é cobrado."; boleto -> "Pague o boleto em até 3 dias úteis. A compensação leva até 2 dias úteis."; card -> "Estamos confirmando o pagamento com o cartão. Você recebe outro e-mail assim que for aprovado.". Botão "Ver meu pedido". Itens (OrderItems).
- pagamento-aprovado: título "Pagamento aprovado". Texto "Já estamos separando seus produtos. Você recebe o código de rastreio assim que o pedido sair." Botão "Acompanhar pedido". Itens.
- nota-emitida: título "Sua nota fiscal está pronta". Se danfeUrl: botão "Baixar nota fiscal (PDF)" para danfeUrl e link secundário "Ver meu pedido"; sem danfeUrl: texto "A nota fica disponível em Meus pedidos." e botão "Ver meu pedido". Sem lista de itens.
- pedido-enviado: título "Seu pedido saiu para entrega". Caixa destacada (fundo #E6F8FF, texto #08708F) com transportadora e código de rastreio em Sora 700, grande e fácil de copiar. Se rastreioUrl: botão "Rastrear entrega" para rastreioUrl; senão botão "Acompanhar pedido". Itens.
- pedido-entregue: título "Pedido entregue". Texto "Esperamos que goste! Se algo não estiver certo, você pode pedir troca ou devolução em até 7 dias pelo seu pedido." Botão "Ver meu pedido". Link secundário "Política de trocas" para `${siteUrl}/trocas`.

5) emails/subjects.ts: export const SUBJECTS = { pedido_recebido: (n: string) => `Recebemos seu pedido ${n}`, pagamento_aprovado: (n) => `Pagamento aprovado: pedido ${n}`, nota_emitida: (n) => `Nota fiscal do pedido ${n}`, pedido_enviado: (n) => `Seu pedido ${n} saiu para entrega`, pedido_entregue: (n) => `Pedido ${n} entregue` } (tipado, sem emoji).

6) tests/unit/emails.test.tsx (Vitest, usando render de @react-email/render): para cada e-mail, renderiza com PreviewProps e confere: contém o número do pedido; contém o total formatado em reais; o link do botão principal aponta para /conta/pedidos/BA-...; a logo é PNG com alt; nenhum texto com "undefined" ou "NaN". Teste extra: pedido-recebido mostra o texto certo para pix, boleto e card; pedido-enviado sem rastreioUrl não tem o botão "Rastrear entrega"; frete 0 aparece "Grátis".

Entregue os arquivos completos.
```

---

## G22 — Textos do Telegram e espera entre tentativas

```
[cole o bloco de contexto]

Tarefa: crie lib/notify/messages.ts, lib/jobs/backoff.ts, tests/unit/notify-messages.test.ts e tests/unit/backoff.test.ts. Funções puras: nada de rede, nada de process.env.

1) lib/notify/messages.ts — mensagens para o Telegram no modo parse_mode "HTML". Todo texto que vem de fora (nome, cidade, motivo, mensagem de erro) passa por escapeHtml (& < > "), exportada também.
- export function paidOrderMessage(p: { numero: string; totalCents: number; itens: number; cidade: string; uf: string; adminUrl: string }): string
  Formato (uma linha por item):
  "<b>Novo pedido pago</b>\n<b>BA-000123</b> · R$ 189,90 · 3 itens · Campinas/SP\n<a href=\"{adminUrl}\">Abrir no admin</a>". "1 item" no singular. Valor com formatBRL.
- export function jobFailedMessage(p: { tipo: "notify" | "invoice" | "label" | "print" | "email"; numero: string; tentativas: number; erro: string; adminUrl: string }): string
  "<b>Falha na fila</b>\n{rótulo} do pedido <b>BA-000123</b> falhou {N} vezes.\nÚltimo erro: {erro cortado em 300 caracteres com "…"}\n<a href=...>Abrir pedido no admin</a>". Rótulos: notify "Aviso interno", invoice "Nota fiscal", label "Etiqueta", print "Impressão", email "E-mail ao cliente".
- export function returnRequestedMessage(p: { numero: string; tipo: "troca" | "devolucao"; motivo: string; detalhe: string; adminUrl: string }): string
  "<b>Pedido de troca</b>" ou "<b>Pedido de devolução</b>", número em negrito, "Motivo: ...", detalhe cortado em 500 caracteres, link "Abrir pedido no admin".
- Nenhuma mensagem passa de 4096 caracteres (limite do Telegram): garanta com um corte final.

2) lib/jobs/backoff.ts:
- export const MAX_ATTEMPTS = 5;
- export function nextRunAt(tentativas: number, agora: Date): Date | null — tentativas é quantas já falharam (1..5). Espera depois da 1ª falha 1 min, 2ª 5 min, 3ª 15 min, 4ª 60 min; na 5ª devolve null (esgotou). Entrada fora de 1..5 lança erro.
- export function errorText(e: unknown): string — mensagem curta e segura de um erro qualquer (Error -> message; string -> ela; outro -> "Erro desconhecido"), sem quebras de linha repetidas, no máximo 500 caracteres, e trocando qualquer trecho que pareça chave por "[oculto]": sequências "Bearer xxx", "re_xxx" (Resend), padrões de token de bot do Telegram (dígitos:letras de 30+), e qualquer palavra com 32+ caracteres alfanuméricos seguidos.

3) Testes: escape de <script> e &; plural/singular de itens; corte de erro longo; limite 4096; nextRunAt para 1..5 e entrada inválida; errorText escondendo "Bearer abc...", "re_123abc...", "123456789:AAH..." e mantendo uma mensagem comum intacta.

Entregue os 4 arquivos completos.
```

---

## G23 — Progresso e rastreio do pedido (área do cliente)

```
[cole o bloco de contexto]

Tarefa: crie components/conta/order-progress.tsx e components/conta/order-tracking.tsx (Server Components, sem "use client", sem JavaScript no navegador).

1) OrderProgress({ status }: { status: OrderStatus })
- 4 etapas para o cliente: "Pedido feito" (pending_payment), "Pagamento aprovado" (paid, invoiced, label_ready, printed), "Enviado" (shipped), "Entregue" (delivered). Etapas já feitas: círculo ultramar com check branco; atual: círculo ultramar com anel ultramar-50 e o rótulo em negrito; futuras: círculo com borda borda e texto texto-2. Linha ligando as etapas (horizontal no desktop, vertical no celular < 640 px).
- canceled e refunded: no lugar das etapas, um aviso (cartão rosa-tile, texto rosa-ink, ícone de traço "x em círculo"): canceled -> "Pedido cancelado. Se você pagou, o valor volta pela mesma forma de pagamento."; refunded -> "Pagamento estornado. O valor volta pela mesma forma de pagamento em até 2 faturas (cartão) ou na hora (Pix).".
- Acessível: <ol> com aria-label="Andamento do pedido", e cada etapa com texto escondido para leitor de tela ("concluída", "etapa atual", "pendente"). aria-current="step" na atual.

2) OrderTracking({ transportadora, servico, rastreio, rastreioUrl, status }: { transportadora: string | null; servico: string | null; rastreio: string | null; rastreioUrl: string | null; status: OrderStatus })
- Sem rastreio: cartão com ícone de caminhão e "O código de rastreio aparece aqui quando o pedido sair." (se status for delivered ou shipped sem código: "Entrega feita pela transportadora."). Não renderiza nada em canceled/refunded.
- Com rastreio: cartão ciano-tile com título "Rastreio", transportadora e serviço ("Correios · PAC"), o código em font-display bold 20px com select-all (fácil de copiar), e, se rastreioUrl, link-botão "Rastrear na transportadora" (target=_blank rel="noopener noreferrer", com texto escondido "(abre em nova aba)"). Altura mínima 48px.

Ícones: SVG inline de traço (stroke="currentColor", strokeWidth 2, aria-hidden).

Entregue os 2 arquivos completos.
```

---

## G24 — Formulário do /rastreio

```
[cole o bloco de contexto]

Tarefa: crie lib/orders/tracking-schema.ts, tests/unit/tracking-schema.test.ts e components/loja/tracking-form.tsx.

1) lib/orders/tracking-schema.ts
- export function normalizeOrderNumber(v: string): string | null — aceita "BA-000123", "ba000123", "ba 123", "000123", "123", "#BA-000123" e devolve sempre "BA-" + 6 dígitos com zeros à esquerda ("BA-000123"). Mais de 9 dígitos, nenhum dígito ou letras além do prefixo BA -> null.
- export const trackingSchema = z.object({ numero: string que passa por normalizeOrderNumber (erro "Confira o número do pedido, ex.: BA-000123"); email: e-mail válido, trim e minúsculas (erro "Informe o e-mail usado na compra") }).
- Testes cobrindo todas as entradas acima, e-mail com maiúsculas/espaços e e-mail inválido.

2) components/loja/tracking-form.tsx ("use client")
- Props: { action: (state: TrackingFormState, formData: FormData) => Promise<TrackingFormState>; initial?: { numero?: string; email?: string } }.
- export type TrackingFormState = { ok: boolean; message?: string; fieldErrors?: Partial<Record<"numero" | "email", string[]>>; values?: { numero?: string; email?: string } }.
- useActionState(action, { ok: false }). Campos: "Número do pedido" (name="numero", placeholder "BA-000123", autoCapitalize="characters", autoComplete="off") e "E-mail usado na compra" (name="email", type="email", autoComplete="email", inputMode="email"). Valor padrão vindo de state.values ?? initial (o React 19 limpa o formulário depois da ação; use key no <form> mudando a cada resposta para os valores voltarem).
- Erros de campo abaixo de cada input (aria-invalid, aria-describedby); mensagem geral (state.message) num role="alert" acima do botão.
- Botão "Rastrear pedido" (bg-lima text-noite, font-display bold, min-h 48px, largura total no celular); enquanto envia: "Buscando..." e desabilitado.
- Texto de ajuda abaixo: "O número está no e-mail de confirmação do pedido."

Entregue os 3 arquivos completos.
```

---

## G25 — Pedido de troca ou devolução

```
[cole o bloco de contexto]

Tarefa: crie lib/orders/return-schema.ts, tests/unit/return-schema.test.ts e components/conta/return-request-dialog.tsx.

1) lib/orders/return-schema.ts
- export const RETURN_REASONS = { arrependimento: "Desisti da compra", defeito: "Produto com defeito", errado: "Recebi o produto errado", avariado: "Chegou danificado", outro: "Outro motivo" } as const;
- export const RETURN_WINDOW_DAYS = 7;
- export function canRequestReturn(status: OrderStatus, entregueEm: Date | null, agora: Date): boolean — só delivered, com entregueEm, e no máximo 7 dias corridos depois (agora - entregueEm <= 7 dias).
- export const returnSchema = z.object({ numero: /^BA-\d{6}$/; tipo: "troca" | "devolucao" (erro "Escolha troca ou devolução"); motivo: chave de RETURN_REASONS (erro "Escolha o motivo"); detalhe: trim, 10..1000 caracteres (erro "Conte em poucas palavras o que aconteceu (mínimo 10 letras)") }).
- Testes: janela de 7 dias (6 dias ok, 7 dias exatos ok, 7 dias e 1 minuto não, status shipped não, entregueEm null não); schema com cada erro.

2) components/conta/return-request-dialog.tsx ("use client")
- Props: { numero: string; action: (state: ReturnFormState, formData: FormData) => Promise<ReturnFormState> }, export type ReturnFormState = { ok: boolean; message?: string; fieldErrors?: Partial<Record<"tipo" | "motivo" | "detalhe", string[]>>; values?: { tipo?: string; motivo?: string; detalhe?: string } }.
- Botão que abre: "Pedir troca ou devolução" (bordado, borda ultramar, texto ultramar, min-h 48px).
- <dialog> nativo (showModal), título "Troca ou devolução", foco inicial no primeiro campo, Esc fecha (não enquanto envia), foco volta ao botão ao fechar.
- Campos: rádio "O que você quer?" (Troca / Devolução, como <fieldset> com <legend>); <select> "Motivo" com RETURN_REASONS; <textarea> "O que aconteceu?" (name="detalhe", maxLength 1000, contador "N/1000"); hidden name="numero".
- useActionState; valores mantidos após erro (state.values + key no form). Erros por campo com aria-describedby; mensagem geral role="alert".
- Sucesso (state.ok): troca o conteúdo por "Pedido registrado. Vamos responder pelo seu e-mail em até 1 dia útil." e botão "Fechar".
- Botões: "Voltar" e "Enviar pedido" (bg-ultramar text-white); enviando: "Enviando..." e desabilitados.
- Abaixo do título, texto curto: "Você tem até 7 dias depois da entrega. Guarde o produto com a embalagem e os acessórios."

Entregue os 3 arquivos completos.
```
