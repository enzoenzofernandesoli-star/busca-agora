# Busca Agora — o que mandar para cada IA

## Quem faz o quê (e com qual modelo)

| Ferramenta | Função | Modelo | Pode escrever código? |
| --- | --- | --- | --- |
| **Claude Code** | Constrói o site inteiro, fase por fase | **Opus 5.5** (`/model claude-opus-5-5`) | **Sim, é o único** |
| **Codex** (OpenAI) | Revisor: lê o Pull Request de cada fase e aponta erros | **GPT-6 Sol** | **Não.** Só lê e comenta |
| **ChatGPT** | Imagens (banners, ícone do app, fotos com fundo branco) e textos (descrições, rascunhos legais, e-mails) | **GPT-6 Sol**, com a geração de imagens do próprio ChatGPT | Não |
| **Claude (esta conversa)** | Arquitetura, revisão do resumo de cada fase, próximos prompts | — | Não |

Por que só o Claude Code escreve código: duas IAs mexendo no mesmo código geram conflitos e bugs difíceis de achar. O Codex pega os erros que o Claude Code deixou passar, sem bagunçar o código.

## Antes da fase 0 (uma vez só)

1. Crie o repositório privado `busca-agora` no GitHub e clone no computador.
2. Coloque na raiz: `CLAUDE.md` e uma cópia dele chamada `AGENTS.md` (o Codex lê esse nome).
3. Crie `docs/design/` e coloque lá os arquivos da pasta `design-referencia` deste kit.
4. Crie `public/brand/` e coloque os 4 SVGs da logo (estão em `design-referencia/brand`).
5. Crie o projeto novo no Supabase (região São Paulo) e o projeto na Vercel ligado ao repositório.
6. Crie o arquivo `.env.local` com as chaves (lista no CLAUDE.md, seção 8). **Nunca cole uma chave no chat de nenhuma IA.**
7. Abra o Claude Code na pasta e rode `/model claude-opus-5-5`.

## Como rodar cada fase no Claude Code

1. Abra uma sessão nova para cada fase (`/clear` entre fases).
2. Ative o modo de planejamento (Shift+Tab até aparecer "plan mode").
3. Cole o prompt da fase. Leia o plano. Se fizer sentido, aprove.
4. No fim: teste o deploy de prévia no celular e no computador.
5. Abra o Pull Request e rode o **prompt de revisão do Codex**.
6. Cole a revisão do Codex de volta no Claude Code: "Corrija só o que for erro real e me diga o que você descartou e por quê."
7. Faça o merge. Mande o resumo final aqui, pra eu revisar contra a arquitetura.

---

## FASE 0 — Fundação (6 e 7/10)

```
Leia o CLAUDE.md inteiro e os arquivos em docs/design/ antes de qualquer coisa.

Fase 0 — Fundação. Objetivo: projeto rodando, com a identidade visual pronta pra ser usada em todas as telas.

Faça:
1. Projeto Next.js (última versão estável, App Router, TypeScript strict) com Tailwind e shadcn/ui.
2. Fontes Sora e DM Sans via next/font. Tokens de cor do CLAUDE.md (seção 4) no Tailwind, com os nomes da tabela.
3. lib/env.ts validando TODAS as variáveis de ambiente com zod (seção 8).
4. Clientes do Supabase: navegador (anon), servidor (cookies) e admin (service role, só no servidor, com "server-only").
5. Layout base da loja: header azul com logo D, busca com botão lima, CEP, menu de categorias, carrinho com contador, e rodapé noite com o lugar dos dados legais, igual a docs/design/Home.dc.html. No celular, header compacto e barra inferior de app igual a docs/design/Celular-Home.dc.html.
6. Componentes base reutilizáveis: Button (principal, lima, contorno), ProductCard, CategoryChip, Price (recebe centavos), SectionHeader.
7. ESLint, Prettier, scripts lint/typecheck/test, Vitest e Playwright configurados com 1 teste de exemplo cada.
8. Sentry configurado.
9. docs/v2.md criado (lista de ideias fora da v1).

Não faça ainda: banco, login, pagamento.

Antes de codar, mostre o plano com a estrutura de pastas. Ao terminar, me dê: o que foi feito, como testar, e o que ficou pendente. Siga a Definição de pronto do CLAUDE.md.
```

