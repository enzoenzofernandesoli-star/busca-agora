# Fase 9 — Acabamento: plano (aguardando aprovação)

Branch `fase-9-acabamento`. Divisão 50/50: o ChatGPT faz G26–G30 (`docs/fase-9-prompts-chatgpt.md`), o Claude Code faz o resto e revisa tudo. Sem custo: o domínio `buscaagora.com.br` (pago) fica para o fim, quando você decidir comprar.
Objetivo: instalável no celular e pronto para o público.

## Claude Code

1. **Dados da loja no banco** (migration nova): `settings` ganha nome do vendedor, documento (CPF ou CNPJ), endereço da empresa, e-mail e WhatsApp de contato e horário de atendimento. Uma função pública devolve só esses dados (nunca IE, regime, impressora). O admin edita em Configurações; rodapé e páginas legais leem dali (cache de 5 min, renovado ao salvar).
2. **PWA**:
   - `app/manifest.ts`: nome Busca Agora, cor `#3324F5`, `start_url` `/?origem=pwa` (a abertura animada já usa isso), tela cheia, atalhos (Buscar, Meus pedidos).
   - Ícones 192 e 512 (normal e maskable) e `apple-touch-icon`, gerados da logo E (`public/brand/logo-e-*.svg`).
   - Registrar o service worker do G28 só em produção; cabeçalhos certos para `/sw.js` (sem cache, escopo `/`).
3. **Rodapé** com os dados de `settings` (desktop e celular, igual ao design); some o texto provisório "[RAZÃO SOCIAL]".
4. **Lighthouse no celular** (Performance, Acessibilidade, Boas práticas e SEO ≥ 90) na Home, categoria, produto e busca: rodo, corrijo o que ficar abaixo e anexo o relatório no PR. Uso o `lighthouse` via `npx` (ferramenta do Google, só para medir; não entra no site).
5. **Testes**: banco (visitante lê os dados públicos da loja e nada mais de `settings`), unidade (regras do cache do service worker), e2e (manifest válido, `/sw.js` servido, páginas legais abrem com os dados da loja, aviso de cookies aparece uma vez, card de instalação no celular).
6. **Domínio** (quando você comprar): configurar `buscaagora.com.br` na Vercel com HTTPS e `www` redirecionando, e trocar `NEXT_PUBLIC_SITE_URL`. Eu te guio no Registro.br.

## ChatGPT (G26–G30)

| # | Arquivo | O que é |
| --- | --- | --- |
| G26 | `components/legal/legal-page.tsx`, `/termos`, `/privacidade` | Layout das páginas legais e os textos de Termos de uso e Política de privacidade (LGPD) |
| G27 | `/trocas`, `/sobre`, `/contato` | Trocas e devoluções (CDC, 7 dias), formas de pagamento, Sobre e Contato |
| G28 | `public/sw.js`, `app/offline/page.tsx` + teste | Service worker (casca do site em cache, nunca checkout/conta/admin/carrinho/API) e página offline com a marca |
| G29 | `components/pwa/install-card.tsx`, `register-sw.tsx` | Card "Instale no celular": botão nativo no Android, passo a passo no iPhone, some quando já instalado |
| G30 | `components/loja/cookie-notice.tsx` + teste | Aviso de cookies simples (só usamos cookies necessários) |

## Preciso da sua decisão em 3 pontos

1. **Quem aparece como vendedor no site.** A lei do comércio eletrônico (Decreto 7.962/2013) obriga mostrar nome, **CPF ou CNPJ** e endereço do vendedor no site. Hoje você vende no seu CPF, então o site mostraria **seu nome, seu CPF e o endereço** (o de origem é a sua casa). Opções:
   - **(a) Abrir um MEI agora** (grátis, pelo gov.br, uns 15 minutos; varejo de eletrônicos e de cosméticos é permitido; tem limite de faturamento por ano, hoje em torno de R$ 81 mil — confira no gov.br). O site mostra o CNPJ do MEI, e o seu CPF não fica público. **Recomendo.**
   - (b) Mostrar nome + CPF + endereço até ter CNPJ.
   - (c) Deixar provisório agora e decidir antes de 20/10 (o site não pode abrir ao público sem isso).
2. **Textos legais**: o CLAUDE.md diz que você colocaria os textos em `docs/legal/`, mas a pasta não existe. Proposta: o ChatGPT escreve uma versão inicial (CDC e LGPD, com os dados da loja vindos do banco), marcada como **"revisar antes de abrir"**; você (ou um advogado) revisa. Se preferir mandar os seus textos, eu uso os seus.
3. **Contato no site**: e-mail e WhatsApp? Quais? (Pode ser o mesmo e-mail da sua conta; dá para trocar depois pelo admin.)

## O que não entra

- Notificação push do celular (fica em `docs/v2.md`).
- Compra do domínio: só quando você quiser (é o único custo da fase).
