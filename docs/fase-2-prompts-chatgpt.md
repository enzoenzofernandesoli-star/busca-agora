# Fase 2 — prompts para o ChatGPT

Cole um prompt por vez numa conversa nova do ChatGPT (GPT-6 Sol). Anexe o que o prompt pedir.
Devolva para o Claude Code a resposta inteira (o código). Ele revisa, ajusta e testa antes de entrar no projeto.

Todos os prompts começam com o mesmo bloco de contexto (já está incluído em cada um).

---

## G1 — Abertura animada (splash)

Anexe: `docs/design/Main.dc.html` e `docs/design/Celular-Abertura.dc.html`.

```
Contexto do projeto: loja virtual Busca Agora. Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4. Sem "any", sem console.log, sem bibliotecas novas. Textos da interface em português do Brasil; nomes de código e comentários em inglês. Ícones: SVG de traço (estilo Lucide), nunca emoji.
Tokens de cor já existem no Tailwind como classes: ultramar (#3324F5), noite (#0A0F3D), lima (#C6FF3D), lima-300 (#D4FF6A), ciano (#7ADFFF), rosa (#FF9AC8), lavanda (#DCDFFF), lavanda-500 (#B9BDE8). Fontes: classe font-display = Sora, font-sans = DM Sans (já carregadas).

Tarefa: escreva o arquivo components/loja/splash.tsx, um Client Component ("use client") chamado Splash.

Comportamento:
- Props: { variant: "desktop" | "mobile" } não é necessário; o mesmo componente mostra a versão de computador (≥768px) e a de celular (<768px) com classes responsivas do Tailwind (md:).
- Ocupa a tela inteira por cima de tudo (position fixed, inset 0, z-index 100), fundo ultramar, texto branco.
- Duração total no MÁXIMO 1,5 s. Reproduza a sequência dos arquivos anexados (anéis, logo subindo, slogan, subtítulo, barra lima crescendo, 3 tags coloridas no desktop), mas com os tempos comprimidos para caber em 1,5 s. Ao fim de 1,5 s o splash some com fade de 200 ms (dentro dos 1,5 s) e é desmontado.
- Botão "Pular" visível desde o início (mesmo visual do botão "Entrar na loja" do design: lima, texto noite, Sora 700, ícone de seta). Clicar fecha na hora. Tecla Esc também fecha.
- Ao montar, grava o cookie "ba_visto=1; path=/; max-age=31536000; samesite=lax".
- prefers-reduced-motion: reduce → nenhuma animação; o splash não aparece (desmonta imediatamente, mas grava o cookie mesmo assim).
- Acessibilidade: role="dialog", aria-modal="true", aria-label="Abertura da Busca Agora"; o foco vai para o botão "Pular" ao abrir; ao fechar, o foco volta para o <body>. Bloqueia o scroll do body enquanto aberto e devolve ao fechar.
- Logos com next/image e unoptimized (são SVG em /public): desktop `<Image src="/brand/logo-d-branco.svg" alt="Busca Agora" width={600} height={95} unoptimized priority />` com largura min(600px, 86vw) e height auto; celular `<Image src="/brand/logo-e-branco.svg" alt="Busca Agora" width={240} height={240} unoptimized priority />` com largura 240px e height auto. Mostre uma ou outra com hidden/md:block.
- Animações em CSS: use @keyframes num bloco <style> dentro do componente OU classes arbitrárias do Tailwind v4 (animate-[...]). Anime só transform e opacity.
- Textos exatos: "Buscou? Tá aqui." ("Tá aqui." em lima), "Eletrônicos e cosméticos, do clique até a sua porta.", rodapé desktop "BUSCAAGORA.COM.BR".

Entregue só o código do arquivo, completo, sem explicação longa.
```

---

## G2 — Estado vazio e skeleton dos cards

Anexe: `docs/design/Home.dc.html`.