## FASE 1 — Banco de dados e segurança (7/10)

```
Leia o CLAUDE.md (seções 2, 5 e 6).

Fase 1 — Banco. Objetivo: as 18 tabelas, as regras de acesso e a função de estoque, testadas.

Faça:
1. Migrations em supabase/migrations com as 18 tabelas da seção 6. Dinheiro em centavos (integer). Chaves únicas: payments.mp_payment_id, invoices.order_id, shipments.order_id, jobs(tipo, order_id), webhook_logs(origem, external_id).
2. RLS em TODAS as tabelas, exatamente como a coluna "Acesso". Uma view pública de variantes SEM custo_cents.
3. Trigger que cria o profile quando um usuário se cadastra.
4. Gerador do número do pedido (BA-000001, sequencial).
5. Função Postgres de baixa de estoque, transacional, com lock, que falha se faltar estoque.
6. Função que só o servidor chama para mudar o status do pedido e gravar em order_events.
7. Seed: categorias Eletrônicos (cor #7ADFFF) e Cosméticos (cor #FF9AC8). Nenhum produto.
8. Tipos TypeScript gerados do banco.
9. Testes: cliente A não lê pedido, endereço nem nota do cliente B; anônimo não lê custo; duas compras simultâneas da última unidade, só uma passa.

Mostre o plano com o SQL das políticas antes de aplicar. Siga a Definição de pronto.
```

## FASE 2 — Vitrine, busca e produto (8 e 9/10)

```
Leia o CLAUDE.md e docs/design/Main.dc.html, Home.dc.html, Produto.dc.html, Celular-Abertura.dc.html e Celular-Home.dc.html.

Fase 2 — Vitrine. Objetivo: o cliente encontra e vê produtos, igual ao design.

Faça:
1. Home igual ao design: banner "Buscou? Tá aqui.", cards de categoria, faixa de vantagens, "Mais buscados" (produtos com destaque), chamada pra instalar o app, vitrine de cosméticos.
2. Abertura animada (splash): logo D no computador, logo E no celular. No máximo 1,5 s, só na primeira visita (cookie) e quando abrir como PWA. Respeitar prefers-reduced-motion. Nunca bloquear quem chega por link de produto.
3. /c/[categoria] e /busca com filtros (preço, marca), ordenação (relevância, menor preço, maior preço, novidades) e paginação. Busca com full-text do Postgres em português e sugestões enquanto digita.
4. /p/[produto]: galeria, variações (cor), quantidade, estoque, preço em centavos formatado, "em até 12x no cartão", ficha técnica, "Quem buscou isso também viu". O cálculo de frete entra na fase 4 (deixe o componente pronto, sem a chamada).
5. Estados vazios bonitos (loja ainda sem produtos), carregamento com skeleton e 404 com a marca.
6. SEO: metadata por página, Open Graph com a logo, sitemap.xml, robots.txt, JSON-LD de Product.
7. Imagens com next/image, vindas do Supabase Storage.

Para testar, crie um script de seed SÓ de desenvolvimento com 6 produtos de exemplo, que nunca roda em produção.
Mostre o plano antes. Siga a Definição de pronto.
```

## FASE 3 — Conta do cliente (10/10)

```
Leia o CLAUDE.md.

Fase 3 — Conta. Objetivo: o cliente cria a conta, entra e gerencia seus dados.

Faça:
1. /cadastro, /entrar, /recuperar-senha com Supabase Auth: e-mail e senha e Google. Aceite dos termos e da privacidade obrigatório, gravando terms_accepted_at.
2. /conta (nome, CPF com validação de dígito, telefone), /conta/enderecos (vários, um principal, CEP preenche o endereço pelo ViaCEP).
3. Proteção das rotas de conta e de /admin no servidor (middleware + checagem de role no servidor).
4. Limite de tentativas no login e no cadastro.
5. Pedido de exclusão de conta (LGPD): apaga dados pessoais, mantém pedidos e notas pelo prazo fiscal, anonimizados.
6. Testes Playwright: cadastro, login, logout, editar endereço, usuário comum barrado no /admin.

Mostre o plano antes. Siga a Definição de pronto.
```

