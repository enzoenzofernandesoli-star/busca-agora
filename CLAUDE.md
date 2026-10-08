# Busca Agora — contexto do projeto (leia inteiro antes de qualquer tarefa)

Este arquivo é a fonte da verdade do projeto. Se algum pedido contradisser este arquivo, PARE e pergunte antes de seguir.
O mesmo conteúdo existe em `AGENTS.md` (para o Codex). Se mudar um, mude o outro.

## 1. O que estamos construindo

- Loja virtual própria da **Busca Agora**: eletrônicos e cosméticos. Um vendedor só (nós). NÃO é marketplace de vários vendedores.
- Experiência de compra no nível do Mercado Livre: busca forte, filtros, página de produto completa, frete por CEP, acompanhamento do pedido.
- Donos: Enzo (produto e tecnologia) e o pai (operação: fornecedores, estoque, expedição).
- **Prazo: loja no ar em 20/10/2026.** Decisão em 13/10: se o pagamento não funcionar de ponta a ponta, a v1 sobe só com Pix.
- A estrutura sobe VAZIA de produtos. Produtos entram pelo painel admin depois.
- "App" = **PWA** (site instalável no celular). Não existe app nativo na v1.

## 2. Regras de ouro (não negociáveis)

1. **Dinheiro sempre em centavos (integer).** Nunca float. `8990` = R$ 89,90. Formatação só na tela, com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
2. **Preço, frete e total são calculados no servidor** a partir do banco. Nunca confiar em valor vindo do navegador.
3. **Pedido só vira `paid` pelo webhook do Mercado Pago**, com assinatura validada E consulta do pagamento na API do Mercado Pago. A tela de retorno do checkout NUNCA muda status.
4. **Webhooks idempotentes**: o mesmo aviso recebido duas vezes não pode gerar duas notas, duas etiquetas nem duas baixas de estoque (tabela `webhook_logs` + chaves únicas).
5. **RLS ligado em todas as tabelas.** Cliente só lê o que é dele. Só o servidor (service role) escreve em pedido, pagamento, nota, etiqueta e jobs.
6. **Segredos só no servidor.** Nada secreto com prefixo `NEXT_PUBLIC_`. Nunca escrever chave em código, teste, log ou commit.
7. **Dados de cartão nunca passam pelo nosso servidor** (Mercado Pago Checkout Pro).
8. **Status do pedido só muda no servidor** e cada mudança grava uma linha em `order_events`.
9. **Integrações externas atrás de interfaces nossas**: `lib/shipping`, `lib/invoice`, `lib/printer`, `lib/payments`, `lib/notify`. Trocar de fornecedor não pode exigir mexer na loja.
10. **Tudo que pode falhar lá fora roda na fila `jobs`** com até 5 tentativas e backoff, e alerta no Telegram quando esgota.
11. Escopo fechado: qualquer ideia fora da lista da v1 vai para `docs/v2.md`, não para o código.
12. Uma fase por vez. Antes de codar, mostrar o plano e esperar aprovação.

## 3. Stack

| Camada | Ferramenta |
| --- | --- |
| App | Next.js (última versão estável, App Router) + TypeScript `strict` |
| Visual | Tailwind CSS + shadcn/ui, fontes Sora e DM Sans via `next/font/google` |
| Banco, login, arquivos | Supabase (Postgres, Auth, Storage), migrations em `supabase/migrations` |
| Validação | zod em toda entrada (formulário, rota, webhook) |
| Pagamento | Mercado Pago Checkout Pro + webhook |
| Frete | Melhor Envio API (cotação, compra, geração e impressão de etiqueta) |
| Nota fiscal | API de NF-e (primeira opção: Focus NFe), começa em homologação |
| Impressão | PrintNode API (impressora térmica 10x15 cm) |
| PDFs | `@react-pdf/renderer` (resumo do pedido 10x15) |
| E-mail | Resend + React Email |
| Aviso interno | Bot do Telegram |
| Erros | Sentry |
| Testes | Vitest (unidade) + Playwright (fluxo de compra) |
| Hospedagem | Vercel, domínio buscaagora.com.br |

Antes de usar qualquer biblioteca ou API externa, consulte a documentação oficial atual. Não invente endpoint, campo ou parâmetro.

## 4. Identidade visual

Referência visual completa: `docs/design/*.dc.html`. São os arquivos-fonte do design aprovado (HTML com estilos inline): leia o código e copie medidas, cores, espaçamentos, tamanhos de fonte e textos exatamente. Eles não abrem sozinhos no navegador; as tags `<sc-for>`, `<sc-if>` e `{{...}}` são só o formato do editor de design, não copie esse formato. O site deve ficar IGUAL a essas telas.

Tokens (colocar no Tailwind como cores nomeadas):