```
Contexto do projeto: loja virtual Busca Agora. Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4. Sem "any", sem console.log, sem bibliotecas novas. Textos da interface em português do Brasil; nomes de código e comentários em inglês. Ícones: SVG de traço (estilo Lucide), nunca emoji.
Tokens de cor (classes do Tailwind): ultramar, ultramar-50 (#ECEBFF), noite, lima, ciano-tile (#E6F8FF), rosa-tile (#FFF0F7), fundo (#F4F5FA), borda (#E3E5F2), texto-2 (#4A4F70). Fontes: font-display (Sora), font-sans (DM Sans).

Tarefa: escreva 2 arquivos (Server Components, sem "use client").

1) components/loja/empty-state.tsx — export function EmptyState
Props: { titulo: string; texto: string; acao?: { label: string; href: string }; icone?: "busca" | "caixa" }
- Card branco, borda 1px borda, cantos 28px (md) / 22px (celular), padding 48px (md) / 28px, conteúdo centralizado.
- Ícone dentro de um quadrado 64px, cantos 18px, fundo ultramar-50, cor ultramar. "busca" = lupa (círculo r 6.5 em 10.5,10.5 + linha 15.5,15.5→21,21). "caixa" = caixa de papelão em traço.
- Título Sora 800, 24px (md 28px), cor noite. Texto DM Sans 16px, texto-2, max 420px.
- Ação: link com next/link, visual de botão principal: fundo ultramar, texto branco, Sora 700 16px, altura mínima 52px, padding 0 28px, cantos 14px, hover bg-ultramar-700.

2) components/loja/product-card-skeleton.tsx — export function ProductCardSkeleton e export function ProductGridSkeleton({ count = 5 })
- Mesmas medidas do card de produto do design: card branco, borda 1px borda, cantos 18px (celular) / 22px (md); área da foto 150px (celular) / 210px (md); depois 3 barras (categoria, nome em 2 linhas, preço) com padding 12px (celular) / 16px 18px 20px (md).
- Barras em bg-fundo com animação de pulso só em opacity (animate-pulse do Tailwind) e desligada com motion-reduce:animate-none.
- ProductGridSkeleton: grid de 2 colunas no celular (gap 12px) e grid-cols-[repeat(auto-fill,minmax(210px,1fr))] no md (gap 20px). aria-busy="true" e um texto sr-only "Carregando produtos".

Entregue só o código dos 2 arquivos, completos.
```

---

## G3 — Galeria de fotos do produto

Anexe: `docs/design/Produto.dc.html`.

```
Contexto do projeto: loja virtual Busca Agora. Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4. Sem "any", sem console.log, sem bibliotecas novas. Textos da interface em português do Brasil; nomes de código e comentários em inglês. Ícones: SVG de traço (estilo Lucide), nunca emoji.
Tokens (classes do Tailwind): ultramar, noite, borda (#E3E5F2), ciano-tile, ciano-ink, rosa-tile, rosa-ink. Fontes: font-display (Sora), font-sans (DM Sans).

Tarefa: escreva components/loja/product-gallery.tsx, Client Component ("use client"), export function ProductGallery.

Props:
type GalleryImage = { url: string; alt: string };
{ images: GalleryImage[]; nome: string; categoria: "eletronicos" | "cosmeticos" }

Visual (copie do design anexado, bloco da galeria):
- Container branco, borda 1px borda, cantos 28px, padding 24px, gap 16px. No celular (<768px): foto principal em cima e miniaturas numa linha rolável embaixo; no md: miniaturas em coluna à esquerda.
- Miniaturas 76x76, cantos 16px; a selecionada com borda 2.5px ultramar, as outras 1.5px transparente. São <button type="button"> com aria-label "Ver foto N de M" e aria-pressed.
- Foto principal: quadrada (aspect-square), max-height 560px, cantos 22px, fundo branco.
- Imagens com next/image: principal com fill, sizes="(min-width: 768px) 560px, 100vw", object-contain, priority na primeira; miniaturas com width/height 76.
- Teclado: setas esquerda/direita trocam a foto quando o foco está nas miniaturas.
- Sem imagens (images vazio): mostra placeholder com fundo ciano-tile/ciano-ink (eletrônicos) ou rosa-tile/rosa-ink (cosméticos) e um ícone de traço 96px (chip para eletrônicos, gota para cosméticos), mais o texto "Foto em breve".
- Se só houver 1 imagem, não mostra miniaturas.

Entregue só o código do arquivo, completo.
```

---

## G4 — JSON-LD de produto (SEO)

Sem anexo.

