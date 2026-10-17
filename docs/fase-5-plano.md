# Fase 5 — Checkout e pagamento: plano (aguardando aprovação)

Branch `fase-5-checkout`. Pedido do Enzo (17/10): fazer tudo o que não depende do CNPJ novo nem da conta do Mercado Pago.
Objetivo: o cliente fecha a compra, paga no Mercado Pago (Checkout Pro) e o pedido vira `paid` com segurança.

**Sem conta do Mercado Pago:** todo o código fica pronto e testado contra um **Mercado Pago simulado**. Quando a conta sair, o Enzo coloca `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` (de teste) na Vercel e eu faço o teste de ponta a ponta no sandbox com Pix e cartão de teste. Só então a fase fica "pronta" (regra 11.3 do CLAUDE.md).

## Fluxo

1. **/checkout** (igual a `docs/design/Checkout.dc.html`): precisa estar logado (volta para `/entrar?volta=/checkout`). Passos: endereço (os salvos ou um novo) → frete (recotado no servidor) → CPF (do perfil ou digitado) → forma de pagamento (Pix ou cartão; boleto fica para depois) → resumo com total.
2. **Criar pedido** (Server Action, zod): o servidor ignora preços do navegador, relê carrinho, preços e estoque do banco, recota o frete no Melhor Envio para o serviço escolhido e chama a função Postgres `create_order` numa transação só: grava `orders` + `order_items` (cópias de nome, CPF, endereço, preço, NCM), chama `reserve_stock` (faltou estoque, nada é criado) e grava `order_events`. Esvazia o carrinho.
3. **Preferência** (`lib/payments`): cria o Checkout Pro com `external_reference` = id do pedido, itens, frete, `payer`, `back_urls` (página de obrigado), `notification_url` (webhook), expiração de 30 min e só os meios escolhidos. Redireciona o cliente para o Mercado Pago. Cartão nunca passa pelo nosso servidor.
4. **Webhook** `/api/webhooks/mercadopago`: valida a assinatura (`x-signature` + `x-request-id`, HMAC-SHA256 com `MP_WEBHOOK_SECRET`, conforme a documentação oficial atual), grava em `webhook_logs` (único por origem + id: o mesmo aviso duas vezes não faz nada), **consulta o pagamento na API**, confere `external_reference`, valor e moeda e só então chama `mark_order_paid` (transação: grava `payments`, `paid`, `order_events`, dispara a fila da fase 6). Responde 200 rápido.
5. **/pedido/[numero]/obrigado**: só lê o banco, nunca muda status. Pendente: "aguardando pagamento" com atualização automática a cada poucos segundos e botão para voltar ao pagamento; pago: confirmação.
6. **Expiração**: Pix sem pagamento em 30 min → `canceled` e estoque devolvido (`restore_stock`). Roda no `pg_cron` do Supabase a cada 5 min (o cron grátis da Vercel só roda 1 vez por dia). Pagamento que chegar depois de cancelado: registrado e marcado para estorno no admin, nunca reabre o pedido sozinho.
7. **Estorno no admin**: botão no detalhe do pedido pago, chama a API de estorno e vira `refunded` quando o webhook confirmar.

## Mercado Pago simulado (só fora de produção)

`lib/payments` tem duas implementações atrás da mesma interface: a real (REST oficial via `fetch`, sem SDK) e uma **falsa** para dev e testes, que abre uma página local "Pagar (teste)" e envia um webhook assinado com um segredo de teste. A falsa só liga com `PAYMENTS_FAKE=1` e **nunca** em `VERCEL_ENV=production` (erro no boot se tentar).

## Divisão

| Peça | Quem | Arquivos |
| --- | --- | --- |
| Banco: `create_order`, `mark_order_paid`, `expire_orders` + `pg_cron`, colunas `mp_preference_id` e `expira_em`, testes de banco | Claude Code | `supabase/migrations/`, `tests/db/` |
| `lib/payments`: interface, Mercado Pago real, simulado, assinatura do webhook | Claude Code (assinatura revisada pelo Codex) | `lib/payments/*` |
| Webhook, Server Action do pedido, estorno | Claude Code | `app/api/webhooks/mercadopago/`, `lib/orders/checkout.ts` |
| C4 Tela de checkout (componentes) | **Codex** | `components/checkout/*` |
| C5 Página de obrigado + atualização automática | **Codex** | `app/(loja)/pedido/[numero]/obrigado/`, `components/checkout/order-status-poller.tsx` |
| G52 Schemas zod das respostas do Mercado Pago + testes | ChatGPT | `lib/payments/mercadopago/schemas.ts` |
| G53 Montagem do corpo da preferência a partir do pedido + testes | ChatGPT | `lib/payments/mercadopago/preference-body.ts` |
| Integração, testes ponta a ponta, revisão | Claude Code; revisão final Codex | — |

## Testes

- Unidade: assinatura falsa recusada; assinatura velha (ts fora da janela) recusada; corpo da preferência com centavos certos; valor diferente do pedido recusado; `external_reference` desconhecida recusada.
- Banco: mesmo webhook 2x não baixa estoque 2x nem cria 2 pagamentos; `create_order` sem estoque não cria pedido; expiração devolve o estoque uma vez só; cliente A não lê pedido nem pagamento do B.
- Playwright (Mercado Pago simulado): carrinho → checkout → "Pagar (teste)" → obrigado mostra "pago"; Pix expirado volta o estoque; preço alterado no navegador não muda o total.
- Sandbox real: depois que as chaves de teste chegarem.

## O que fica para depois (depende da conta)

- Teste no sandbox real com Pix e cartão de teste.
- Credenciais de produção e primeira venda de verdade.
- Boleto (opcional; fica fora da v1 se não der tempo).

## Bibliotecas novas

Nenhuma. A API do Mercado Pago é chamada com `fetch`.
