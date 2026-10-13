# Página de produto com a cara da categoria — divisão e prompts (Codex C1, ChatGPT G50)

Pedido do Enzo (12/10): a página do produto precisa de personalidade, e Eletrônicos e Cosméticos devem ter cara diferente. Mexe numa tela com design aprovado (`docs/design/Produto.dc.html`); o pedido do Enzo vale como aprovação, mas preço, botões, variações, quantidade, frete e ficha técnica continuam no mesmo lugar e funcionando igual. Branch: `produto-vivo`.

| Peça | Quem | Arquivos |
| --- | --- | --- |
| C1 Palco da foto por categoria (fundo, decoração animada, miniaturas) | **Codex** | `components/loja/product-stage.tsx` (novo), `components/loja/product-gallery.tsx` |
| G50 Faixa de vantagens por categoria | ChatGPT | `components/loja/product-perks.tsx` (novo) |
| Topo com a cor da categoria, preço de oferta, seções e relacionados, integração | Claude Code | `app/(loja)/p/[produto]/page.tsx`, `components/loja/product-buy-box.tsx` |
| Revisão final | Codex (outra conversa) | — |

Regras para os dois: só os arquivos listados; nada instalado; sem commit nem push; TypeScript strict, sem `any`; textos em português do Brasil, código em inglês; cores só dos tokens (`ultramar`, `noite`, `lima`, `ciano`, `ciano-ink`, `ciano-tile`, `rosa`, `rosa-ink`, `rosa-tile`, `fundo`, `borda`, `texto-2`, `oferta`); ícones de traço estilo Lucide (há vários em `components/loja/icons.tsx`), nunca emoji; animação só de `transform`/`opacity`, sempre com `motion-safe` ou dentro de `@media (prefers-reduced-motion: no-preference)`; contraste mínimo 4,5:1 para qualquer texto; alvos de toque ≥ 44 px; primeiro 390 px, bonito em 1440 px. NÃO inventar características do produto (bateria, ingredientes, garantia de fábrica): só use dados que já existem.

---

## C1 — Palco da foto (Codex)

```
Projeto: loja Busca Agora (Next.js 16, React 19, Tailwind v4), pasta atual. Leia CLAUDE.md e as regras do topo de docs/design/produto-prompts.md.

Tarefa: dar à galeria da página de produto um "palco" com a cara da categoria.

1) Crie components/loja/product-stage.tsx (Server Component, SVG/CSS puro):
   export function ProductStage({ categoria }: { categoria: "eletronicos" | "cosmeticos" })
   - Camada decorativa absoluta (aria-hidden, pointer-events-none) para ficar ATRÁS da foto principal da galeria.
   - eletronicos: fundo ciano-tile com uma grade fina de pontos/trilhas de circuito em ciano-ink a 15–20% de opacidade, 2 ou 3 "pulsos" de luz percorrendo trilhas (stroke-dashoffset), um anel ciano grande cortado no canto.
   - cosmeticos: fundo rosa-tile com bolhas/gotas suaves (círculos rosa a 25–40%) subindo devagar e 2 ou 3 brilhos de 4 pontas piscando.
   - Tudo parado com prefers-reduced-motion. Keyframes no próprio arquivo via <style> com prefixo ba-stage-.
2) Em components/loja/product-gallery.tsx:
   - Quando houver foto, use o ProductStage atrás da imagem principal (hoje o fundo é bg-white) e deixe a foto com uma sombra suave e um leve zoom ao passar o mouse (motion-safe, só desktop).
   - Miniatura ativa com borda na cor da categoria (ciano-ink / rosa-ink, 2,5 px) em vez de ultramar; miniaturas com cantos 16 e fundo do tile da categoria.
   - Não mude a lógica (troca de foto, teclado, alt, preload, tamanhos). Mantenha aspect-square e max-h-[560px] da foto principal.
3) Rode npm run lint, npm run typecheck e npx playwright test tests/e2e/vitrine.spec.ts (a pasta já tem banco local com produtos de teste). Tire capturas de um produto de cada categoria em 390 e 1440 px em output/produto-c1/.

Entregue os 2 arquivos e um relatório curto do que fez e do que conferiu. Não mexa em nenhum outro arquivo.
```