```
Contexto do projeto: loja virtual Busca Agora. TypeScript strict, sem "any", sem bibliotecas novas. Nomes de código e comentários em inglês. Testes com Vitest 4.

Regra de dinheiro: todo valor é inteiro em centavos (8990 = R$ 89,90). Nunca use float para somar; só converta para string no final.

Tarefa: escreva lib/seo/json-ld.ts e tests/unit/json-ld.test.ts.

lib/seo/json-ld.ts exporta funções PURAS (sem React, sem Next):

1) productJsonLd(input) — retorna um objeto schema.org Product:
type ProductJsonLdInput = {
  siteUrl: string;            // ex.: "https://buscaagora.com.br" (sem barra no fim)
  slug: string;               // URL do produto = `${siteUrl}/p/${slug}`
  nome: string;
  descricao: string;
  imagens: string[];          // URLs absolutas
  marca?: string;
  sku: string;
  precoCents: number;         // menor preço entre as variantes
  precoMaxCents?: number;     // maior preço; se maior que precoCents use AggregateOffer
  emEstoque: boolean;
  categoria: string;          // "Eletrônicos" | "Cosméticos"
};
- "@context": "https://schema.org", "@type": "Product", name, description, image, sku, category, brand ({"@type":"Brand", name}) só se marca existir.
- offers: Offer com price em string com 2 casas e ponto ("89.90"), priceCurrency "BRL", availability "https://schema.org/InStock" ou ".../OutOfStock", url, seller {"@type":"Organization","name":"Busca Agora"}. Com faixa de preço: AggregateOffer com lowPrice/highPrice.
- Converta centavos para string sem float: Math.trunc(c/100) e c%100 com padStart(2,"0"). Lance TypeError se não for inteiro seguro >= 0.

2) breadcrumbJsonLd(siteUrl, itens: { nome: string; path: string }[]) — BreadcrumbList com position 1..n e item = siteUrl + path.

3) jsonLdScript(data) — retorna a string JSON pronta para <script type="application/ld+json">, escapando "<" como "<" (evita fechar a tag script).

tests/unit/json-ld.test.ts (import { describe, expect, it } from "vitest"; caminho "@/lib/seo/json-ld"):
- 8990 vira "89.90", 5 vira "0.05", 100000 vira "1000.00".
- AggregateOffer quando precoMaxCents > precoCents.
- OutOfStock quando emEstoque = false.
- sem marca → sem campo brand.
- float (89.9) lança TypeError.
- jsonLdScript escapa "</script>".
- breadcrumb com positions corretas.

Entregue só o código dos 2 arquivos, completos.
```

---

## G5 — Seed de desenvolvimento (6 produtos de exemplo)

Sem anexo.

```
Contexto do projeto: loja virtual Busca Agora. TypeScript strict, sem "any", sem bibliotecas novas (já existe @supabase/supabase-js v2). Roda com Node 24 direto em .ts (node scripts/seed-dev.ts, type stripping nativo: então NÃO use enum, namespace nem parameter properties; use import type para tipos). Nomes de código em inglês; dados de exemplo em português.

Banco (Postgres/Supabase), tabelas relevantes:
- categories(id uuid, slug text unique) — já existem 'eletronicos' e 'cosmeticos'.
- brands(id uuid, nome text, slug text unique)
- products(id uuid, nome, slug unique, descricao, category_id, brand_id, ncm text 8 dígitos, cfop text default '5102', origem smallint default 0, ativo boolean, destaque boolean)
- product_variants(id, product_id, sku unique, nome, preco_cents int, preco_de_cents int null, custo_cents int, estoque int, peso_g int > 0, altura_cm, largura_cm, comprimento_cm numeric > 0, ean text null)
- product_images(product_id, url, ordem, alt) — NÃO crie imagens (a loja mostra placeholder).
Dinheiro em centavos inteiros.

Tarefa: escreva scripts/seed-dev.ts.

Segurança (obrigatório):
- Lê URL e service role key do Supabase LOCAL rodando: execute `npx supabase status -o json` com execSync (node:child_process), faça JSON.parse a partir do primeiro "{", use API_URL e SERVICE_ROLE_KEY.
- Se o hostname da URL não for 127.0.0.1 nem localhost: lance erro "seed-dev só roda no Supabase local" e saia com código 1. Nunca leia .env nem variáveis de ambiente para a URL.
- Nunca imprima a chave.

Dados: 6 produtos, todos ativo = true; 4 com destaque = true (3 eletrônicos + 1 cosmético):
Eletrônicos (marca de exemplo "Sonora" e "Pulso"):
1. Fone Bluetooth com microfone e cancelamento de ruído — 3 variantes de cor (Preto, Branco, Azul), 8990 cada, preco_de 11990, estoque 15/8/0.
2. Smartwatch com monitor de batimentos — 1 variante, 12990, estoque 10.
3. Caixa de som portátil à prova d'água — 1 variante, 14990, estoque 4.
4. Carregador turbo USB-C 20W — 1 variante, 5990, estoque 30, sem destaque.
Cosméticos (marca de exemplo "Aurora Skin"):
5. Sérum facial com vitamina C 30 ml — 1 variante, 4990, estoque 20, destaque.
6. Protetor solar facial FPS 50 com cor — 1 variante, 5990, estoque 12.
- Descrições de 2 a 3 frases, realistas, sem prometer resultado médico.
- NCM de exemplo: eletrônicos "85183000" (fone), "85176299" (smartwatch), "85182200" (caixa), "85044010" (carregador); cosméticos "33049910".
- custo_cents ≈ 45% do preço. Pesos e medidas plausíveis.
- slugs em kebab-case sem acento; skus "DEV-001-PRETO" etc.

Idempotente: rodar 2 vezes não duplica. Use upsert por slug (brands, products) e por sku (variants), com onConflict.
Ao final imprima só: "seed-dev: 6 produtos prontos".
Entregue só o código do arquivo, completo.
```