## FASE 4 — Carrinho e frete (11/10)

```
Leia o CLAUDE.md e a documentação oficial atual da API do Melhor Envio (cotação de frete, sandbox).

Fase 4 — Carrinho e frete. Objetivo: carrinho completo e frete real calculado pelo CEP.

Faça:
1. Carrinho para visitante (cookie de sessão) e para logado, juntando os dois no login.
2. /carrinho: adicionar, remover, alterar quantidade (respeitando estoque), subtotal em centavos.
3. lib/shipping com interface própria (quote, buyLabel, generateLabel, printLabel, track) e a implementação do Melhor Envio. Nesta fase, só quote.
4. Cotação usando o CEP de origem de settings, peso e medidas de cada variante. Mostra serviço, prazo e valor. Cache curto por CEP + carrinho.
5. Frete na página do produto, no carrinho e no checkout, com o mesmo componente.
6. Erros tratados: CEP inválido, sem serviço disponível, API fora do ar (mensagem clara, nunca tela quebrada).
7. Limite de chamadas na rota de cotação.
8. Testes unitários do cálculo com a API mockada.

Mostre o plano antes. Siga a Definição de pronto.
```

## FASE 5 — Checkout e Mercado Pago (12 e 13/10) — FASE CRÍTICA

```
Leia o CLAUDE.md (regras de ouro 1 a 8) e a documentação oficial atual do Mercado Pago: Checkout Pro, preferências, notificações/webhooks com validação de assinatura, e consulta de pagamento.

Fase 5 — Checkout e pagamento. Esta é a fase mais importante do projeto: um erro aqui custa dinheiro. Objetivo: o cliente paga com Pix, cartão ou boleto e o pedido vira "paid" com segurança.

Faça, igual a docs/design/Checkout.dc.html:
1. /checkout: endereço, CPF (obrigatório para nota e frete), escolha do frete, forma de pagamento, resumo.
2. Server Action que RECALCULA tudo no servidor (itens, preços, estoque, frete pela cotação) e cria o pedido pending_payment com as cópias (nome, CPF, endereço, preços, NCM).
3. lib/payments: cria a preferência do Checkout Pro com external_reference = id do pedido, itens, frete, payer, back_urls e notification_url.
4. /api/webhooks/mercadopago: valida a assinatura, grava em webhook_logs (idempotente), CONSULTA o pagamento na API, confere valor e external_reference, e só então chama a função que baixa o estoque e marca paid, numa transação. Responde 200 rápido.
5. /pedido/[numero]/obrigado: mostra o status lendo do banco (nunca muda status). Pix: instruções e atualização automática quando pagar.
6. Expiração: Pix 30 min e boleto 3 dias sem pagamento → canceled, estoque liberado (cron protegido por CRON_SECRET).
7. Estorno pelo admin, chamando a API do Mercado Pago, status refunded.
8. Testes: webhook com assinatura falsa é recusado; o mesmo webhook duas vezes não baixa estoque duas vezes; valor diferente do pedido é recusado; teste ponta a ponta no sandbox com Pix e cartão de teste.

Se até o fim desta fase cartão ou boleto não estiverem funcionando ponta a ponta, me avise: a v1 sobe só com Pix.
Mostre o plano antes e espere aprovação. Siga a Definição de pronto.
```

## FASE 6 — Automação: nota, etiqueta e impressão (14 e 15/10)

