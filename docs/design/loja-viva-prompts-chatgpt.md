# Loja viva — movimento e personalidade, prompts para o ChatGPT (G47 a G49)

Pedido do Enzo (11/10): "mais personalidade e movimento, que não pareça uma imagem travada". Aprovado: pode mexer na Home e no produto, movimento médio. Tudo em CSS ou JavaScript mínimo, sem biblioteca. Branch: `loja-viva`. Mesmo esquema: uma conversa por prompt, **só os arquivos listados**, nada instalado, sem commit nem push.

| Peça | Quem | Arquivos |
| --- | --- | --- |
| G47 Faixa correndo | ChatGPT | `components/loja/marquee.tsx` (novo) |
| G48 Palavra do slogan trocando | ChatGPT | `components/loja/rotating-word.tsx` (novo) |
| G49 Texto de exemplo da busca se digitando | ChatGPT | `components/loja/use-typing-placeholder.ts` (novo) |
| Aparecer ao rolar, cards, botões, carrinho, desenhos flutuando, integração | Claude Code | `app/globals.css`, Home, cards, header, etc. |

Regras de movimento para os três (repita no prompt): animação só de `transform` e `opacity`; nada pisca; com `prefers-reduced-motion: reduce` tudo fica parado e legível; nada de `setInterval` rodando com a aba escondida (pause em `document.visibilityState !== "visible"`); sem biblioteca.

Bloco de contexto: use o de `docs/design/onda1-prompts-chatgpt.md`.

---

## G47 — Faixa correndo

```
[cole o bloco de contexto + as regras de movimento]

Crie components/loja/marquee.tsx (Server Component, só CSS).

export function Marquee({ itens, className }: { itens: string[]; className?: string })

- Faixa de largura total, bg-lima, text-noite, font-display bold 15px (17 desktop), altura 48 (56 desktop), overflow-hidden, cantos 0 (a página decide).
- Os itens em linha separados por um pequeno losango ou estrela de 4 pontas em SVG noite (10px, aria-hidden). Conteúdo duplicado para o loop ficar contínuo: a lista original é a única lida por leitor de tela; a cópia tem aria-hidden="true".
- Animação: translateX de 0 a -50% em 28s linear infinite (keyframe no próprio arquivo via <style> com nome único "ba-marquee"). Pausa quando o mouse está em cima (hover) ou algum link dentro tem foco.
- @media (prefers-reduced-motion: reduce): sem animação; mostra os itens uma vez, com quebra de linha permitida e centralizados.
- Role: <section aria-label="Vantagens da loja"> com <ul> dos itens.

Entregue o arquivo completo.
```

---

## G48 — Palavra do slogan trocando

```
[cole o bloco de contexto + as regras de movimento]

Crie components/loja/rotating-word.tsx ("use client").

export function RotatingWord({ palavras, intervaloMs = 2200, className }: { palavras: string[]; intervaloMs?: number; className?: string })

- Renderiza no servidor e na hidratação a PRIMEIRA palavra (mesmo HTML, sem pular). É usada dentro de um h1 grande ("Buscou fone? Tá aqui."), então não pode mudar a altura da linha.
- A cada intervaloMs troca para a próxima palavra: a palavra atual sobe e some (translateY -60% + opacity 0, 220ms) e a nova entra de baixo (translateY 60% → 0, opacity 0 → 1, 260ms, cubic-bezier(.2,.8,.2,1)). Atrás da palavra, um "marca-texto" lima: um span absoluto (inset-x -4px, altura 38% da linha, bottom 6%, bg-lima, raio 6, z abaixo do texto) que cresce com scaleX 0 → 1 a partir da esquerda (origin-left, 320ms) a cada palavra nova. O texto da palavra fica text-white (o marca-texto é só uma faixa baixa, o contraste do texto vem do fundo noite).
- A largura acompanha a palavra sem pulo brusco: o contêiner é inline-grid; todas as palavras ficam empilhadas na mesma célula (grid-area 1/1) para a largura ser a da mais longa (text-left), só a atual visível.
- Acessibilidade: o componente inteiro tem aria-hidden="true" (o h1 que o usa terá aria-label fixo). Sem aria-live.
- Pausa quando a aba não está visível (visibilitychange) e não roda com prefers-reduced-motion: reduce (mostra só a primeira palavra, sem marca-texto animado; marca-texto já cheio).
- Limpe timers no unmount. Sem setState em efeito síncrono que o lint do React 19 reprove: use useSyncExternalStore para o prefers-reduced-motion e um setTimeout encadeado (não setInterval) para a troca.

Entregue o arquivo completo.
```

---

## G49 — Texto de exemplo da busca se digitando

```
[cole o bloco de contexto + as regras de movimento]

Crie components/loja/use-typing-placeholder.ts ("use client" no topo, é um hook).

export function useTypingPlaceholder(base: string, exemplos: string[], ativo: boolean): string

- Retorna o texto de placeholder a mostrar. Começa (servidor e hidratação) devolvendo exatamente `base` (ex.: "O que você está buscando?"), para não mudar o HTML.
- 1,5 s depois de montar, se `ativo` (o campo está vazio e sem foco) e sem prefers-reduced-motion e com a aba visível: passa a "digitar" "Busque " + exemplo, uma letra a cada 55 ms; espera 1,6 s com a frase completa; "apaga" uma letra a cada 30 ms; vai para o próximo exemplo; em loop. Ex.: exemplos ["fones", "sérum", "smartwatch", "batom", "carregador"].
- Quando `ativo` vira false (foco ou texto digitado), para na hora e volta para `base`. Volta a animar 1,5 s depois de ficar ativo de novo.
- Pausa com a aba escondida. Um único setTimeout encadeado por vez; limpe no unmount.
- Sem setState síncrono em efeito (lint do React 19): agende o primeiro passo com setTimeout. Use useSyncExternalStore para prefers-reduced-motion.
- Crie também tests/unit/typing-placeholder.test.ts testando uma função pura exportada `typingFrames(exemplo: string, prefixo = "Busque "): string[]` que devolve a sequência de textos de digitar e apagar (sem tempos), ex.: para "ab": ["Busque a", "Busque ab", "Busque a", "Busque "]. O hook usa essa função.

Entregue os 2 arquivos completos.
```
