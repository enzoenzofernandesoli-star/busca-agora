# Fase 3 — Conta do cliente: plano (aguardando aprovação)

Branch `fase-3-conta` (a partir de `fase-2-vitrine` até o PR #3 entrar na main).
Divisão de código 50/50 (pedido do Enzo, 06/10): o ChatGPT faz as peças G6–G10 (`docs/fase-3-prompts-chatgpt.md`), o Claude Code faz o resto e revisa tudo.

## Claude Code

1. **Supabase Auth no servidor** (`lib/auth/*`, Server Actions com zod):
   - cadastro (nome, e-mail, senha, aceite dos termos e da privacidade obrigatório → `profiles.terms_accepted_at`), entrar, sair, recuperar e redefinir senha, login com Google (OAuth com PKCE, rota `app/auth/callback/route.ts`).
   - Mensagens de erro genéricas ("e-mail ou senha incorretos"), sem dizer se o e-mail existe.
2. **`proxy.ts`** (no Next 16 o middleware se chama Proxy): renova a sessão do Supabase nos cookies e faz o redirecionamento rápido de `/conta/*` e `/admin/*` para `/entrar?volta=...`. A checagem que vale é no servidor: `requireUser()` em todo layout/action de conta e `requireAdmin()` (lê `profiles.role` no banco) no layout de `/admin`. `?volta=` só aceita caminho interno (sem open redirect).
3. **Limite de tentativas** (migration nova): tabela `auth_rate_limits` + função `hit_rate_limit(chave, max, janela)` só para service role. Chave = hash de IP + e-mail. Login: 5 tentativas / 15 min por e-mail e 20 / 15 min por IP. Cadastro e recuperação: 5 / hora por IP. Soma-se ao limite que o próprio Supabase Auth já tem.
4. **Exclusão de conta (LGPD)** (migration nova): função `delete_account(user_id)` só service role. Apaga endereços, carrinho e dados do profile (nome, CPF, telefone), desliga os pedidos da conta (`user_id = null`) e remove o usuário do Auth. Pedidos e notas ficam com as cópias fiscais (ver decisão abaixo). Tela com confirmação digitando "EXCLUIR".
5. **Telas** `/entrar`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/conta`, `/conta/enderecos`, no visual da loja (não há arquivo de design dessas telas: uso os mesmos cards, campos e botões das telas aprovadas). Header e barra inferior passam a mostrar "Olá, {nome}" quando logado.
6. **Endereços**: Server Actions (criar, editar, excluir, marcar principal) com zod; o índice único do banco garante um principal só.
7. **Testes**: Vitest (rate limit, `?volta=`, schemas), banco (rate limit, `delete_account`, cliente não chama as funções), Playwright: cadastro, login, logout, editar endereço, cliente comum barrado no `/admin`, exclusão de conta. E-mails de teste no Supabase local (Inbucket/Mailpit), nunca e-mail real.

## ChatGPT (G6–G10)

| # | Arquivo | O que é |
| --- | --- | --- |
| G6 | `lib/br/cpf.ts` + teste | Validação de CPF (dígitos verificadores), máscara, normalização |
| G7 | `lib/br/cep.ts`, `lib/br/telefone.ts` + testes | Máscara/validação de CEP e telefone, cliente ViaCEP com timeout e zod |
| G8 | `components/conta/auth-form.tsx`, `password-field.tsx`, `field.tsx` | Campos e formulário das telas de login/cadastro (só visual + `useActionState`) |
| G9 | `components/conta/address-form.tsx`, `address-card.tsx` | Formulário de endereço com CEP que preenche sozinho e card de endereço |
| G10 | `components/conta/account-nav.tsx`, `delete-account-dialog.tsx` | Menu lateral da conta e diálogo de exclusão com confirmação |

## Preciso do seu ok em 2 pontos

1. **Exclusão de conta x prazo fiscal.** A lei obriga a guardar a nota fiscal (com nome e CPF do comprador) por 5 anos. Proposta: na exclusão, a conta, os endereços e os dados do perfil somem; os pedidos ficam só com as cópias que já estão no pedido e na nota (nome, CPF, endereço da entrega), sem ligação com a conta. Depois de 5 anos, um job futuro (fase 10, `docs/v2.md`) anonimiza esses pedidos.
2. **Login com Google** precisa de uma configuração sua (eu não mexo em painel): criar o cliente OAuth no Google Cloud e colar o Client ID e o Secret no Supabase em Authentication → Providers → Google. Eu te passo o passo a passo. Até lá, o botão "Entrar com Google" aparece e o resto funciona com e-mail e senha.
