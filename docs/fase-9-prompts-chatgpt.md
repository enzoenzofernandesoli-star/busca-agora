# Fase 9 — prompts para o ChatGPT (G27 a G30)

Mesmo esquema: uma conversa por prompt. Ele **só cria os arquivos listados**, não mexe em nenhum outro, não instala nada, não faz commit nem push, e no fim te passa o resumo. Branch atual: `fase-9-acabamento`. Os 4 são independentes. O G26 (layout legal, Termos e Privacidade) ficou com o Claude Code (decisão de 08/10); o layout `components/legal/legal-page.tsx` já existe.

Bloco de contexto (já incluído em cada prompt):

> Projeto: loja virtual Busca Agora (eletrônicos e cosméticos, um vendedor só, Brasil). Next.js 16 (App Router, Server Components por padrão), React 19, TypeScript strict, Tailwind CSS v4, Vitest 4. Sem "any", sem console.log, sem biblioteca nova. Textos em português do Brasil, simples e diretos; código e comentários em inglês. Importações com "@/". Ícones SVG de traço (estilo Lucide), nunca emoji. Classes de cor do Tailwind: ultramar (#3324F5), ultramar-700, ultramar-50, noite (#0A0F3D), lima (#C6FF3D), fundo (#F4F5FA), borda (#E3E5F2), texto-2 (#4A4F70), lavanda (#DCDFFF), ciano-tile, ciano-ink, rosa-tile, rosa-ink. Fontes: font-display (Sora, títulos), font-sans (DM Sans). Cartões brancos com borda borda e cantos 22px (28px no desktop); botões com cantos 14px e altura mínima 48px. Alvos de toque ≥ 44 px, foco visível (outline-3 outline-offset-2 outline-ultramar), contraste ≥ 4.5:1. Pensado primeiro para celular de 390 px. Títulos de página: `<h1 className="m-0 font-display text-[28px] font-extrabold tracking-[-0.02em] md:text-[34px]">`.
>
> Dados da loja (já existem, NÃO crie este arquivo): `import { getStoreInfo, type StoreInfo } from "@/lib/store-info";` — `getStoreInfo(): Promise<StoreInfo>` com `StoreInfo = { marca: string; vendedor: string | null; documento: string | null /* já formatado: "CNPJ 12.345.678/0001-90" ou "CPF 123.456.789-09" */; endereco: string | null /* uma linha */; email: string | null; whatsapp: string | null /* só dígitos com DDI, ex.: "5511999998888" */; horario: string | null /* ex.: "Seg. a sex., 9h às 18h" */ }`. Campo null = ainda não preenchido: mostre "[a preencher]" no lugar, nunca invente dado.

---

## G27 — Trocas, Sobre e Contato

```
[cole o bloco de contexto]

Use o layout que já existe em components/legal/legal-page.tsx (leia o arquivo antes):
- LegalPage({ titulo, atualizadoEm, children, aviso? }) — página de leitura com cartão; estiliza h2, p, ul, li, a, strong vindos como HTML simples.
- StoreIdentity({ info }) — bloco com os dados da loja.

Tarefa: crie app/(loja)/trocas/page.tsx, app/(loja)/sobre/page.tsx e app/(loja)/contato/page.tsx (Server Components assíncronos que chamam getStoreInfo(); export const metadata com title e description).

1) /trocas (LegalPage, aviso, atualizadoEm "08/10/2026") — seções com h2 e ids:
- id="arrependimento": "Desistiu? Até 7 dias" — CDC art. 49: até 7 dias corridos após receber, sem precisar explicar; produto com embalagem e acessórios; frete de volta por nossa conta; reembolso integral pela mesma forma de pagamento (Pix na hora; cartão estornado na fatura em até 2 faturas, conforme o banco).
- id="defeito": "Produto com defeito" — até 30 dias (não duráveis, como cosméticos) ou 90 dias (duráveis, como eletrônicos) após receber, CDC art. 26; troca, conserto ou devolução do valor.
- id="como-pedir": passo a passo — Minha conta → Pedidos → abrir o pedido → "Pedir troca ou devolução" (link para /conta/pedidos); sem conta, fale pelo contato; respondemos em até 1 dia útil; enviamos a etiqueta de devolução.
- id="cosmeticos": produtos de higiene/cosméticos abertos ou usados só são trocados por defeito ou reação adversa comprovada; lacre intacto para arrependimento.
- id="pagamento": "Formas de pagamento" — Pix (aprovação na hora), cartão de crédito (parcelamento mostrado no pagamento), boleto (até 3 dias úteis para compensar); tudo pelo Mercado Pago; a loja não vê o número do cartão.
- id="entrega": prazo começa após o pagamento aprovado; rastreio em Meus pedidos e em /rastreio (link).

2) /sobre (sem aviso): título "Sobre a Busca Agora"; parágrafos curtos: loja online de eletrônicos e cosméticos, vendedor único (não é marketplace), negócio de família; o slogan "Buscou? Tá aqui." em destaque (cartão noite, texto branco, "Tá aqui." em lima, font-display); 3 cartões lado a lado no desktop e empilhados no celular com ícone de traço: "Pix aprovado na hora", "Frete calculado no seu CEP", "Troca em até 7 dias" (com link para /trocas); StoreIdentity no fim.

3) /contato (sem aviso): título "Fale com a gente"; cartões de contato:
- WhatsApp (se whatsapp não for null): botão principal bg-lima text-noite "Chamar no WhatsApp" para https://wa.me/{whatsapp}?text= com texto codificado "Olá! Vim pelo site da Busca Agora." (target=_blank rel="noopener noreferrer", texto escondido "(abre em nova aba)"); se null: "[a preencher]".
- E-mail: link mailto com o e-mail (ou "[a preencher]").
- Horário de atendimento (ou "[a preencher]").
- Atalhos: "Rastrear pedido" (/rastreio), "Meus pedidos" (/conta/pedidos), "Trocas e devoluções" (/trocas).
- StoreIdentity no fim.
Nada de formulário nesta página (não guardamos mensagens no site).

Entregue os 3 arquivos completos.
```

---

## G28 — Service worker e página offline

```
[cole o bloco de contexto]

Tarefa: crie public/sw.js, app/offline/page.tsx e tests/unit/sw-policy.test.ts.

1) public/sw.js — JavaScript puro (sem build, sem import de pacote, roda no navegador), escopo "/".
- const VERSION = "ba-v1"; caches: `${VERSION}-shell` e `${VERSION}-static`.
- install: pré-carrega a casca: "/offline", "/brand/logo-d-branco.svg", "/brand/logo-e-branco.svg", "/brand/logo-e-escuro.svg", "/manifest.webmanifest", "/icons/icon-192.png"; depois self.skipWaiting().
- activate: apaga caches de outras versões; clients.claim().
- Exporte a regra de decisão como função pura no topo do arquivo e deixe-a testável assim: `function policyFor(url, method, mode) { ... }` que devolve "network-only" | "network-first-offline" | "cache-first" | "stale-while-revalidate", e no fim do arquivo: `if (typeof module !== "undefined") module.exports = { policyFor };` (o navegador ignora; o teste usa).
- Regras de policyFor (url é string absoluta; só mesma origem do site; método diferente de GET -> "network-only"):
  * NUNCA cache (network-only): qualquer caminho que comece com /checkout, /carrinho, /conta, /admin, /api, /auth, /entrar, /cadastro, /recuperar-senha, /redefinir-senha, /aceite-termos, /pedido, /rastreio; e qualquer URL com "_rsc" na query ou com cabeçalho de RSC (o teste passa mode; trate requisições sem mode "navigate" e caminho de página como network-only também).
  * Outra origem (Supabase, fontes externas, Mercado Pago): network-only.
  * /_next/static/ e /brand/ e /icons/ e arquivos .woff2: cache-first (são versionados ou estáveis).
  * /_next/image: stale-while-revalidate.
  * Navegação (mode "navigate") para as demais páginas: network-first-offline — tenta a rede; sem rede, entrega "/offline" do cache. NÃO guarde HTML de página no cache (pode ter conteúdo de sessão).
- fetch: aplica a política; erros de rede no cache-first/stale caem na rede ou na resposta guardada; nunca guarda resposta com status diferente de 200 ou do tipo "opaque".

2) app/offline/page.tsx — página estática (export const dynamic = "force-static"), metadata com robots noindex: logo E escura centralizada (img /brand/logo-e-escuro.svg, alt ""), título "Sem conexão", texto "Confira sua internet. Assim que voltar, é só tentar de novo.", botão "Tentar de novo" que é um <a href="/">, slogan "Buscou? Tá aqui." pequeno. Sem JavaScript de cliente.

3) tests/unit/sw-policy.test.ts — carregue public/sw.js com createRequire (import { createRequire } from "node:module"; const { policyFor } = createRequire(import.meta.url)("../../public/sw.js")) — o arquivo precisa poder ser lido no Node sem quebrar: proteja o uso de self/caches com `if (typeof self !== "undefined" && self.addEventListener)`. Teste cada regra: /checkout, /conta/pedidos/BA-000001, /admin, /api/frete, /carrinho, /rastreio/BA-000001?t=x, POST na home -> network-only; URL do Supabase -> network-only; /_next/static/chunks/a.js e /brand/logo.svg -> cache-first; /_next/image?url=... -> stale-while-revalidate; navegação para / e /p/fone -> network-first-offline; /p/fone?_rsc=abc -> network-only.

Entregue os 3 arquivos completos.
```

---

## G29 — Card "Instale no celular" e registro do service worker

```
[cole o bloco de contexto]

Tarefa: crie components/pwa/install-card.tsx e components/pwa/register-sw.tsx (os dois "use client").

1) register-sw.tsx: export function RegisterServiceWorker(): null — em useEffect, se "serviceWorker" in navigator e process.env.NODE_ENV === "production", registra "/sw.js" com { scope: "/" } depois do evento load (ou na hora, se a página já carregou). Erro de registro é ignorado em silêncio (sem console).

2) install-card.tsx: export function InstallCard({ className }: { className?: string })
- Estados: "instalado" (display-mode standalone via matchMedia("(display-mode: standalone)") ou navigator.standalone no iOS) -> não renderiza nada; "android" (recebeu o evento beforeinstallprompt: guarde-o com preventDefault) -> botão principal bg-lima text-noite "Instalar app" que chama prompt() e, se aceito ("accepted"), some; "ios" (iPhone/iPad Safari detectado pelo userAgent, sem standalone) -> passo a passo com ícones de traço: 1. Toque em Compartilhar (ícone de quadrado com seta para cima), 2. "Adicionar à Tela de Início", 3. "Adicionar"; "outro" (desktop ou navegador sem suporte) -> texto "Abra este site no celular para instalar." 
- Tipagem do evento sem any: interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }.
- Botão "Agora não" (texto, min-h 44px) esconde o card e guarda em localStorage "ba_instalar_dispensado" = data ISO; não mostrar de novo por 14 dias (localStorage dentro de try/catch).
- Visual: cartão bg-ultramar text-white, cantos 22px, título font-display "Coloque a Busca Agora na sua tela inicial", texto lavanda "Abre em tela cheia e seus pedidos ficam sempre à mão."; ícone da logo /brand/logo-e-branco.svg (img, alt "") 46px.
- Antes de montar no cliente (primeiro render), renderize null para não piscar conteúdo errado (useEffect define o estado).
- aria-live="polite" no container para anunciar a troca de estado.

Entregue os 2 arquivos completos.
```

---

## G30 — Aviso de cookies

```
[cole o bloco de contexto]

Tarefa: crie components/loja/cookie-notice.tsx e tests/unit/cookie-notice.test.ts.

Contexto: a loja só usa cookies necessários (login, carrinho, se já viu a abertura). Não há anúncios nem rastreio de terceiros, então não é um pedido de consentimento: é um aviso.

1) components/loja/cookie-notice.tsx ("use client"):
- export const COOKIE_NOTICE_NAME = "ba_cookies_ok";
- export function shouldShowNotice(cookieHeader: string): boolean — pura: true se o cookie ba_cookies_ok não estiver presente (parse simples de "a=1; b=2").
- export function CookieNotice(): mostra (só depois de montar no cliente, lendo document.cookie com shouldShowNotice) uma barra fixa no rodapé da tela (acima da barra inferior do app no celular: bottom-[calc(64px+env(safe-area-inset-bottom))] em telas < 768px; bottom-4 no desktop), cartão noite com texto lavanda: "Usamos só cookies necessários para o site funcionar (login, carrinho). Nada de anúncios." + link "Saiba mais" para /privacidade#cookies + botão "Entendi" (bg-lima text-noite, min-h 44px).
- "Entendi": grava document.cookie = `ba_cookies_ok=1; Max-Age=31536000; Path=/; SameSite=Lax` (Secure quando location.protocol for https:) e esconde.
- role="region" aria-label="Aviso de cookies"; o botão recebe foco? Não: não roube o foco; só garanta que vem na ordem de tabulação.
- Respeite prefers-reduced-motion (entrada com fade só se motion-safe).

2) tests/unit/cookie-notice.test.ts: shouldShowNotice com header vazio, sem o cookie, com o cookie entre outros, com nome parecido ("ba_cookies_ok_x=1" não conta).

Entregue os 2 arquivos completos.
```
