# Design, Parte 1 — divisão de trabalho e prompts para o ChatGPT (G41 a G43)

Base: `docs/design/auditoria-design.md` (auditoria do Codex, 11/10). Plano aprovado pelo Enzo em 11/10. Fotos dos produtos não mudam (são exemplos). Branch: `design-onda1`.

## Quem faz o quê

| Peça | Quem | Arquivos |
| --- | --- | --- |
| G41 Desenhos das categorias | ChatGPT | `components/loja/category-art.tsx` (novo) |
| G42 Estados vazios com o tom da marca | ChatGPT | `components/loja/empty-state.tsx`, páginas carrinho, pedidos, endereços |
| G43 Login, cadastro, senha, rastreio e 404 | ChatGPT | `components/conta/auth-card.tsx`, páginas entrar, cadastro, recuperar-senha, rastreio, not-found |
| Topo das categorias (usa G41) | Claude Code | `app/(loja)/c/[categoria]/page.tsx` |
| Busca: barra, filtros em uso, marcas com rolagem, busca vazia (usa G42) | Claude Code | `components/loja/catalog-results.tsx`, `app/(loja)/busca/page.tsx` |
| Carrinho no celular, abas da conta, foco e transições | Claude Code | `components/carrinho/*`, `components/conta/account-nav.tsx`, `app/globals.css` |
| Revisão e integração de tudo | Claude Code | — |

Mesmo esquema de sempre: uma conversa por prompt, **só os arquivos listados**, nada instalado, sem commit nem push. Os 3 são independentes.

Bloco de contexto (já incluído em cada prompt):

