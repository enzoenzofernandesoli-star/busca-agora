# Auditoria de design da loja — prompt para o Codex

Pedido do Enzo (11/10): a loja está funcional mas "sem alma". Quer a loja de e-commerce mais marcante possível, com harmonia entre páginas e componentes. Exemplo citado: o topo de `/c/eletronicos` tem um grande vazio à direita do título. O Codex AVALIA e PROPÕE; não altera código. O Claude Code transforma o relatório em plano, mostra ao Enzo e implementa por partes.

Cole o bloco abaixo inteiro numa conversa nova do Codex, na pasta do projeto.

```
Projeto: loja Busca Agora (Next.js 16, Tailwind v4), na pasta atual. Leia CLAUDE.md inteiro antes (seções 4, 7 e 10 principalmente). Tarefa SÓ de avaliação: não altere nenhum arquivo do app, não instale nada, não faça commit, push nem comentário no GitHub. Entregue um relatório em docs/design/auditoria-design.md (único arquivo que você cria) e as capturas em output/auditoria/.

Objetivo: o dono acha a loja "sem alma". Queremos a experiência de e-commerce mais marcante possível SEM sair da identidade (cores e fontes do CLAUDE.md, slogan "Buscou? Tá aqui.", ícones de traço, nunca emoji) e SEM sair do escopo da v1 (nada de avaliações, cupons, lista de desejos, marketplace — seção 10). Referência de nível: Mercado Livre na clareza de compra; marcas como Nike, Glossier, Apple Store, Allbirds e Nothing na personalidade visual.

Fontes de verdade do design aprovado: docs/design/*.dc.html (Home, Celular-Home, Produto, Checkout, Main, Celular-Abertura). Telas que NÃO têm design aprovado (categoria, busca, carrinho, conta, rastreio, páginas legais, 404, admin) foram feitas por analogia: são as que mais precisam de proposta.

Como avaliar:
1. Suba o app local (`npm run dev`; o banco local tem produtos de teste: `npx supabase start` se precisar) e capture com Playwright cada tela em 390x844 e 1440x900, página inteira, salvando em output/auditoria/<rota>-<largura>.png. Telas: /, /c/eletronicos, /c/cosmeticos, /busca?q=fone, /busca?q=xyz (vazia), /p/<um produto>, /carrinho (vazio e com item), /checkout, /entrar, /cadastro, /recuperar-senha, /conta, /conta/enderecos, /conta/pedidos, /rastreio, /termos, /privacidade, /trocas, /sobre, /contato, uma URL 404, a abertura (splash) e /admin (login de admin de teste em tests/e2e/supabase.ts). Inclua estados: hover/foco de botão e card, menu de filtros aberto no celular, janela do CEP aberta, aviso de cookies, barra de baixo.
2. Leia os componentes em components/loja, components/carrinho, components/conta, components/pedido, components/legal, components/pwa, components/navegacao, components/ui e components/admin, e o tema em app/globals.css.

O relatório (português do Brasil, direto, sem enrolação) deve ter:

A. Diagnóstico geral em até 10 linhas: por que parece "sem alma" (ritmo, hierarquia, densidade, uso da cor, fotografia, microinterações, tom dos textos).

B. Harmonia do sistema — tabela de inconsistências entre componentes e páginas, cada uma com onde ocorre (arquivo:linha) e o valor proposto único:
   - raios de canto, sombras, bordas, espaçamentos (escala), alturas de botão/campo, tamanhos de título por nível, cor de texto secundário, estados hover/foco/ativo/desabilitado, ícones (tamanho e traço), larguras máximas de conteúdo, chips/selos.

C. Página por página (todas as do passo 1), cada uma com:
   - o que funciona;
   - problemas (ordem de impacto), com captura de referência;
   - proposta concreta: layout, medidas, tokens, textos — o bastante para implementar sem adivinhar. Ex.: para o topo de categoria, o que ocupa o vazio à direita (faixa ilustrada da categoria com a cor ciano/rosa, contagem, atalhos de subtipo, banner), e como fica no celular.

D. Componente por componente (card de produto, header, busca, chips de categoria, filtros, galeria, compra, frete, carrinho, resumo, formulários, estados vazios, 404, rodapé, barra de baixo, splash, aviso de cookies, painel admin): problemas e proposta.

E. "Alma": 8 a 12 ideias de assinatura visual e de interação que deem personalidade, dentro do escopo e da identidade (ex.: uso do verde-lima como marca-texto, formas da logo como elemento gráfico, fotografia em placa colorida por categoria, microanimações com motion-safe, tom de voz "Buscou? Tá aqui." nos estados vazios). Para cada uma: onde entra, esforço (P/M/G) e risco para desempenho e acessibilidade.

F. Plano priorizado em 3 ondas: (1) ganhos rápidos de alto impacto, (2) mudanças médias, (3) mudanças grandes. Cada item com arquivos afetados e esforço.

Regras: contraste mínimo 4.5:1, alvos de toque ≥ 44 px, pensado primeiro para 390 px, respeitar prefers-reduced-motion, não piorar desempenho (nada de biblioteca nova pesada; se sugerir uma, diga o peso e por quê). Não invente telas fora da lista do CLAUDE.md seção 7. Seja específico: "aumentar o respiro" não serve; "padding vertical do topo de 32 para 48 px no desktop" serve.
```
