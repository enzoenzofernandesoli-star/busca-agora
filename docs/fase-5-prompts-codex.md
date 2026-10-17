# Fase 5 — prompts do Codex (C4 a C7)

Plano: `docs/fase-5-plano.md`. Branch `fase-5-checkout`. Decisão de 17/10: as peças que eram do ChatGPT também vão para o Codex.

Regras para todas: leia o CLAUDE.md inteiro e o plano antes. Só os arquivos listados; nada instalado; sem commit nem push. TypeScript strict, sem `any`. Textos em português do Brasil, código em inglês. Dinheiro sempre em centavos (integer). Cores só dos tokens do CLAUDE.md; ícones de `components/loja/icons.tsx` (traço, nunca emoji). Contraste 4,5:1, toque ≥ 44 px, primeiro 390 px, bonito em 1440 px. Animação só transform/opacity com `motion-safe`. Antes de usar qualquer campo da API do Mercado Pago, confira a documentação oficial atual (mercadopago.com.br/developers): não invente campo. Mostre o plano antes de codar e espere aprovação (CLAUDE.md 2.12). Rode `npm run lint`, `npm run typecheck` e os testes que criar. Entregue um relatório curto.

---

## C4 — Tela de checkout (componentes)

```
Projeto busca-agora, branch fase-5-checkout. Leia CLAUDE.md, docs/fase-5-plano.md, docs/design/Checkout.dc.html (copie medidas, cores e textos exatamente; as tags <sc-*> e {{...}} são só o formato do editor) e as regras do topo de docs/fase-5-prompts-codex.md.

Tarefa: os componentes da tela /checkout. O Claude Code faz a página (carrega CheckoutData no servidor) e a Server Action placeOrder; você faz só a interface.

Contratos (já existem, não altere): lib/checkout/types.ts (CheckoutData, CheckoutItem, PaymentChoice e os NOMES DOS CAMPOS do formulário), lib/forms/state.ts (FormState), lib/shipping/types.ts (ShippingOption, QuoteResult). Frete: POST /api/frete { cep, itens: [{ variantId, quantidade }] } -> QuoteResult (já existe).

Arquivos (novos):
- components/checkout/checkout-form.tsx ("use client"):
  export function CheckoutForm({ data, action }: { data: CheckoutData; action: (state: FormState, formData: FormData) => Promise<FormState> })
  Usa useActionState. Seções numeradas como no design:
  1 · Endereço de entrega: lista os endereços salvos como opções de rádio (principal marcado), mais "Usar outro endereço" que abre os campos (pode reaproveitar o preenchimento por CEP de components/conta/address-form.tsx copiando a ideia, sem importar o formulário inteiro) com a caixa "Salvar na minha conta". Se não houver endereço, já abre os campos.
  CPF para a nota fiscal: campo com máscara, preenchido se data.cpf existir.
  2 · Como você quer receber: ao escolher/mudar o endereço (CEP válido), cota o frete pelo /api/frete com os itens de data.itens e mostra as opções como rádios (transportadora · serviço, prazo, preço). Estados: carregando, erro (motivo), sem serviço. Valor do rádio = servicoId.
  3 · Forma de pagamento: Pix (aprovação na hora) e Cartão de crédito (até 12x), rádios com ícones PixIcon e CardIcon. Texto: "Você paga na página segura do Mercado Pago."
  Resumo do pedido (coluna da direita no desktop, abaixo no celular): itens (foto sobre a placa da categoria, nome, variação, quantidade, preço), subtotal, frete (da opção escolhida), total = subtotal + frete (só exibição), botão "Ir para o pagamento" (desabilitado sem frete escolhido; "Aguarde..." enquanto envia), e o texto legal do design com links para /termos e /privacidade.
  Erros: FormState.message num alerta (role="alert") no topo; fieldErrors embaixo de cada campo (aria-describedby). Mantém os valores digitados em erro (FormState.values).
- components/checkout/checkout-steps.tsx: reaproveite o visual de components/carrinho/checkout-steps.tsx com a etapa "Entrega e pagamento" atual (pode importar e estender por prop, sem quebrar o uso no carrinho: se precisar mudar o arquivo do carrinho, só adicione uma prop opcional).

Não chame nenhuma API do Mercado Pago. Não calcule nada que vá para o servidor além dos campos do contrato.
Teste: crie tests/unit/checkout-form.test.tsx só se o projeto já tiver testes de componente; senão, monte numa página de rascunho local (não commitada) e tire capturas em 390 e 1440 px em output/fase5-c4/.
```

---

## C5 — Página "obrigado" e atualização automática

