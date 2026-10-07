# Fase 9 — Acabamento: plano (aguardando aprovação)

Branch `fase-9-acabamento`. Divisão 50/50: o ChatGPT faz G27–G30 (`docs/fase-9-prompts-chatgpt.md`), o Claude Code faz o resto e revisa tudo. Sem custo: o domínio `buscaagora.com.br` (pago) fica para o fim, quando você decidir comprar.
Objetivo: instalável no celular e pronto para o público.

## Claude Code

1. **Dados da loja no banco** (migration nova): `settings` ganha nome do vendedor, documento (CPF ou CNPJ), endereço da empresa, e-mail e WhatsApp de contato e horário de atendimento. Uma função pública devolve só esses dados (nunca IE, regime, impressora). O admin edita em Configurações; rodapé e páginas legais leem dali (cache de 5 min, renovado ao salvar).
2. **PWA**:
   - `app/manifest.ts`: nome Busca Agora, cor `#3324F5`, `start_url` `/?origem=pwa` (a abertura animada já usa isso), tela cheia, atalhos (Buscar, Meus pedidos).
   - Ícones 192 e 512 (normal e maskable) e `apple-touch-icon`, gerados da logo E (`public/brand/logo-e-*.svg`).
   - Registrar o service worker do G28 só em produção; cabeçalhos certos para `/sw.js` (sem cache, escopo `/`).
3. **Páginas legais (decisão de 08/10)**: o Claude Code escreve o layout, os Termos de uso e a Política de privacidade (LGPD), marcados "em revisão".
4. **Rodapé** com os dados de `settings` (desktop e celular, igual ao design); some o texto provisório "[RAZÃO SOCIAL]".
5. **Lighthouse no celular** (Performance, Acessibilidade, Boas práticas e SEO ≥ 90) na Home, categoria, produto e busca: rodo, corrijo o que ficar abaixo e anexo o relatório no PR. Uso o `lighthouse` via `npx` (ferramenta do Google, só para medir; não entra no site).
6. **Testes**: banco (visitante lê os dados públicos da loja e nada mais de `settings`), unidade (regras do cache do service worker), e2e (manifest válido, `/sw.js` servido, páginas legais abrem com os dados da loja, aviso de cookies aparece uma vez, card de instalação no celular).
7. **Domínio** (quando você comprar): configurar `buscaagora.com.br` na Vercel com HTTPS e `www` redirecionando, e trocar `NEXT_PUBLIC_SITE_URL`. Eu te guio no Registro.br.

## ChatGPT (G27–G30)

| # | Arquivo | O que é |
| --- | --- | --- |
| G27 | `/trocas`, `/sobre`, `/contato` | Trocas e devoluções (CDC, 7 dias), formas de pagamento, Sobre e Contato |
| G28 | `public/sw.js`, `app/offline/page.tsx` + teste | Service worker (casca do site em cache, nunca checkout/conta/admin/carrinho/API) e página offline com a marca |
| G29 | `components/pwa/install-card.tsx`, `register-sw.tsx` | Card "Instale no celular": botão nativo no Android, passo a passo no iPhone, some quando já instalado |
| G30 | `components/loja/cookie-notice.tsx` + teste | Aviso de cookies simples (só usamos cookies necessários) |

## Decisões (08/10)

1. **Vendedor (CPF/CNPJ)**: fica para depois, junto com o Mercado Pago (precisa do pai do Enzo). Até lá o rodapé e as páginas mostram "[a preencher]" nesses campos; o site não abre ao público sem eles (`docs/checklist-lancamento.md`).
2. **Textos legais**: sem advogado; o Claude Code escreve Termos e Privacidade (CDC, Decreto 7.962/2013 e LGPD) e o ChatGPT escreve Trocas, Sobre e Contato; todos marcados "em revisão".
3. **Contato**: o Enzo cria um e-mail de SAC e preenche em Configurações no admin.

## O que não entra

- Notificação push do celular (fica em `docs/v2.md`).
- Compra do domínio: só quando você quiser (é o único custo da fase).
