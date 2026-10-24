# Auditoria de segurança e desempenho — 24/10/2026

Pedido do Enzo: avaliar a loja "como um hacker" antes de entrar dinheiro de verdade. Branch `auditoria-seguranca`. Revisão independente do Codex em paralelo, sobre a `main` em cópia separada (relatório próprio em `output/auditoria-codex.md`): 4 achados (1 alta, 2 médias, 1 baixa). Dois coincidiram com os meus (Next.js e enquadramento); os outros dois (A02 e A03) entraram na tabela abaixo. O Codex também confirmou, com provas próprias, isolamento entre clientes, RLS, regras de dinheiro, webhook, CSRF das Server Actions e limites dos uploads.

Tudo foi testado contra o **ambiente local** (Supabase em Docker e `next dev`/`next start`). Na produção só houve leitura comum (GET de páginas, cabeçalhos e Lighthouse), nenhum ataque.

## Ferramentas

| Ferramenta | O que fez | Resultado |
| --- | --- | --- |
| `npm audit` | dependências com falha conhecida | 3 falhas (1 crítica, 1 alta, 1 média) → **corrigidas** |
| gitleaks 8.30.1 | chaves no código e nos 151 commits do histórico | 4 alertas, todos falsos positivos (UUID de exemplo em teste, nomes de variáveis vazias na documentação) |
| Verificação própria | valores dos segredos do servidor procurados no JavaScript público (`.next/static`) | nenhum vazamento |
| semgrep (OWASP Top 10, TypeScript, React, Next.js, secrets) | análise estática | 1 aviso, seguro: `dangerouslySetInnerHTML` do JSON-LD escapa `<` |
| OWASP ZAP (varredura passiva) | site local em `next start` | nenhuma falha; avisos benignos (ver abaixo) |
| Testes de ataque próprios | `tests/db/pentest.test.ts` (6) e `tests/e2e/pentest.spec.ts` (8) | todos os ataques bloqueados |
| Lighthouse 12 (celular) | desempenho, acessibilidade, boas práticas, SEO em produção | ver tabela |

## Achados e correções

| # | Gravidade | Achado | Situação |
| --- | --- | --- | --- |
| 1 | **Crítica** | Next.js 16.3.8 com execução remota de código na otimização de imagens com SVG e negação de serviço em Server Actions (avisos do GitHub para 16.0.0–16.4.0) | **Corrigido**: Next e `eslint-config-next` 16.4.3 |
| 2 | Alta | zod < 4.6.6 pode esgotar a memória validando coleções grandes | **Corrigido**: 4.6.7 |
| 3 | Média | nodemailer ≤ 10.1.3: leitura de endereço que pode mandar e-mail para destinatário errado | **Corrigido**: 10.2.1 |
| 4 | Média | Sem proteção contra a loja ser aberta dentro de outro site (clickjacking) nem `nosniff`/`Referrer-Policy`/`Permissions-Policy` | **Corrigido**: cabeçalhos em todas as respostas (`next.config.ts`) |
| 5 | Baixa | Cabeçalho `X-Powered-By: Next.js` revelava a tecnologia | **Corrigido**: `poweredByHeader: false` |
| 6 | Baixa (desempenho) | 3 chaves estrangeiras das tabelas de métricas sem índice | **Corrigido** na migration `20261024090000_audit_indexes` (só no banco local) |
| 7 | Média (Codex A02) | Beacon de métricas aceitava envio de qualquer origem e sem limite; trocando o cookie de visitante dava para inflar views | **Corrigido**: recusa origem de outro site (403) e envio grande (413) e limita a 60 por IP a cada 10 min, independente do cookie |
| 8 | Média (Codex A03) | Erro do Mercado Pago copiava 300 caracteres da resposta deles para a mensagem (que vai ao Sentry e à fila); se a resposta trouxesse e-mail ou CPF do pagador, eles iriam junto | **Corrigido**: a mensagem leva só o status HTTP e os códigos de erro do Mercado Pago, nunca o texto; teste garante que e-mail, CPF e endereço não aparecem |
| 9 | Baixa (Codex, dev) | Vitest 4.1.11 com falhas conhecidas (só desenvolvimento) | **Corrigido**: 4.1.12; `npm audit` zerado também no desenvolvimento |

