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

## Ainda a preencher nas próximas fases

- [ ] Mercado Pago: credenciais de produção (fase 5 começa com as de teste).
- [ ] Dados legais no rodapé (razão social ou nome, CPF/CNPJ, endereço, e-mail).
- [ ] Domínio `buscaagora.com.br` apontado para a Vercel e Site URL no Supabase.
- [ ] Supabase Auth: URLs de redirecionamento, política de senha e, se quiser, login com Google.
- [ ] PrintNode, Resend e Telegram (fases 6 e 7).

## Rotina depois de abrir (prometido na Política de privacidade)

- [ ] Uma vez por ano: apagar ou anonimizar os dados pessoais dos pedidos com mais de 5 anos (nome, CPF, endereço, e-mail), mantendo valores e itens. Atender na hora quem pedir antes disso, se o prazo fiscal já passou.
- [ ] Pedidos de titular (acesso, correção, exclusão, portabilidade) pelo e-mail do SAC: responder em até 15 dias.