```
Leia o CLAUDE.md (seção 5) e a documentação oficial atual de: Melhor Envio (carrinho, checkout, geração e impressão de etiquetas, webhooks), Focus NFe (emissão de NF-e, homologação, webhooks) e PrintNode (criar print jobs).

Fase 6 — Automação pós-pagamento. Objetivo: pedido pago gera nota, etiqueta e os 3 papéis impressos sem ninguém clicar.

Faça:
1. Fila jobs: worker acionado por cron protegido (CRON_SECRET) e também logo após o pagamento. Até 5 tentativas com backoff, idempotente por (tipo, order_id). Esgotou: alerta no Telegram e botão "Tentar de novo" no admin.
2. lib/invoice (Focus NFe, ambiente de homologação): monta a NF-e a partir do pedido e de settings, recebe o retorno por webhook, guarda chave, XML (no Storage) e DANFE. Respeitar NFE_ENABLED: se false, pula e marca "emitir nota manualmente".
3. lib/shipping: compra a etiqueta com o saldo da carteira, gera (assíncrono, esperar antes de imprimir), pega o PDF 10x15. Usa a chave da NF-e; sem nota, usa declaração de conteúdo.
4. PDF do resumo do pedido 10x15 (react-pdf): número, data, cliente, itens com SKU, variação e quantidade, serviço de frete e QR code que abre o pedido no admin. Identidade da marca em preto e branco (impressora térmica).
5. lib/printer (PrintNode): manda 3 trabalhos em ordem — resumo, DANFE simplificada, etiqueta — para PRINTNODE_PRINTER_ID. Botão "Reimprimir" no admin.
6. /api/webhooks/melhorenvio: rastreio → shipped → delivered.
7. order_events em cada etapa.
8. Testes com as APIs mockadas: falha na nota não perde o pedido; reprocessar não compra duas etiquetas.

Mostre o plano antes. Siga a Definição de pronto.
```

## FASE 7 — E-mails, avisos e Meus pedidos (16/10)

```
Leia o CLAUDE.md.

Fase 7 — Comunicação. Objetivo: o cliente e nós sabemos de tudo na hora.

Faça:
1. React Email + Resend com a marca (logo D, Ultramar, lima): pedido recebido, pagamento aprovado, nota emitida (link do DANFE), pedido enviado (rastreio), pedido entregue. Disparados pela fila.
2. Telegram (lib/notify): "Novo pedido pago BA-000123 · R$ X · N itens · cidade/UF" e alertas de erro com link do admin.
3. /conta/pedidos e /conta/pedidos/[numero]: linha do tempo do pedido (order_events), rastreio, download da nota, botão "Pedir troca ou devolução" (registra o pedido e avisa no Telegram).
4. /rastreio público: número do pedido + e-mail.

Mostre o plano antes. Siga a Definição de pronto.
```

## FASE 8 — Painel admin (16 e 17/10)

```
Leia o CLAUDE.md (seção 7).

Fase 8 — Admin. Objetivo: o pai cadastra produtos e acompanha pedidos sem precisar de nós.

Faça, com a mesma identidade e simples de usar (pensar num usuário não técnico):
1. /admin: vendas de hoje, pedidos a enviar, pedidos com erro na fila, estoque baixo.
2. Pedidos: lista com filtro por status; detalhe com linha do tempo, reimprimir, reemitir nota, marcar nota manual emitida, cancelar e estornar (com confirmação).
3. Produtos: cadastro com upload de várias fotos (ordenar arrastando), variações, preço e custo em reais (convertidos pra centavos), estoque, peso, medidas e NCM OBRIGATÓRIOS, ativar/desativar, destaque.
4. Categorias, clientes (só leitura) e banners da home.
5. Configurações: dados da empresa e endereço de origem, impressora, e o status de cada integração (conectada/erro), nunca mostrando a chave.
6. Toda ação de admin validada no servidor pela role.

Mostre o plano antes. Siga a Definição de pronto.
```

## FASE 9 — PWA, páginas legais e domínio (17/10)