---

## G50 — Faixa de vantagens por categoria (ChatGPT)

```
[Contexto: loja Busca Agora, Next.js 16 + Tailwind v4, TypeScript strict. Regras do topo de docs/design/produto-prompts.md.]

Crie components/loja/product-perks.tsx (Server Component):

export function ProductPerks({ categoria }: { categoria: "eletronicos" | "cosmeticos" })

- Lista (<ul>, aria-label "Vantagens desta compra") de 4 itens em grade 2x2 no celular e 4 colunas no desktop. Cada item: placa 44x44 raio 14 com ícone 22 de traço; título 15px bold noite; texto 13px texto-2.
- Itens iguais para as duas categorias (são da loja, não do produto): "Nota fiscal" / "Em todo pedido"; "Despacho em 24 h" / "Depois do pagamento"; "Troca em 7 dias" / "Direito de arrependimento"; "Pix na hora" / "Aprovação imediata".
- O que muda por categoria é o visual: eletronicos usa placas ciano-tile com ícone ciano-ink e um contorno ciano 1,5 px nos cartões; cosmeticos usa rosa-tile, ícone rosa-ink e contorno rosa. Cartões brancos raio 18, padding 14.
- Ícones de "@/components/loja/icons": ReceiptIcon, TruckIcon, ExchangeIcon, PixIcon.
- Entrada suave: cada item com motion-safe:animate-[ba-reveal_420ms_cubic-bezier(.2,.8,.2,1)_both] e animationDelay 80 ms entre eles (o keyframe ba-reveal já existe em app/globals.css).

Entregue o arquivo completo.
```

---

## C2 — Carrinho com personalidade (Codex)

Pedido do Enzo (13/10). Branch: `carrinho-vivo`. `lib/cart/server.ts` já entrega `precoDeCents` por linha e `economiaCents` no carrinho (só exibição; o servidor recalcula no checkout).

```
Projeto: loja Busca Agora, pasta atual. Leia CLAUDE.md e as regras do topo de docs/design/produto-prompts.md (mesmas regras do C1). Mostre o plano e espere aprovação antes de codar (CLAUDE.md 2.12).

Tarefa: deixar o carrinho com a mesma qualidade visual das páginas novas (Home, categorias, Ofertas, produto), sem mudar nenhum comportamento (quantidade, remover, frete, total, botão de continuar, mensagens de erro e estoque, acessibilidade).

Arquivos permitidos: components/carrinho/cart-line.tsx, components/carrinho/cart-summary.tsx e um novo components/carrinho/checkout-steps.tsx. Nenhum outro.

1) checkout-steps.tsx (Server Component): "Carrinho → Entrega → Pagamento", etapa atual = Carrinho (aria-current="step"), as outras apagadas; bolinhas numeradas ligadas por linha; atual em ultramar com lima, cabe em 320 px.
2) cart-line.tsx:
   - Foto sobre a placa da categoria (ciano-tile / rosa-tile) com um detalhe da categoria (fina borda ciano/rosa), cantos 16.
   - Se item.precoDeCents > item.precoCents: preço anterior riscado e selo "-N%" em bg-oferta texto branco (percentual inteiro arredondado para baixo).
   - Total da linha com uma pequena animação quando a quantidade muda (motion-safe, só transform/opacity).
   - Mantenha a estrutura de celular (quantidade à esquerda, total à direita) e desktop.
3) cart-summary.tsx:
   - Faixa fina ultramar no topo do cartão e um anel decorativo no canto (atrás, aria-hidden, sem passar atrás de texto).
   - Nova prop opcional economiaCents: quando > 0, linha "Você economiza" em text-oferta.
   - Mini lista de garantias da loja abaixo do total (Nota fiscal em todo pedido, Despacho em até 24 h, Troca em até 7 dias) com ícones de traço de "@/components/loja/icons".
   - Mantenha as props existentes e os textos de total/frete.
4) Rode npm run lint, npm run typecheck e npx playwright test tests/e2e/carrinho.spec.ts. Capturas do carrinho com item em 390 e 1440 px em output/carrinho-c2/.

Entregue um relatório curto. Sem commit nem push. O Claude Code integra o CheckoutSteps e a prop economiaCents na página.
```
