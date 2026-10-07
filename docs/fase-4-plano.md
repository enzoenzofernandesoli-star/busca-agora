# Fase 4 — Carrinho e frete: plano (aguardando aprovação)

Branch `fase-4-carrinho` (a partir da main). Divisão 50/50: o ChatGPT faz G11–G15 (`docs/fase-4-prompts-chatgpt.md`), o Claude Code faz o resto e revisa tudo.
Referência da API: documentação oficial do Melhor Envio, "Cálculo de fretes por produtos" (`POST /api/v2/me/shipment/calculate`, sandbox em `sandbox.melhorenvio.com.br`, header `User-Agent: Aplicação (email)`, usar `custom_price` e `custom_delivery_time`).

## Claude Code

1. **Banco** (migration nova):
   - Funções do carrinho, todas numa transação e validando estoque no banco: `cart_add(variant, qtd)`, `cart_set_quantity(item, qtd)`, `cart_remove(item)`, `cart_merge(session_id)` (junta o carrinho de visitante no da conta ao entrar, somando quantidades até o estoque).
   - Carrinho de visitante: identificado por um cookie `ba_carrinho` (UUID aleatório, httpOnly, 30 dias). Como o banco não sabe de quem é um session_id, as funções de visitante só rodam pelo servidor (service role) com o id do cookie; carrinho de quem está logado usa a própria sessão (RLS).
   - Leitura do carrinho com preço e estoque atuais da variante (o preço exibido sempre vem do banco, nunca do navegador).
2. **`lib/cart`**: Server Actions (adicionar, alterar quantidade, remover) com zod; contagem para o ícone do header.
3. **`lib/shipping`**: interface `ShippingProvider` (`quote`, `buyLabel`, `generateLabel`, `printLabel`, `track`) e a implementação `melhorenvio` (só `quote` nesta fase; as outras lançam "não implementado"). Token só no servidor (`MELHORENVIO_TOKEN`), ambiente por `MELHORENVIO_ENV` (sandbox/production).
4. **Rota `POST /api/frete`**: recebe CEP + itens (variante e quantidade) e busca peso, medidas e preço no banco (nunca confia em valores do navegador), CEP de origem em `settings.endereco_origem`. Limite de chamadas por IP (mesma tabela da fase 3) e cache curto (10 min) por CEP + itens. Erros com mensagem clara: CEP inválido, nenhum serviço disponível, Melhor Envio fora do ar.
5. **Telas**: `/carrinho` (itens, quantidade respeitando estoque, remover, subtotal em centavos, frete, total estimado, botão "Continuar para o checkout" que leva à fase 5), botões "Adicionar ao carrinho" e "Comprar agora" do produto passam a funcionar, contador real no header e na barra do celular, componente de frete no produto e no carrinho (o checkout usa o mesmo na fase 5).
6. **Testes**: unidade (cálculo com a API do Melhor Envio mockada, sem internet), banco (estoque no carrinho, merge, cliente A não mexe no carrinho de B), e2e (adicionar, alterar, remover, frete com a rota mockada, merge no login).

## ChatGPT (G11–G15)

| # | Arquivo | O que é |
| --- | --- | --- |
| G11 | `lib/shipping/melhorenvio/schemas.ts` + teste | Schemas zod da requisição e da resposta do Melhor Envio e conversão para o nosso tipo (centavos, prazo) |
| G12 | `lib/shipping/package.ts` + teste | Monta os produtos da cotação (cm inteiros, kg, valor do seguro) a partir dos itens, com mínimos dos Correios |
| G13 | `components/loja/shipping-quote.tsx` | Componente de CEP + lista de fretes (estados: digitando, carregando, erro, sem serviço, resultado) |
| G14 | `components/carrinho/cart-line.tsx`, `cart-summary.tsx` | Linha do carrinho com quantidade e remover; resumo com subtotal, frete e total |
| G15 | `components/loja/add-to-cart.tsx` | Botões do produto ligados a uma Server Action, com aviso "Adicionado" e foco acessível |

## Preciso de você antes de eu testar a cotação de verdade

1. **Conta sandbox do Melhor Envio**: criar em https://sandbox.melhorenvio.com.br, gerar um token (Permissões: `shipping-calculate`; as de compra de etiqueta entram na fase 6) e colar no `.env.local` em `MELHORENVIO_TOKEN=` e no painel da Vercel (Production e Preview). Não me mande o token.
2. **CEP de origem** (de onde o seu pai despacha). Pode me dizer no chat: CEP não é segredo. Eu gravo em `settings.endereco_origem`.

Até lá, tudo funciona com a API mockada nos testes, e a tela mostra "Cálculo de frete indisponível no momento" se faltar token.