| Token | Hex | Uso |
| --- | --- | --- |
| `ultramar` | #3324F5 | Cor principal: header, botões principais, links |
| `ultramar-700` | #2416D6 | Hover do botão principal |
| `noite` | #0A0F3D | Texto principal, banner escuro, rodapé |
| `lima` | #C6FF3D | Destaque: botão de busca, CTAs sobre azul, selo |
| `ciano` | #7ADFFF | Categoria Eletrônicos |
| `ciano-ink` | #08708F | Ícones/texto de eletrônicos sobre fundo claro |
| `ciano-tile` | #E6F8FF | Fundo de foto/placa de eletrônicos |
| `rosa` | #FF9AC8 | Categoria Cosméticos |
| `rosa-ink` | #B0306E | Ícones/texto de cosméticos sobre fundo claro |
| `rosa-tile` | #FFF0F7 | Fundo de placa de cosméticos |
| `fundo` | #F4F5FA | Fundo das páginas |
| `borda` | #E3E5F2 | Bordas de cards |
| `texto-2` | #4A4F70 | Texto secundário |
| `lavanda` | #DCDFFF | Texto claro sobre azul/noite |

- Títulos, preços e números: **Sora** 700/800. Texto: **DM Sans** 400/500/700.
- Cantos: cards 22–28 px, botões 14–16 px, chips 999 px.
- Logos em `public/brand/`: `logo-d-branco.svg` (site, sobre azul), `logo-d-escuro.svg` (sobre claro), `logo-e-branco.svg` e `logo-e-escuro.svg` (celular, ícone do app, foto da loja).
- Slogan: "Buscou? Tá aqui." ("Tá aqui." em lima sobre fundo escuro).
- Ícones: traço (stroke), estilo Lucide. Nunca emoji.
- Acessibilidade: contraste mínimo 4.5:1, alvos de toque ≥ 44 px, `<button>`/`<a>` de verdade, `aria-label` em botão só de ícone.
- **Abertura animada (splash)**: no máximo 1,5 s, UMA VEZ POR SESSÃO do navegador (cookie de sessão `ba_sessao`; decisão de 08/10) e quando abrir como PWA. Atualizar a página (F5) não repete. Pré-carregamentos de link não contam como visita. Respeitar `prefers-reduced-motion`.
- **Troca de página**: barra fina no topo do clique até a página nova aparecer, e a página entra com fade curto (só opacidade).

## 5. Fluxo de um pedido

1. Cliente monta o carrinho e calcula o frete no CEP (Melhor Envio).
2. Checkout: endereço → frete → CPF → forma de pagamento. Servidor recalcula tudo e cria o pedido `pending_payment` com cópias de nome, CPF, endereço, preços e NCM, e reserva o estoque (`reserve_stock`; faltou estoque, o pedido não é criado).
3. Servidor cria a preferência no Mercado Pago (Checkout Pro) com `external_reference` = id do pedido.
4. Webhook do Mercado Pago → valida assinatura → consulta o pagamento → se aprovado: marca `paid` (o estoque já foi reservado na criação do pedido, passo 2).
5. Fila `jobs` dispara em ordem: e-mail + Telegram → emitir NF-e → comprar e gerar etiqueta no Melhor Envio (com a chave da nota) → gerar PDF do resumo → mandar 3 impressões ao PrintNode (resumo, DANFE simplificada, etiqueta, todos 10x15).
6. Webhook do Melhor Envio atualiza rastreio → `shipped` → `delivered`, com e-mail ao cliente em cada etapa.
7. Pix não pago em 30 min e boleto não pago em 3 dias: pedido `canceled`, reserva de estoque devolvida.

Status: `pending_payment` → `paid` → `invoiced` → `label_ready` → `printed` → `shipped` → `delivered`, mais `canceled` e `refunded`.

Se a NF-e automática estiver desligada (`NFE_ENABLED=false`, enquanto não houver CNPJ + IE + certificado A1), a fila pula a nota, gera a etiqueta com declaração de conteúdo e marca o pedido para emissão manual no admin.

## 6. Banco de dados (18 tabelas, todas com RLS)

