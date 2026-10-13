# Login e carrinho com a cara da loja — divisão e prompts (Codex C3, ChatGPT G51)

Pedido do Enzo (13/10): refazer as telas de login com fundo animado (linhas e ondas passando, a lupa, a identidade da loja e as coisas que ela vende), Google em destaque, e melhorar mais o carrinho. Referência que ele mandou: um login "gamer" com cartão escuro de vidro sobre vídeo; usamos só a ideia (cartão sobre fundo vivo), não as cores roxas, o vídeo, os emojis nem os botões falsos de redes. Branch: `login-carrinho-vivo`.

| Peça | Quem | Arquivos |
| --- | --- | --- |
| C3 Fundo animado das telas de conta | **Codex** | `components/conta/auth-backdrop.tsx` (novo) |
| G51 Carrinho vazio com a lupa | ChatGPT | `components/carrinho/empty-cart.tsx` (novo) |
| Cartão, páginas de login, barra fixa do carrinho, saída da linha removida, integração | Claude Code | `components/conta/auth-card.tsx`, `app/(conta)/*`, `app/(loja)/carrinho/page.tsx`, `components/carrinho/*` |
| Revisão final | Codex (outra conversa) | — |

Regras para os dois: só os arquivos listados; nada instalado (nada de lucide-react, framer-motion nem vídeo); sem commit nem push; TypeScript strict, sem `any`; textos em português do Brasil, código em inglês; cores só dos tokens (`ultramar`, `ultramar-700`, `noite`, `lima`, `ciano`, `ciano-ink`, `ciano-tile`, `rosa`, `rosa-ink`, `rosa-tile`, `fundo`, `borda`, `texto-2`, `lavanda`, `oferta`); ícones de traço estilo Lucide (há vários em `components/loja/icons.tsx`), nunca emoji; animação só de `transform`/`opacity`/`stroke-dashoffset`, sempre dentro de `@media (prefers-reduced-motion: no-preference)` ou com `motion-safe:`; contraste mínimo 4,5:1 para qualquer texto; alvos de toque ≥ 44 px; primeiro 390 px, bonito em 1440 px; leve (SVG/CSS, sem imagem nova, sem JavaScript no cliente).

---

## C3 — Fundo animado das telas de conta (Codex)

```
Projeto: loja Busca Agora (Next.js 16, React 19, Tailwind v4), pasta atual, branch login-carrinho-vivo. Leia CLAUDE.md e as regras do topo de docs/design/login-prompts.md.

Tarefa: criar components/conta/auth-backdrop.tsx, o fundo vivo das telas /entrar, /cadastro, /recuperar-senha e /redefinir-senha.

export function AuthBackdrop(): Server Component, SVG/CSS puro, sem "use client".
- Camada absoluta que cobre o pai (absolute inset-0, -z-10, overflow-hidden, aria-hidden, pointer-events-none). O pai é relative isolate e tem fundo noite (#0A0F3D); o cartão branco do login fica por cima, no centro (celular) ou à direita (desktop, coluna de ~480 px). A coluna esquerda do desktop terá um título branco grande e o slogan: nada claro pode passar atrás de texto branco (use só traços finos com opacidade ≤ 35% nessa área, ou mantenha a decoração clara longe dela; o Claude confere o contraste com teste).
- Elementos:
  1) 3 ou 4 ondas largas (path senoidal na largura toda) em ultramar, ciano e rosa, traço 2–3 px, opacidade 25–45%, deslizando horizontalmente em loop contínuo e sem emenda visível (path com 2 períodos e translateX de um período), velocidades diferentes (18–40 s).
  2) 4 a 6 linhas retas finas em diagonal (lavanda a ~20%) com um "pulso" de luz correndo por elas (stroke-dasharray + stroke-dashoffset), defasados.
  3) A lupa da loja (anel lima grosso + cabo branco, como em components/loja/searched-header.tsx) grande, varrendo devagar a tela (translate em 20–30 s, ida e volta suave), com um brilho branco a 10% na lente.
  4) Ícones de traço do que a loja vende flutuando (ba-float já existe em app/globals.css): fone, sérum/frasco, batom, cabo/plug, etiqueta de preço, caminhão. Brancos ou lavanda a 30–50%, tamanhos variados, espalhados nas bordas para não ficarem sob o cartão.
  5) O "e" da marca (public/brand/logo-e-branco.svg) bem grande e quase transparente (opacidade 6–8%) num canto, parado. Pode usar <img> simples com alt="".
- Keyframes no próprio arquivo via <style> com prefixo ba-auth-, todos dentro de @media (prefers-reduced-motion: no-preference). Com reduced-motion tudo fica parado e bonito.
- Responsivo: no celular (390 px) menos elementos visíveis (esconda parte com classes hidden md:block) para não pesar; no desktop preencher a tela toda até 2560 px.
- Leve: no máximo ~6 KB de SVG, nenhuma imagem nova além do logo existente.

Para testar enquanto o Claude integra, monte provisoriamente numa página de rascunho só sua (não commitada) ou cole dentro de um div relative min-h-screen bg-noite. Rode npm run lint e npm run typecheck. Tire capturas em 390 e 1440 px em output/login-c3/.

Mostre o plano e espere aprovação antes de codar (CLAUDE.md 2.12). Entregue o arquivo e um relatório curto. Não mexa em nenhum outro arquivo.
```

---

## G51 — Carrinho vazio com a lupa (ChatGPT)

```
[Contexto: loja Busca Agora, Next.js 16 + Tailwind v4, TypeScript strict. Regras do topo de docs/design/login-prompts.md. Hoje o carrinho vazio usa o EmptyState genérico de components/loja/empty-state.tsx.]

Crie components/carrinho/empty-cart.tsx (Server Component):

export function EmptyCart()

- Cartão branco raio 22 (md: 28), borda borda, padding 24 (md: 40), centralizado, max-w 640.
- Arte no topo (SVG inline, aria-hidden, ~200x140): uma sacola/carrinho de traço ultramar vazio, com a lupa da loja (anel lima grosso #C6FF3D + cabo noite) passando por cima em vaivém (classe ba-scan, já existe em app/globals.css) e 3 pontinhos ciano/rosa/lima flutuando (classe ba-float).
- Título h1 "Seu carrinho está vazio" em Sora 800, 26 px (md: 32), cor noite.
- Texto 15 px texto-2: "Buscou? Tá aqui. Comece pelos mais procurados da loja."
- 3 atalhos (links <a> do next/link, min-h 52, raio 16, borda 1.5 px, ícone 22 + texto bold 15), em coluna no celular e em linha no desktop:
  - "Eletrônicos" -> /c/eletronicos, placa bg-ciano-tile, ícone HeadphonesIcon text-ciano-ink, borda ciano.
  - "Cosméticos" -> /c/cosmeticos, placa bg-rosa-tile, ícone BottleIcon text-rosa-ink, borda rosa.
  - "Ofertas" -> /busca?filtro=ofertas, placa com bg-oferta e ícone ZapIcon branco, borda oferta.
  Ícones de "@/components/loja/icons" (aceitam size e className).
- Hover: leve subida (motion-safe:hover:-translate-y-0.5) e borda ultramar.
- Entrada: classe ba-entra nos blocos com animationDelay 0/80/160 ms (já existe em app/globals.css).

Entregue o arquivo completo.
```
