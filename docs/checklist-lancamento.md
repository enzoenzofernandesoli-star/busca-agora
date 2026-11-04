# Checklist de lançamento (fase 10)

Tudo que precisa trocar de "teste" para "real" antes de abrir a loja em 20/10/2026.
Marque cada item quando estiver feito. Nenhuma chave vai para o chat: só no `.env.local` e no painel da Vercel.

## Melhor Envio (frete e etiquetas)

Decisão de 07/10: a conta de produção fica no nome do Enzo (CPF), que também vende.

- [ ] Criar a conta em https://melhorenvio.com.br (o site normal, **não** o sandbox) com nome, CPF, endereço de onde os pacotes saem e telefone.
- [ ] Gerar um token **novo** em Integrações → Permissões de acesso → Gerar novo token, com as permissões: `shipping-calculate`, `shipping-checkout`, `shipping-generate`, `shipping-print`, `shipping-tracking`, `cart-read`, `cart-write`.
  - O token do sandbox **não** serve na produção: são ambientes e contas separados no Melhor Envio, mesmo com o mesmo e-mail.
- [ ] No `.env.local` e na Vercel (uma entrada em Production e outra em Preview):
  - `MELHORENVIO_TOKEN` = token novo de produção
  - `MELHORENVIO_ENV` = `production`
- [ ] Conferir o CEP de origem: hoje é `01036100` (`settings.endereco_origem`). Se os pacotes saírem de outro endereço, avisar o Claude Code para atualizar.
- [ ] Colocar saldo na carteira real do Melhor Envio (cada etiqueta comprada é descontada dela; a cotação é grátis).
- [ ] Refazer o deploy de produção na Vercel e cotar um frete de verdade no site.

## Nota fiscal

- [ ] Vendendo no CPF: manter `NFE_ENABLED=false`. A etiqueta sai com declaração de conteúdo e o pedido fica marcado para emissão manual no admin.
- [ ] Antes de virar operação regular: confirmar com um contador o limite de vendas no CPF. Com MEI ou CNPJ + inscrição estadual + certificado A1, ligar a NF-e (`NFE_ENABLED=true`, `NFE_API_TOKEN`, `NFE_ENV=producao`).
- [ ] Quando a NF-e estiver ativa: ligar `emiteNotaFiscal: true` em `lib/config/empresa.ts` e trocar a seção "Nota fiscal" dos Termos pela versão explícita: "Quando a venda exige nota fiscal, ela é emitida em nome da Busca Agora (CNPJ 69.919.406/0001-79) e enviada para o e-mail do pedido. Se precisar de uma via ou tiver dúvida, fale com a gente." (decisão de 04/11).

## Ainda a preencher nas próximas fases

- [ ] Mercado Pago: credenciais de produção (fase 5 começa com as de teste).
- [ ] **Obrigatório:** tirar o boleto do Checkout Pro (`payment_methods.excluded_payment_types: [{ id: "ticket" }]` na preferência, em `lib/payments/mercadopago/preference-body.ts`). Boleto está fora da v1 e o site já não oferece; sem isso, a tela do Mercado Pago ainda mostraria (decisão de 04/11).
- [x] Dados legais no rodapé (razão social, CNPJ, endereço, e-mail): `lib/config/empresa.ts`, branch feat/dados-empresa.
- [ ] Domínio `buscaagora.com.br` apontado para a Vercel e Site URL no Supabase.
- [ ] Supabase Auth: URLs de redirecionamento, política de senha e, se quiser, login com Google.
- [ ] PrintNode, Resend e Telegram (fases 6 e 7).

## Dívida técnica (antes da fase 10)

- [ ] e2e de login instável quando os testes rodam em paralelo: o botão fica em "Aguarde..." por mais de 30 s (`admin.spec`, `conta.spec`). Passa isolado e também falha na `main` (04/11). Investigar número de workers, timeout e compilação do `next dev` antes da fase 10.

## Rotina depois de abrir (prometido na Política de privacidade)

- [ ] Uma vez por ano: apagar ou anonimizar os dados pessoais dos pedidos com mais de 5 anos (nome, CPF, endereço, e-mail), mantendo valores e itens. Atender na hora quem pedir antes disso, se o prazo fiscal já passou.
- [ ] Pedidos de titular (acesso, correção, exclusão, portabilidade) pelo e-mail do SAC: responder em até 15 dias.
