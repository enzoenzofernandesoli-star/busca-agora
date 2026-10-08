# Fase 6 — Automação pós-pagamento: plano (aguardando aprovação)

Branch `fase-6-automacao`. Divisão 50/50: o ChatGPT faz G31–G35 (`docs/fase-6-prompts-chatgpt.md`), o Claude Code faz o resto e revisa tudo.
Objetivo: pedido pago gera etiqueta e os papéis impressos sem ninguém clicar.

**Sem depender do seu pai (decisão de 08/10):** nada aqui precisa de CNPJ, conta do Mercado Pago ou certificado. Tudo roda em **modo de teste** (sandbox do Melhor Envio, PrintNode grátis) e os testes automáticos usam as APIs simuladas. O pedido "pago" de verdade só existe depois da fase 5; até lá eu provo o fluxo com pedidos de teste marcados como pagos no banco local.

## O que acontece quando um pedido é pago

1. **Nota fiscal**: com `NFE_ENABLED=false` (hoje, sem CNPJ), a fila pula a emissão e marca o pedido **"emitir nota à mão"** no admin, como manda o CLAUDE.md. A interface `lib/invoice` fica pronta; a emissão automática pela Focus NFe entra quando houver CNPJ + IE + certificado (junto com as coisas do seu pai).
2. **Etiqueta** (Melhor Envio): põe no carrinho do Melhor Envio com o serviço escolhido pelo cliente, compra com o saldo da carteira, gera e pega o PDF 10x15. Sem nota, vai com **declaração de conteúdo** (o próprio Melhor Envio monta). Pedido passa a `label_ready`.
   - **Nunca compra duas etiquetas**: antes de comprar, o servidor grava o id do carrinho do Melhor Envio no pedido; se a fila tentar de novo, continua dali em vez de começar outra compra.
3. **Resumo do pedido** em PDF 10x15 (preto e branco, para a térmica): número, data, cliente, itens com SKU e quantidade, serviço de frete e QR code que abre o pedido no admin.
4. **Impressão** (PrintNode): manda em ordem resumo → etiqueta (→ DANFE quando houver nota) para a impressora configurada. Pedido passa a `printed`. Sem PrintNode configurado, fica "não impresso" com o botão **Reimprimir** no admin (que já existe).
5. **Rastreio**: em vez do webhook do Melhor Envio (que exige cadastrar um "aplicativo" lá e trocar o tipo de token), o servidor **consulta o rastreio a cada 2 horas** só dos pedidos enviados ou com etiqueta. Postado → `shipped` (e-mail "saiu para entrega" da fase 7); entregue → `delivered`. O webhook fica em `docs/v2.md` como melhoria.

Cada etapa grava em `order_events`, roda na fila `jobs` (5 tentativas, alerta no Telegram) e encadeia a próxima só quando termina.

## Claude Code

1. **Banco** (migration nova): `orders.frete_servico_id` (id do serviço no Melhor Envio, o checkout da fase 5 preenche); `shipments` ganha `me_cart_id`, `me_status`, `etiqueta_path`; função que encadeia nota → etiqueta → resumo → impressão; agendamento do rastreio a cada 2 h.
2. **`lib/shipping`**: `buyLabel` (carrinho → compra → gerar → PDF), `track`, com as rotas oficiais do Melhor Envio (`/me/cart`, `/me/shipment/checkout`, `/generate`, `/print`, `/tracking`) e o remetente vindo de Configurações.
3. **`lib/invoice`**: interface + modo "manual" (NFE desligada). **`lib/printer`**: PrintNode atrás da interface.
4. **Handlers da fila**: `invoice`, `label`, `print`, e o job de rastreio. PDFs guardados num bucket **privado** do Storage (link temporário para o admin baixar).
5. **Admin**: cartão "Envio" no pedido (etiqueta, rastreio, status do Melhor Envio, baixar resumo e etiqueta).
6. **Testes**: Melhor Envio e PrintNode simulados — falha na etiqueta não perde o pedido; reprocessar **não compra duas etiquetas**; NFE desligada pula a nota e marca manual; impressão sem PrintNode não trava a fila; rastreio muda status uma vez só.

## ChatGPT (G31–G35)

| # | Arquivo | O que é |
| --- | --- | --- |
| G31 | `lib/pdf/order-summary.tsx` + teste | Resumo do pedido 10x15 em PDF (`@react-pdf/renderer`), preto e branco |
| G32 | `lib/shipping/melhorenvio/label-schemas.ts` + teste | Validação (zod) das respostas de carrinho, compra, geração, impressão e rastreio do Melhor Envio |
| G33 | `lib/shipping/melhorenvio/label-request.ts` + teste | Monta o pedido de etiqueta (remetente, destinatário, volumes, declaração de conteúdo) a partir do pedido |
| G34 | `lib/printer/printnode-request.ts` + teste | Monta os trabalhos de impressão do PrintNode (PDF 10x15, ordem, títulos) e valida a resposta |
| G35 | `components/admin/shipment-card.tsx` | Cartão "Envio" no detalhe do pedido no admin |

## Bibliotecas novas (preciso instalar)

- `@react-pdf/renderer`: gera o PDF do resumo (pedida no CLAUDE.md).
- `qrcode`: desenha o QR code do resumo (o react-pdf não tem QR). Sem custo, roda no servidor.

## O que você vai fazer (só você, sem seu pai, tudo grátis)

1. **Token do Melhor Envio sandbox** com as permissões novas (carrinho, compra, gerar, imprimir, rastreio) e **saldo fictício** na carteira do sandbox (lá dá para "adicionar saldo" de mentira). Eu te passo o passo a passo.
2. **PrintNode** (só quando quiser testar impressão de verdade): conta grátis (plano Lite: 50 impressões por mês, sem cartão) + o programa no computador da impressora. Até lá a fila marca "não impresso" e segue.

## Preciso do seu ok em 2 pontos

1. **Rastreio por consulta a cada 2 h** no lugar do webhook (sem cadastrar aplicativo no Melhor Envio agora).
2. **Duas bibliotecas** (`@react-pdf/renderer` e `qrcode`).