## O que foi atacado e resistiu

**Banco (chave pública e cliente comum)**
- Visitante só com a chave pública não lê nenhuma das 18 tabelas privadas (perfis, endereços, pedidos, pagamentos, notas, envios, fila, eventos, webhooks, configurações, métricas…), não escreve em pedido, pagamento nem catálogo, não lê o custo do produto e não chama nenhuma função do servidor.
- Cliente comum não consegue virar admin, não lê pedido, endereço, item, pagamento nem evento de outro cliente, e não chama funções do servidor nem de admin.
- As 24 tabelas estão com RLS. Só 3 funções de privilégio elevado podem ser chamadas de fora, todas de propósito: `is_admin`, `store_info` e `set_my_marketing_consent` (que usa o próprio login).

**Rotas do site**
- Crons (`/api/cron/*`) recusam sem a chave certa.
- `/admin`, métricas e clientes mandam o visitante para o login; para cliente comum dão 404 (não revelam que o painel existe). O CSV também.
- Status, detalhe e página de obrigado de pedido de outro cliente: 404.
- Login não redireciona para fora da loja (`//site`, `/\site`, `https://site`).
- Beacon de métricas recusa conteúdo inválido e ignora robôs.
- Webhook do Mercado Pago com assinatura falsa: 401.

**Já cobertos por testes anteriores**: preço, frete e total recalculados no servidor; webhook idempotente; estorno durável; expiração do Pix; corrida de estoque.

## Avisos do ZAP (benignos)

- "Atributo controlado pelo usuário" em `/busca?filtro=` e `/entrar?volta=`: o React escapa e `safeNext` só aceita caminho interno.
- "Ausência de token anti-CSRF": o Next.js confere a origem das Server Actions; as rotas POST sensíveis exigem assinatura ou chave.
- "CSP sem fallback": a CSP é parcial de propósito (ver pendências).
- "Redirect grande" e "Content-Type ausente": redirecionamentos para o login, sem dado sensível.

## Desempenho (Lighthouse, celular, produção)

| Página | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | TBT |
| --- | --- | --- | --- | --- | --- | --- |
| Home | 85 | 100 | 100 | 100 | 3,1 s | 270 ms |
| Categoria | 90 | 96* | 100 | 100 | 2,7 s | 270 ms |
| Produto | 77 | 100 | 100 | 100 | 3,1 s | 560 ms |
| Carrinho | 89 | 100 | 100 | 66** | 3,0 s | 210 ms |
| Entrar | 85 | 100 | 100 | 66** | 3,1 s | 370 ms |

\* Falso positivo: contraste medido no meio da animação de entrada dos cartões.
\*\* Proposital: páginas com `noindex`.

O ponto fraco é a página de produto: 0,9 s de estilo/layout e 1 s de script no celular (decorações animadas, faixa corrida, palco da foto). Melhoria sugerida para depois, sem mudar o visual: carregar a decoração do palco e a faixa só quando entram na tela.

## Pendências e recomendações

1. **CSP completa** (`script-src` com nonce): bloqueia scripts injetados mesmo se surgir uma falha de XSS. Exige nonce em todas as páginas e deixa as páginas estáticas dinâmicas; avaliar quando o tráfego crescer.
2. **Proteção contra senhas vazadas** no Supabase Auth (aviso do Supabase): ligar em Authentication → Policies (é do painel; quem liga é o Enzo).
3. **Aplicar** `20261024090000_audit_indexes` no Supabase remoto (só com autorização).
4. **Limites de tentativa** (login, frete, rastreio, checkout, beacon) já existem e têm testes de banco; não dá para medi-los no servidor local (ele libera o próprio computador). Eles usam o IP de `x-forwarded-for`, que a Vercel preenche.
6. **Download da etiqueta** (Codex): aceita a URL HTTPS que o Melhor Envio devolve e segue redirecionamentos; cliente nenhum controla essa URL, mas vale limitar domínio, redirecionamentos e tamanho quando a etiqueta real for ligada.
7. **Cookies de sessão do Supabase** (Codex): legíveis por JavaScript por desenho do cliente do Supabase; a CSP de scripts (item 1) é a proteção indicada.
5. Rodar esta auditoria de novo antes do lançamento e a cada mudança em pagamento.