```
Leia o CLAUDE.md.

Fase 9 — Acabamento. Objetivo: instalável no celular e pronto para o público.

Faça:
1. PWA: manifest (nome Busca Agora, cor #3324F5, ícones 192 e 512 com a logo E, maskable), service worker com cache da casca do site e página offline com a marca. Nunca colocar em cache checkout, conta nem admin.
2. Card "Instale no celular" funcionando: prompt nativo no Android, instruções no iPhone.
3. Páginas /termos, /privacidade, /trocas, /sobre, /contato com os textos de docs/legal/ (eu vou colocar lá).
4. Rodapé com razão social, CNPJ, endereço e contato vindos de settings.
5. Banner de cookies simples.
6. Domínio buscaagora.com.br na Vercel, com HTTPS e redirecionamento do www.
7. Lighthouse no celular: Performance, Acessibilidade, Boas práticas e SEO acima de 90. Corrija o que ficar abaixo.

Mostre o plano antes. Siga a Definição de pronto.
```

## FASE 10 — Testes finais e produção (18/10)

```
Leia o CLAUDE.md.

Fase 10 — Ir para produção. Objetivo: ligar as chaves reais sem quebrar nada.

Faça:
1. Rode todos os testes. Escreva o teste Playwright completo: entrar → buscar → produto → carrinho → frete → checkout → pagar (sandbox) → pedido pago → jobs executados (mockados).
2. Revisão de segurança item a item da seção 2 do CLAUDE.md, com evidência de cada um.
3. Checklist de troca para produção: quais variáveis mudam, URLs de webhook a cadastrar em cada serviço, backup diário ligado no Supabase.
4. Página /admin/saude mostrando se cada integração responde.
5. Me entregue o roteiro do teste de compra real que eu vou fazer: Pix de R$ 1,00 num produto de teste, cartão, cancelamento e estorno.

Não troque nenhuma chave por conta própria: me diga o que trocar e onde.
```

---

## Prompt de revisão do Codex (use no fim de TODA fase)

Modelo: **GPT-6 Sol**. Modo: somente leitura / revisão.

```
Você é o revisor de código deste projeto. Leia o AGENTS.md inteiro antes.

NÃO altere nenhum arquivo. NÃO faça commit. Só leia e escreva a revisão.

Revise o Pull Request da fase [NÚMERO E NOME DA FASE] contra o AGENTS.md. Procure, nesta ordem:
1. Violações das regras de ouro (seção 2): dinheiro em float, preço vindo do navegador, status mudando fora do webhook, webhook sem idempotência, RLS faltando, segredo exposto.
2. Bugs: casos de erro não tratados, condições de corrida, estoque, datas e fuso.
3. Diferenças em relação ao design de docs/design/.
4. Testes que faltam para o que a fase entrega.

Para cada problema: arquivo e linha, o que está errado, o cenário concreto que quebra, gravidade (crítico / alto / médio / baixo) e a correção sugerida em texto.
Não aponte gosto pessoal ou estilo. Se não achar nada crítico, diga isso claramente.
```

---

## Prompts do ChatGPT (modelo GPT-6 Sol)

### 1. Ícone do app (PWA)

Anexe `logo-e-branco.svg` (ou o PNG do kit de logos).

```
Crie o ícone de aplicativo da loja Busca Agora a partir da logo anexada, sem alterar a logo.
- Fundo sólido azul ultramar #3324F5, quadrado, cantos retos (o celular arredonda sozinho).
- Logo em branco, centralizada, ocupando no máximo 60% da largura (área segura do ícone "maskable").
- Sem sombras, sem degradê, sem texto extra, sem bordas.
- Entregue em 1024x1024 PNG.
```

### 2. Banners da home

```
Crie um banner horizontal 1600x640 para a home da loja Busca Agora (eletrônicos e cosméticos).
Identidade: fundo azul-noite #0A0F3D, destaque azul ultramar #3324F5 em um grande anel circular saindo do canto superior direito, detalhes em verde-lima #C6FF3D.
À direita: composição limpa de produtos de [CATEGORIA: fones e smartwatch / sérum e protetor solar] em estúdio, iluminação suave, sombras realistas.
Deixe a metade esquerda livre (o texto será colocado pelo site, NÃO escreva texto na imagem).
Estilo: e-commerce premium, moderno, minimalista. Sem logos de marcas reais, sem texto, sem marca d'água.
```

