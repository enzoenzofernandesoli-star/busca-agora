# Fase 7 — Comunicação: plano (aguardando aprovação)

Branch `fase-7-comunicacao`. Feita antes das fases 5 e 6 (o Mercado Pago espera o pai do Enzo). Divisão 50/50: o ChatGPT faz G21–G25 (`docs/fase-7-prompts-chatgpt.md`), o Claude Code faz o resto e revisa tudo.
Objetivo: o cliente e nós sabemos de tudo na hora.

## Como os avisos saem (vale para tudo)

- **Ninguém dispara e-mail ou Telegram direto do código da loja.** Toda mudança de status do pedido já passa por `set_order_status` e grava em `order_events`. Um gatilho no banco coloca na fila `jobs` o aviso daquela etapa. Qualquer caminho que mude o status (webhook do Mercado Pago na fase 5, do Melhor Envio na fase 6, admin) gera o aviso sem ninguém lembrar de chamar nada.
- **Um aviso por etapa, nunca dois.** A fila hoje aceita um único trabalho por (tipo, pedido); um pedido manda até 5 e-mails. A migration acrescenta a coluna `etapa` (`paid`, `shipped`...) e a chave única passa a ser (tipo, pedido, etapa). O mesmo aviso recebido duas vezes não entra duas vezes. No envio, o Resend recebe uma chave de idempotência (`pedido/etapa`): mesmo se o worker cair no meio, o cliente não recebe e-mail repetido.
- **Quem roda a fila**: rota `/api/cron/jobs` protegida por `CRON_SECRET`, que pega os trabalhos vencidos com `for update skip locked` (dois workers nunca pegam o mesmo), executa e reagenda falhas (até 5 tentativas, espera 1, 5, 15, 60 min). Esgotou: status `failed`, alerta no Telegram com link do admin, e o botão "Tentar de novo" do admin (fase 8) já recoloca na fila.
  - O plano grátis da Vercel só deixa cron **uma vez por dia**. Por isso quem chama a rota a cada minuto é o **agendador do Supabase** (`pg_cron` + `pg_net`, grátis), com o segredo guardado no cofre do Supabase (Vault), nunca no código. O cron diário da Vercel fica de reserva.
  - Além disso, o servidor chama o worker logo depois de mudar um status (`after()` do Next): o aviso sai em segundos, não em até 1 minuto.
- **Segredos**: `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CRON_SECRET` só no servidor. Sem chave configurada, o trabalho falha com mensagem clara ("Resend não configurado") e fica na fila para tentar de novo quando a chave entrar; a loja nunca quebra por isso.

## Claude Code

1. **Banco** (migration nova):
   - `orders.cliente_email`: cópia do e-mail no checkout, igual ao nome e CPF (para onde o e-mail vai e para o `/rastreio`). O checkout (fase 5) preenche.
   - `jobs.etapa` + nova chave única (tipo, order_id, etapa).
   - Gatilho em `order_events` (evento de status): enfileira `email` em `pending_payment` (pedido recebido), `paid`, `invoiced`, `shipped`, `delivered`; enfileira `notify` (Telegram) em `paid`.
   - `claim_jobs(limite)` e `finish_job(...)`: pegar e fechar trabalhos com segurança (só service role).
   - `track_order(numero, email)`: devolve status, linha do tempo e rastreio de um pedido só se o e-mail bater; nada de CPF, endereço ou valores de outros.
   - Agendamento `pg_cron` a cada minuto (só no Supabase de verdade; no local roda manual).
2. **`lib/jobs`**: worker, tentativas e espera, alerta de esgotado; handlers `email` e `notify` (a fase 6 pluga `invoice`, `label` e `print` no mesmo worker).
3. **`lib/email`** (Resend, atrás da interface): envia com a chave de idempotência, renderiza os modelos do G21. Remetente: `Busca Agora <pedidos@buscaagora.com.br>` quando o domínio estiver verificado (fase 9); até lá o endereço de teste do Resend, que só entrega no seu e-mail.
4. **`lib/notify`** (Telegram, atrás da interface): manda as mensagens do G22.
5. **Telas**:
   - `/conta/pedidos`: lista com selo de status e link para o detalhe.
   - `/conta/pedidos/[numero]`: itens, endereço, total, barra de progresso, linha do tempo (`order_events`), rastreio com link da transportadora, baixar a nota (DANFE) quando existir, e **"Pedir troca ou devolução"** (até 7 dias depois de entregue, como manda o CDC): grava no histórico do pedido e avisa no Telegram. Só o dono vê (RLS).
   - `/rastreio` público: número do pedido + e-mail. Limite de tentativas por IP (não deixa adivinhar pedidos alheios). Mostra só status, linha do tempo e rastreio.
6. **Testes**: banco (gatilho enfileira 1 vez por etapa; mesmo evento 2 vezes não duplica; cliente não lê pedido de outro; `track_order` com e-mail errado não devolve nada; cliente não chama as funções da fila), unidade (worker com Resend e Telegram falsos: falha reagenda com espera, 5ª falha vira `failed` e alerta, sucesso marca `done`), e2e (cliente vê o detalhe e a linha do tempo do próprio pedido; outro cliente recebe 404; `/rastreio` acha com o e-mail certo e não acha com o errado; pedir troca aparece no histórico).

## ChatGPT (G21–G25)

| # | Arquivo | O que é |
| --- | --- | --- |
| G21 | `emails/*.tsx` | Modelos dos 5 e-mails do cliente com a marca (React Email) |
| G22 | `lib/notify/messages.ts`, `lib/jobs/backoff.ts` + testes | Textos do Telegram (pedido pago, erro na fila, troca pedida) e a conta das esperas entre tentativas |
| G23 | `components/conta/order-progress.tsx`, `order-tracking.tsx` | Barra de progresso do pedido e caixa de rastreio |
| G24 | `components/loja/tracking-form.tsx`, `lib/orders/tracking-schema.ts` + teste | Formulário do `/rastreio` e validação (número BA-000123, e-mail) |
| G25 | `components/conta/return-request-dialog.tsx`, `lib/orders/return-schema.ts` + teste | Pedido de troca/devolução: motivo e explicação |

## Bibliotecas novas (preciso instalar)

- `resend`: SDK oficial do Resend (envio de e-mail), pedido no CLAUDE.md.
- `@react-email/components` e `@react-email/render`: montam o HTML do e-mail que funciona no Gmail/Outlook, pedido no CLAUDE.md.
- Telegram sem biblioteca: é um `fetch` simples para a API do bot.

## Preciso do seu ok em 3 pontos

1. **Agendador do Supabase** (`pg_cron` + `pg_net`) chamando a fila a cada minuto, no lugar do cron da Vercel (que no plano grátis só roda 1 vez por dia).
2. **Coluna `etapa` na fila e `cliente_email` no pedido** (mudança no banco das seções 5 e 6, por migration nova).
3. **Troca/devolução até 7 dias depois da entrega** (prazo de arrependimento do CDC para compra online). Depois disso o botão some e aparece "fale com a gente" (`/contato`).

## O que você vai precisar fazer (eu te guio na hora, sem pressa)

- **Resend**: criar conta grátis em https://resend.com com o seu e-mail e gerar uma API key. Você cola no `.env.local` e na Vercel; não me mande.
- **Telegram**: criar o bot no @BotFather (2 minutos) e me dizer quando terminar; eu te mostro como pegar o `TELEGRAM_CHAT_ID` sem você me mandar o token.
- **CRON_SECRET**: eu gero um valor aleatório e coloco no `.env.local`; você cola na Vercel (Production e Preview). Eu guardo a mesma senha no cofre do Supabase.
