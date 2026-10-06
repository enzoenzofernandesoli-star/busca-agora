# Fase 2 — Vitrine, busca e produto: plano (aguardando aprovação)

Branch `fase-2-vitrine`. Referência: `docs/design/Main`, `Home`, `Produto`, `Celular-Abertura`, `Celular-Home`.

Divisão de trabalho (decisão de 06/10): o **ChatGPT escreve 5 peças isoladas** (sem banco, sem API do Next que mudou na versão 16), a partir de prompts fechados. O **Claude Code** faz banco, consultas, páginas, integração, revisão do código do ChatGPT e testes.

## 1. Banco (Claude Code) — migration `..._catalog_search.sql`

- Extensão `unaccent` + função `immutable` `public.f_unaccent(text)` (o `unaccent` puro não é immutable e não pode ir em coluna gerada).
- `products.busca tsvector` gerada: nome com peso A, marca B, descrição C, config `portuguese`, sem acento. Índice GIN.
- View `product_listing` (`security_invoker`): produto ativo + categoria (slug, cor) + marca + menor preço da variante (`preco_cents`, `preco_de_cents`) + estoque somado + primeira foto. Sem `custo_cents`.
- Função `search_products(q, categoria, marca, preco_min, preco_max, ordem, pagina)` (`security invoker`, `stable`): retorna linhas + total. Ordem: relevância (`ts_rank`), menor preço, maior preço, novidades. 24 por página.
- Função `suggest_products(q)`: até 6 nomes por prefixo (`to_tsquery` com `:*`).
- Testes de banco: busca sem acento ("serum" acha "Sérum"), filtro de preço em centavos, produto inativo nunca aparece, anônimo não vê custo pela view nem pelas funções.

## 2. Código (Claude Code)

- `lib/catalog/*`: consultas tipadas (home, categoria, busca, produto, relacionados, sugestões). Server-only.
- `/` (Home igual ao design): destaque "Buscou? Tá aqui." em código (não é imagem), 2 cards de categoria, faixa de vantagens, "Mais buscados" (`destaque = true`), chamada para instalar o app, vitrine de cosméticos. Celular: layout de `Celular-Home`.
- `/c/[categoria]` e `/busca`: filtros por formulário GET (funcionam sem JavaScript), ordenação, paginação. URL é a fonte da verdade (`?q=&marca=&min=&max=&ordem=&pagina=`), validada com zod.
- Sugestões enquanto digita: Route Handler `GET /api/busca/sugestoes?q=` (zod, cache curto) + componente cliente com debounce, teclado (setas, Enter, Esc) e `aria-activedescendant`.
- `/p/[produto]`: galeria, cor (variante), quantidade, estoque, preço, "em até 12x no cartão", descrição, ficha técnica, "Quem buscou isso também viu" (mesma categoria). Componente de frete pronto, sem chamada (fase 4). "Comprar agora" e "Adicionar ao carrinho" desabilitados até a fase 4.
- `not-found.tsx` com a marca, `loading.tsx` com skeleton.
- SEO: `generateMetadata` por página, Open Graph com a logo, `app/sitemap.ts` (produtos ativos + categorias), `app/robots.ts`, JSON-LD de Product.
- Imagens: `next/image` vindo do Storage do Supabase (padrão já liberado na fase 0).
- Splash: só em `/`. Servidor lê o cookie `ba_visto`; sem cookie (1ª visita) ou com `?origem=pwa` (start_url do PWA na fase 9) mostra a abertura por cima da Home já renderizada. Nunca aparece em link direto de produto.
- Testes: Vitest (filtros/zod, JSON-LD, formatação), Playwright (home 390 e 1440, busca com filtro, produto, splash uma vez só).

## 3. Peças do ChatGPT (prompts prontos após a aprovação)

| # | Arquivo | O que é |
| --- | --- | --- |
| G1 | `components/loja/splash.tsx` + CSS | Abertura animada (desenho de `Main`/`Celular-Abertura`), comprimida para 1,5 s |
| G2 | `components/loja/empty-state.tsx`, `product-card-skeleton.tsx` | Estado vazio (loja sem produtos, busca sem resultado) e skeleton dos cards |
| G3 | `components/loja/product-gallery.tsx` | Galeria com miniaturas (cliente) |
| G4 | `lib/seo/json-ld.ts` + teste | Funções puras: JSON-LD de Product e BreadcrumbList a partir de centavos |
| G5 | `scripts/seed-dev.ts` | 6 produtos de exemplo, só no Supabase local (recusa qualquer URL que não seja localhost) |

Cada prompt traz: caminho do arquivo, props/tipos exatos, tokens do Tailwind do projeto, medidas copiadas do design e o que NÃO fazer. Eu reviso, ajusto ao projeto e testo antes de commitar.

## 4. Diferenças em relação ao design (preciso do seu ok)

1. **Abertura:** no design ela dura ~2,6 s e termina com o botão "Entrar na loja". A regra do CLAUDE.md é no máximo 1,5 s. Proposta: mesma sequência, comprimida para 1,5 s, e o botão vira "Pular" desde o início.
2. **Botões de compra:** aparecem, mas desabilitados ("Em breve") até a fase 4 (carrinho).
3. **Frete na página de produto:** o campo de CEP aparece com a mensagem "Cálculo de frete em breve" até a fase 4.

## 5. Fora da fase

Carrinho, frete real, login, checkout, PWA (manifest/ícones) ficam nas fases seguintes.