> Projeto: loja Busca Agora (Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4). Sem "any", sem console.log, sem biblioteca nova. Textos em português do Brasil; código e comentários em inglês. Importações com "@/". Server Components (sem "use client") salvo quando dito. Ícones: use os de "@/components/loja/icons" (SearchIcon, CartIcon, UserIcon, PinIcon, BoxIcon, HeadphonesIcon, BottleIcon, WatchIcon, DropIcon, TruckIcon, ShieldCheckIcon, ArrowRightIcon, ChipIcon; todos aceitam size e strokeWidth, traço estilo Lucide, aria-hidden). Nunca emoji. Cores do Tailwind: ultramar (#3324F5), ultramar-700, ultramar-50 (#ECEBFF), noite (#0A0F3D), lima (#C6FF3D), ciano (#7ADFFF), ciano-ink (#08708F), ciano-tile (#E6F8FF), rosa (#FF9AC8), rosa-ink (#B0306E), rosa-tile (#FFF0F7), fundo, borda, texto-2 (#4A4F70). Fontes: font-display (Sora; títulos, preços), font-sans (DM Sans). Escala de espaços 4/8/12/16/24/32/40/48. Botão principal: min-h 56px, raio 16px, bg-ultramar, texto branco font-display bold, hover bg-ultramar-700. Botão/link secundário: min-h 44px. Foco visível: outline 3px offset 2px ultramar (lima sobre fundo escuro). Contraste ≥ 4.5:1 (texto pequeno sobre ciano/rosa saturados: use noite). Pensado primeiro para 390 px. Animação só com motion-safe e só de opacidade/transform curtas; nada contínuo.

---

## G41 — Desenhos das categorias

```
[cole o bloco de contexto]

Tarefa: crie components/loja/category-art.tsx (Server Component), SVG inline puro, sem imagem externa.

export function CategoryArt({ categoria, variante = "placa", className }: { categoria: "eletronicos" | "cosmeticos"; variante?: "placa" | "mini"; className?: string })

- Ilustração de traço (stroke="currentColor" na cor noite, strokeWidth 2 a 2.5, strokeLinecap/linejoin round, fill="none"; pode ter 1 ou 2 formas preenchidas em lima #C6FF3D como destaque), aria-hidden="true", focusable="false".
- eletronicos: composição com um fone de cabeça e um relógio inteligente (e opcionalmente um raio de carregamento pequeno), sobre a placa ciano (#7ADFFF) com 2 círculos grandes decorativos em branco 25% de opacidade cortados pela borda (lembram os arcos da Home).
- cosmeticos: composição com um frasco conta-gotas e uma gota, mais um pote pequeno, sobre a placa rosa (#FF9AC8) com os mesmos círculos decorativos.
- variante "placa": viewBox 320x160, a placa é um rect com rx 24 ocupando tudo; o SVG escala com width 100% e height auto (classe vinda de className).
- variante "mini": viewBox 88x88, só o objeto principal (fone ou frasco) centralizado sobre um rect rx 20 na cor da categoria.
- Nada de texto dentro do SVG. Nada de animação.

Entregue o arquivo completo.
```

---

## G42 — Estados vazios com o tom da marca

```
[cole o bloco de contexto]

Arquivo atual components/loja/empty-state.tsx (reescreva-o mantendo os props atuais funcionando):
- props hoje: titulo, texto, acao?: { label, href }, icone?: "busca" | "caixa".
- Usado em: app/(loja)/carrinho/page.tsx, app/(conta)/conta/pedidos/page.tsx, app/(conta)/conta/enderecos/page.tsx, app/(loja)/page.tsx e components/loja/catalog-results.tsx (estes dois NÃO mude).

Tarefa 1 — components/loja/empty-state.tsx:
- icone passa a aceitar "busca" | "caixa" | "carrinho" | "pin" (SearchIcon, BoxIcon, CartIcon, PinIcon).
- novo prop tom?: "ultramar" | "ciano" | "rosa" (padrão "ultramar"): a placa do ícone é 72x72, raio 20, fundo ultramar-50/ciano-tile/rosa-tile e ícone ultramar/ciano-ink/rosa-ink, tamanho 36.
- novo prop links?: { label: string; href: string }[]: links secundários abaixo da ação principal, em linha (quebram no celular), min-h 44, texto 15 bold ultramar sublinhado no hover, gap 8 a 16.
- novo prop children?: ReactNode, renderizado entre o texto e a ação (para um formulário de busca).
- Layout: cartão branco borda borda, raio 22 (28 no desktop), padding 24 (40 no desktop), max-w 640 centralizado (mx-auto, w-full), conteúdo centralizado, gap 16. Título h2 font-display extrabold 24px (28px desktop) leading 1.15 noite. Texto 16px leading 1.5 texto-2 max-w 420. Ação principal no padrão do botão principal (min-h 56, raio 16).
- Entrada suave: motion-safe:animate-[page-in_200ms_ease-out] (keyframe page-in já existe no globals.css).

Tarefa 2 — só o texto e os props do EmptyState nestes 3 arquivos (não mude mais nada neles):
- carrinho: icone "carrinho", titulo "Seu próximo achado começa aqui.", texto "Seu carrinho está vazio. Que tal dar uma olhada nos eletrônicos e cosméticos?", acao { label: "Buscar produtos", href: "/busca" }, links [{ "Eletrônicos", "/c/eletronicos" }, { "Cosméticos", "/c/cosmeticos" }].
- pedidos: icone "caixa", titulo "Seu primeiro pedido vai aparecer aqui.", texto "Depois da compra, você acompanha cada etapa por aqui.", acao { "Buscar produtos", "/busca" }.
- endereços: icone "pin", tom "ciano", titulo "Onde seu pedido vai chegar?", texto "Cadastre um endereço para agilizar sua próxima compra." Mantenha a ação que a página já tem (se for um botão e não um link, passe-o como children e deixe acao vazio).

Entregue os 4 arquivos completos.
```

---

## G43 — Login, cadastro, senha, rastreio e 404

```
[cole o bloco de contexto]

Tarefa 1 — components/conta/auth-card.tsx: acrescente o prop icone?: "conta" | "novo" | "chave" | "termos". Quando houver, mostre antes do título uma placa 48x48 raio 14 bg-ultramar-50 com o ícone 24 ultramar (conta: UserIcon; novo: UserIcon; chave: um ícone de chave de traço que você desenha no próprio arquivo no mesmo estilo Lucide 24x24; termos: ShieldCheckIcon), gap 16 até o título. Não mude o resto do cartão (max-w 480, padding, raio, tamanhos de título).

Tarefa 2 — só os props do <AuthCard> nestas páginas:
- app/(conta)/entrar/page.tsx: icone "conta"; subtítulo "Seus pedidos e endereços, tudo por aqui." (se a página já troca o subtítulo quando vem do carrinho, mantenha essa lógica e use "Entre para continuar sua compra." nesse caso).
- app/(conta)/cadastro/page.tsx: icone "novo"; titulo "Crie sua conta"; subtitulo "Leva menos de um minuto e seus pedidos ficam sempre à mão."
- app/(conta)/recuperar-senha/page.tsx: icone "chave" (mantenha título e textos atuais).

Tarefa 3 — app/(loja)/rastreio/page.tsx: hoje há um h1 solto e o formulário dentro de um cartão. Troque por UMA superfície branca (borda borda, raio 22, 28 no desktop, padding 24, 32 no desktop, max-w 520 centralizada) contendo: placa 48x48 raio 14 bg-ciano-tile com TruckIcon 24 ciano-ink; h1 "Seu pedido, passo a passo." font-display extrabold 28px (34 desktop) tracking -0.02em; parágrafo "Informe o número do pedido e o e-mail usado na compra." 16px texto-2; e o <TrackingForm action={trackOrder} /> como já está. Mantenha metadata e imports.

Tarefa 4 — app/(loja)/not-found.tsx: só o placeholder do campo de busca vira "Buscar outro produto" (curto, cabe em 390 px). Nada mais.

Entregue os 6 arquivos completos.
```