| Tabela | Campos principais | Acesso |
| --- | --- | --- |
| `profiles` | id (= auth.users.id), nome, cpf, telefone, terms_accepted_at, role (`customer`/`admin`) | dono; admin |
| `addresses` | user_id, cep, rua, numero, complemento, bairro, cidade, uf, principal | dono |
| `categories` | nome, slug, cor, icone, ordem, ativa | leitura pública; escrita admin |
| `brands` | nome, slug | leitura pública; escrita admin |
| `products` | nome, slug, descricao, category_id, brand_id, ncm, cfop, origem, ativo, destaque | leitura pública (só ativos); escrita admin |
| `product_variants` | product_id, sku, nome, preco_cents, preco_de_cents, custo_cents, estoque, peso_g, altura_cm, largura_cm, comprimento_cm, ean | leitura pública SEM `custo_cents`; escrita admin |
| `product_images` | product_id, url, ordem, alt | leitura pública; escrita admin |
| `carts` | user_id ou session_id | dono |
| `cart_items` | cart_id, variant_id, quantidade | dono |
| `orders` | numero (BA-000123), user_id, status, subtotal_cents, frete_cents, desconto_cents, total_cents, frete_servico, endereco (jsonb cópia), cliente_nome, cliente_cpf, payment_method | dono lê; só servidor escreve |
| `order_items` | order_id, variant_id, nome, sku, ncm, preco_cents, quantidade | igual a orders |
| `payments` | order_id, mp_payment_id (único), metodo, status, valor_cents, parcelas, raw (jsonb) | só servidor e admin |
| `invoices` | order_id (único), numero, serie, chave, status, xml_url, danfe_url | dono lê; servidor escreve |
| `shipments` | order_id (único), me_order_id, transportadora, servico, rastreio, etiqueta_url, status | dono lê; servidor escreve |
| `jobs` | tipo (`notify`,`invoice`,`label`,`print`,`email`), order_id, status, tentativas, ultimo_erro, run_at; único (tipo, order_id) | só servidor e admin |
| `order_events` | order_id, evento, detalhe (jsonb), created_at | dono lê os seus; admin |
| `webhook_logs` | origem, external_id, payload, processed_at; único (origem, external_id) | só servidor |
| `settings` | razão social, cnpj, ie, endereço de origem, regime tributário, printer_id | só admin |

- A reserva de estoque acontece na criação do pedido (decisão de 06/10): função Postgres `reserve_stock` (`security definer`) numa transação, com `select ... for update`, idempotente. O cancelamento devolve com `restore_stock`.
- `custo_cents` NUNCA vai para o navegador (usar view pública sem essa coluna).
- Testes de RLS obrigatórios: cliente A não lê pedido, endereço nem nota do cliente B.

## 7. Telas

Loja: `/`, `/c/[categoria]`, `/busca`, `/p/[produto]`, `/carrinho`, `/checkout`, `/pedido/[numero]/obrigado`, `/entrar`, `/cadastro`, `/recuperar-senha`, `/conta`, `/conta/enderecos`, `/conta/pedidos`, `/conta/pedidos/[numero]`, `/rastreio`, `/termos`, `/privacidade`, `/trocas`, `/sobre`, `/contato`.

Admin (`/admin`, protegido NO SERVIDOR por role): painel, pedidos (lista e detalhe com reimprimir, reemitir nota, cancelar e estornar), produtos (cadastro com fotos, variações, peso, medidas, NCM), categorias, clientes, banners, configurações (dados da empresa e status das integrações, nunca o valor das chaves).

Celular: tudo pensado primeiro para 390 px. Barra inferior de app (Início, Categorias, Carrinho, Pedidos, Conta) só no celular.

## 8. Variáveis de ambiente

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
MELHORENVIO_TOKEN=
MELHORENVIO_ENV=sandbox
NFE_ENABLED=false
NFE_API_TOKEN=
NFE_ENV=homologacao
PRINTNODE_API_KEY=
PRINTNODE_PRINTER_ID=
RESEND_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
SENTRY_DSN=
CRON_SECRET=
```

Validar todas no boot com zod (`lib/env.ts`). Faltou uma obrigatória: erro claro, nunca seguir em silêncio.

## 9. Convenções de código

- Pastas: `app/(loja)`, `app/(conta)`, `app/admin`, `app/api/webhooks/{mercadopago,melhorenvio,nfe}`, `app/api/cron`, `lib/{payments,shipping,invoice,printer,notify,email,db}`, `components/ui` (shadcn), `components/loja`, `supabase/migrations`, `tests`.
- Server Components por padrão; Client Components só onde há interação.
- Toda escrita sensível em Route Handler ou Server Action no servidor, com zod.
- Textos da interface em português do Brasil. Código, nomes de variáveis e commits em inglês.
- Datas no banco em UTC; exibição em `America/Sao_Paulo`.
- Commits pequenos, mensagem clara. Uma fase = uma branch = um Pull Request.
- Nada de `any`. Nada de `console.log` esquecido. Erros vão para o Sentry.

## 10. O que NÃO fazer

- Não criar marketplace, cupons, avaliações, lista de desejos, integração automática com ML/Shopee, app nativo ou checkout transparente na v1.
- Não instalar biblioteca sem dizer por quê.
- Não mudar cores, fontes ou layout do design sem pedido.
- Não apagar nem reescrever migration já aplicada: criar uma nova.
- Não marcar uma fase como pronta sem os testes passando e o deploy de prévia funcionando.
- Não usar dados reais de cliente em teste.

## 11. Definição de pronto (vale para toda fase)

- [ ] Funciona no celular (390 px) e no computador (1440 px), igual ao design.
- [ ] `npm run lint`, `npm run typecheck` e os testes passam.
- [ ] Deploy de prévia na Vercel abre sem erro.
- [ ] Nenhum segredo no código. RLS testado quando a fase mexe no banco.
- [ ] Resumo final: o que foi feito, como testar, o que ficou pendente.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