### 3. Fotos de produto com fundo branco (regra do ML e da Shopee)

Anexe a foto do fornecedor.

```
Remova o fundo desta foto de produto e coloque fundo branco puro (#FFFFFF).
- Não altere o produto: mesma cor, forma, proporção, textos e detalhes.
- Produto centralizado, ocupando cerca de 85% da imagem, com sombra suave e natural embaixo.
- Formato quadrado 1200x1200.
- Sem texto, sem logo, sem selo, sem marca d'água.
```

### 4. Descrição de produto

```
Escreva a descrição de um produto para a loja Busca Agora. Tom: direto, claro, próximo, sem exagero e sem prometer o que a ficha não diz.
Use SOMENTE as informações da ficha abaixo. Se faltar uma informação, escreva [FALTA: ...] no lugar, nunca invente.

Formato:
1. Título para o site (até 70 caracteres, com o tipo de produto e o principal diferencial).
2. Um parágrafo de até 3 frases: para quem é e o que resolve.
3. Lista de até 5 destaques.
4. "Na caixa": itens.
5. Ficha técnica em tabela.
6. Título para o Mercado Livre (até 60 caracteres) e para a Shopee (até 100).

Ficha do fornecedor:
[COLE AQUI]
```

### 5. Rascunho das páginas legais

```
Escreva rascunhos, em português do Brasil e linguagem simples, das páginas de uma loja virtual brasileira de eletrônicos e cosméticos chamada Busca Agora:
1. Termos de uso.
2. Política de privacidade (LGPD): dados coletados (nome, e-mail, telefone, CPF, endereço), para quê (pedido, nota fiscal, entrega), com quem compartilhamos (Mercado Pago para pagamento, Melhor Envio e transportadoras para entrega, emissor de nota fiscal), por quanto tempo guardamos, e como o cliente pede acesso, correção ou exclusão.
3. Trocas e devoluções: direito de arrependimento de 7 dias (art. 49 do CDC), produto com defeito (art. 26 do CDC), como solicitar pelo site.
Use [RAZÃO SOCIAL], [CNPJ], [ENDEREÇO] e [E-MAIL] onde entram nossos dados.
Ao final, liste os pontos que um advogado ou contador precisa conferir.
```

Atenção: é rascunho. Um advogado ou o contador precisa revisar antes de publicar.

### 6. Textos dos e-mails

```
Escreva os textos de 5 e-mails automáticos da loja Busca Agora (slogan: "Buscou? Tá aqui."). Tom: próximo, curto, claro.
Para cada um: assunto (até 50 caracteres), pré-cabeçalho (até 90), título, corpo de até 3 frases e texto do botão.
1. Pedido recebido (aguardando pagamento).
2. Pagamento aprovado.
3. Nota fiscal emitida.
4. Pedido enviado (com código de rastreio).
5. Pedido entregue (pedir para avaliar a experiência).
Variáveis entre chaves: {nome}, {numero_pedido}, {rastreio}, {link}.
```

---

## Regras para não errar

1. **Uma fase por sessão** do Claude Code, sempre começando por "Leia o CLAUDE.md".
2. **Sempre no plan mode** primeiro. Se o plano tiver algo fora da fase, corte antes de aprovar.
3. **Nunca cole chave secreta** em nenhuma IA. Chave vai no `.env.local` e na Vercel.
4. **Teste no celular** o deploy de prévia de toda fase antes do merge.
5. **Codex só revisa.** Se ele sugerir uma mudança, quem aplica é o Claude Code.
6. **Ideia nova vai para `docs/v2.md`**, não pro código, até o dia 20.
7. **Fase 5 é a que não pode ter pressa**: se apertar o prazo, corte o admin bonito, nunca a segurança do pagamento.
8. **Mande o resumo de cada fase aqui** para eu revisar contra a arquitetura.