```
Projeto busca-agora, branch fase-5-checkout. Leia CLAUDE.md, docs/fase-5-plano.md e as regras do topo de docs/fase-5-prompts-codex.md.

Tarefa: a página /pedido/[numero]/obrigado. Ela SÓ LÊ o banco: nunca muda status (CLAUDE.md regra 3).

Arquivos (novos):
- app/(loja)/pedido/[numero]/obrigado/page.tsx (Server Component, dinâmica, robots noindex):
  Exige login (requireUser de lib/auth/session, volta para a própria página). Busca com getMyOrder(user.id, numero) de lib/orders/customer.ts; se não existir, notFound().
  Estados pelo status do pedido:
  - pending_payment: título "Falta pouco!" com o número do pedido, total, forma de pagamento, aviso "Assim que o Mercado Pago confirmar, esta página atualiza sozinha", e o componente de atualização automática.
  - paid (e qualquer status depois dele): "Pedido confirmado!" com resumo (itens, total, endereço, frete), "Despacho em até 24 h depois do pagamento" e links para /conta/pedidos/[numero] e para continuar comprando.
  - canceled: "Pedido cancelado" (o pagamento não foi feito a tempo) e botão para voltar ao carrinho.
  Visual da loja (cartão branco, faixa de cor no topo, ícones de traço, entrada ba-entra).
- components/checkout/order-status-poller.tsx ("use client"):
  export function OrderStatusPoller({ numero, status }: { numero: string; status: string })
  Enquanto status === "pending_payment": a cada 4 s faz GET /api/pedidos/{numero}/status (o Claude Code cria a rota; resposta { status: string }) e, quando mudar, chama router.refresh(). Para depois de 30 min, quando a aba fica escondida (retoma ao voltar) e ao desmontar. Região aria-live="polite" com "Aguardando pagamento…".

Teste: o Claude Code integra e testa ponta a ponta com o Mercado Pago simulado. Você confere lint, typecheck e capturas dos três estados em 390 e 1440 px (pode simular com dados de rascunho não commitados) em output/fase5-c5/.
```

---

## C6 — Validação das respostas do Mercado Pago

```
Projeto busca-agora, branch fase-5-checkout. Leia CLAUDE.md, docs/fase-5-plano.md e as regras do topo de docs/fase-5-prompts-codex.md. Consulte a documentação oficial atual do Mercado Pago (Checkout Pro: criar preferência; API de pagamentos: obter pagamento; estornos; notificações webhook).

Arquivo (novo): lib/payments/mercadopago/schemas.ts + tests/unit/mercadopago-schemas.test.ts

Schemas zod (só os campos que usamos, com .passthrough() onde fizer sentido) e os tipos inferidos:
- preferenceResponse: id, init_point, sandbox_init_point.
- paymentResponse: id (number), status (approved | pending | in_process | rejected | cancelled | refunded | charged_back | outros como string), status_detail, external_reference (string | null), transaction_amount (number em reais), currency_id ("BRL"), payment_method_id, payment_type_id, installments, date_approved (string | null).
- refundResponse: id, status, amount.
- webhookBody: type ou topic, action (opcional), data.id (string ou number, normalizado para string).
- função toCents(reais: number): number que converte transaction_amount para centavos sem erro de float (ex.: 89.9 -> 8990, 0.1+0.2 -> 30), e testes com casos de borda.
Testes com payloads de exemplo copiados da documentação (sem dados reais de cliente).
```

---

## C7 — Corpo da preferência do Checkout Pro

```
Projeto busca-agora, branch fase-5-checkout. Leia CLAUDE.md, docs/fase-5-plano.md e as regras do topo de docs/fase-5-prompts-codex.md. Consulte a documentação oficial atual do Checkout Pro (campos da preferência: items, payer, back_urls, auto_return, notification_url, external_reference, payment_methods, expires/expiration_date_to, statement_descriptor, shipments.cost se aplicável).

Arquivo (novo): lib/payments/mercadopago/preference-body.ts + tests/unit/preference-body.test.ts

export type PreferenceOrder = {
  id: string; numero: string; totalCents: number; freteCents: number; freteServico: string;
  pagamento: "pix" | "card";
  cliente: { nome: string; email: string; cpf: string };
  itens: { sku: string; nome: string; quantidade: number; precoCents: number }[];
};
export function buildPreferenceBody(order: PreferenceOrder, opts: { siteUrl: string; webhookUrl: string; expiresAt: Date }): Record<string, unknown>

Regras:
- external_reference = order.id. Itens com unit_price em reais a partir dos centavos (precoCents / 100, sem erro de arredondamento) e currency_id "BRL"; frete como um item "Frete · {freteServico}" (ou shipments.cost, conforme a documentação; justifique a escolha no relatório).
- A soma dos itens + frete em centavos TEM que bater com totalCents; se não bater, lance erro (teste isso).
- back_urls success/pending/failure = {siteUrl}/pedido/{numero}/obrigado; auto_return "approved"; notification_url = webhookUrl.
- Só o meio escolhido: pix exclui cartões e boleto; card exclui Pix (bank_transfer) e boleto; installments até 12.
- Expiração da preferência = expiresAt (30 min para Pix).
- statement_descriptor "BUSCAAGORA". payer com nome, e-mail e CPF (identification type "CPF").
- Função pura, sem fetch e sem ler env.
```
