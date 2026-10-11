# Auditoria de design — Busca Agora

Data: 11/10/2026. Avaliação local em Next.js 16.3.8, com Chromium/Playwright, em 390 × 844 e 1440 × 900. Nenhuma alteração no código do app, instalação, commit, push ou comentário externo. Este documento contém propostas, não um novo design aprovado.

## Método, evidências e limites

Foram lidos CLAUDE.md, os seis arquivos `docs/design/*.dc.html`, o tema `app/globals.css` e os componentes das nove pastas solicitadas. A habilidade `design-audit` orientou consistência, foco, contraste e movimento. Não se recomenda aplicar automaticamente sua sugestão de animar toda lista: isso conflita com a prioridade de desempenho e clareza da loja.

O app foi iniciado com `npm run dev`, em `http://localhost:3000`. O Supabase local já estava funcionando. As capturas são PNGs de página inteira em [output/auditoria](../../output/auditoria/). A API de captura segue a [documentação oficial do Playwright](https://playwright.dev/docs/screenshots). Não houve chamada a pagamento, compra de frete, emissão de nota ou envio de e-mail.

Foram criados dois usuários sintéticos locais, segundo o mecanismo de `tests/e2e/supabase.ts` e `admin.spec.ts`, para capturar cliente e admin. Ambos foram removidos ao final. O único estado persistente adicional de navegação é um carrinho de visitante com um smartwatch de teste. Não foram apagados produtos ou pedidos preexistentes.

Limites importantes:

- O catálogo local contém 753 eletrônicos na captura, marcas de teste com sufixos aleatórios, fotos vermelhas de fixtures e muitos produtos sem foto. Os números de venda do admin também são de teste. Isso não representa o catálogo comercial nem permite avaliar qualidade da fotografia final.
- `/checkout` responde com a tela 404. Não existe página de checkout neste checkout do repositório; a rota genérica `app/(loja)/[...rota]/page.tsx:6` chama `notFound()`. O design aprovado existe, mas a implementação não pôde ser avaliada.
- Conta, endereços, pedidos e admin foram capturados autenticados. Também foram capturados os redirecionamentos de visitante. A conta sintética não possui pedidos nem endereços.
- A bolinha “N” e eventual contador vermelho são indicadores do Next.js em desenvolvimento, não elementos da marca.
- Em uma captura de página inteira, barras fixas aparecem na posição do viewport inicial, inclusive no meio de uma imagem longa. Isso não significa que a barra ficou fixa no meio da página. A sobreposição permanente no último conteúdo deve ser verificada em viewport e com rolagem até o fim.
- Capturas comuns usam movimento reduzido para estabilidade. Splash e estados complementares usam movimento normal. A captura do splash registra um instante transitório, não sua aparência final. Não foram medidos Core Web Vitals de produção, experiência de PWA instalada, leitor de tela ou todos os estados de falha das integrações.

### Índice de capturas

Cada nome abaixo tem os sufixos `-390.png` e `-1440.png`, salvo indicação. Os nomes refletem o estado, não necessariamente a URL final após redirecionamento.

| URL/estado | Nome em `output/auditoria/` |
| --- | --- |
| `/` | `home` |
| `/c/eletronicos`, `/c/cosmeticos` | `c-eletronicos`, `c-cosmeticos` |
| `/busca?q=fone`, `/busca?q=xyz` | `busca-fone`, `busca-vazia` |
| `/p/smartwatch-com-monitor-de-batimentos` | `produto` |
| Carrinho vazio e com smartwatch | `carrinho-vazio`, `carrinho-item` |
| `/checkout` — 404 atual | `checkout` |
| `/entrar`, `/cadastro`, `/recuperar-senha` | `entrar`, `cadastro`, `recuperar-senha` |
| Conta, endereços e pedidos autenticados | `conta`, `conta-enderecos`, `conta-pedidos` |
| Mesmas três URLs como visitante | `conta-visitante`, `enderecos-visitante`, `pedidos-visitante` |
| `/rastreio` | `rastreio` |
| `/termos`, `/privacidade`, `/trocas`, `/sobre`, `/contato` | nomes iguais às rotas |
| `/pagina-inexistente-auditoria` | `404` |
| `/admin` autenticado e visitante | `admin`, `admin-visitante` |
| Abertura, cookies e CEP aberto | `splash`, `cookies`, `cep-aberto` |
| Card e botão em hover/foco | `card-hover`, `card-foco`, `botao-hover`, `botao-foco` |
| Filtros abertos no celular | `filtros-abertos-390.png` |

A barra inferior aparece nas capturas de todas as páginas públicas em 390 px. Total: 69 capturas.

## A. Diagnóstico geral

1. A Home já tem personalidade: ultramar, lima, tipografia grande e dois universos de cor claros.
2. A sensação de “sem alma” cresce depois dela: quase tudo vira título seguido de cartão branco com borda.
3. Falta produto real na fotografia; ícones de placeholder não comunicam acabamento, desejo ou escala.
4. Categoria tem amplo topo vazio à direita, sem expressar eletrônicos ou cuidados pessoais.
5. Busca vazia ocupa uma superfície enorme e oferece pouca ajuda para uma nova tentativa.
6. Formulários, estados vazios e páginas institucionais repetem o mesmo ritmo, independentemente da intenção.
7. O lima funciona bem como assinatura, mas hoje marca mais promoções e instalação do que decisões de compra.
8. Raios e alturas variam sem uma regra explícita de função; a maioria das diferenças é pequena, mas acumulativa.
9. O 404 mostra um caminho bom: texto próprio, composição gráfica e ação útil sem funcionalidade extra.
10. Fotografia consistente e extensão criteriosa dessa linguagem valem mais que animações adicionais.

## B. Harmonia do sistema

Os valores abaixo são padrões propostos para componentes sem design aprovado. Nas telas aprovadas, manter os valores do `.dc.html` correspondente; diferenças justificadas por acessibilidade devem ser registradas. Não transformar toda exceção intencional em defeito.

| Aspecto | Evidência atual — arquivo:linha | Padrão proposto |
| --- | --- | --- |
| Raio de card | `components/loja/product-card.tsx:39`: 18/22 px; `components/carrinho/cart-summary.tsx:18`: 22/28; `components/conta/auth-card.tsx:13`: 22/28 | Card de produto 18/22 permanece por referência; superfície de serviço 22 mobile/28 desktop; placa de categoria 24; não misturar três raios na mesma hierarquia. |
| Raio de controles | `components/ui/button.tsx:20`: 14; `:21`: 16; `components/loja/shipping-quote.tsx:229`: 12; `components/loja/catalog-results.tsx:26`: 12 | Campo/ação padrão 14 px; CTA de compra 16; controle compacto 12 somente dentro de grupos. |
| Sombras | `product-card.tsx:39`: hover 0 16px 32px, 10%; `search-form.tsx:155`: 18%; `admin/sales-chart.tsx:39`: 0 1px 2px, 6% | Superfície estática sem sombra; elevação de card `0 16px 32px rgba(10,15,61,.10)`; popover `0 16px 32px rgba(10,15,61,.18)`; reservar sombra para sobreposição/interação. |
| Bordas | `auth-form.tsx:65`: 1,5 px; `product-gallery.tsx:55`: 1,5/2,5; `button.tsx:17`: 2; `cart-line.tsx:98`: 1,5 | Card 1 px borda; campo 1,5 px borda-forte; seleção 2 px ultramar com espaço reservado; foco externo 3 px, sem alterar dimensão. |
| Escala de espaços | `app/(loja)/layout.tsx:17`: gaps 24/40; `shipping-quote.tsx:189`: padding 18; `auth-card.tsx:13`: 24/40; `legal-page.tsx:55`: 20/36 | Escala 4, 8, 12, 16, 24, 32, 40, 48, 64. Superfície nova: padding 20 mobile/32 desktop; grupo 16; seções 24/40. Preservar 18/36 nas referências aprovadas. |
| Alturas | `button.tsx:20`: 48; `:21`: 56; `catalog-results.tsx:26`: 44; `shipping-quote.tsx:229`: 46; `empty-state.tsx:32`: 52 | Campos novos 48 px; botão padrão 48; compra/avanço 56; ícone 44 × 44; compactos 44. Frete aprovado de 46 permanece até revisão específica. |
| H1 | `auth-card.tsx:15`: 26/30; `legal-page.tsx:28`: 28/34; `app/(loja)/not-found.tsx:16`: 36/56 | H1 utilitário 28/34, Sora 800, line-height 1,2; autenticação pode manter 26/30 como variante compacta; título expressivo 36/56 somente em páginas de marca. |
| H2 e corpo | `section-header.tsx:58`: 22/34; `legal-page.tsx:55`: 20; `admin/sales-chart.tsx:41`: 18 | H2 de seção 22/28 nas novas telas; H2 de card 20/22; admin 18/20. Corpo 16 px, line-height 1,5; auxiliar 14, rótulo 15/700. Home mantém 22/34 aprovado. |
| Texto secundário | `auth-form.tsx:65`: placeholder texto-3; `footer.tsx:98`: lavanda-600; `catalog-results.tsx:285`: texto-2 | `texto-2` em conteúdo claro; `lavanda` em conteúdo escuro; `texto-3` só placeholder. Não usar tinta da categoria em seu fundo saturado para texto pequeno. |
| Hover | `product-card.tsx:39`: transformação e sombra; `catalog-results.tsx:159`: troca de cor sem transição; `address-manager.tsx:44`: troca de cor | Cor 150 ms ease-out; card 180–200 ms. Card -4 px só com mouse e motion-safe. Não animar toda a página ou toda a lista. |
| Foco | `app/globals.css:106`: ultramar global; `search-form.tsx:104`: lima no header; `cep-button.tsx:99`: outline 2 | 3 px + offset 2. Ultramar sobre claro; lima sobre ultramar/noite. Contorno sempre visível fora de wrappers com overflow; auditar card, galeria e popover. |
| Ativo | `bottom-nav.tsx:74`: pílula; `account-nav.tsx:44`: fundo ultramar-50; `shipping-quote.tsx:260`: borda | Navegação ultramar-50 + texto ultramar + `aria-current`; opção selecionada borda ultramar 2 px + marcador textual/radio, nunca só cor. |
| Desabilitado/carregando | `button.tsx:9`: opacidade 50%; `auth-form.tsx:87`: 60%; `cart-line.tsx:111`: 40% | Fundo borda + texto texto-2 para indisponível; carregando preserva geometria, texto “Aguarde…” e `aria-busy`. Explicar estoque esgotado. Não resolver todos os estados por opacidade. |
| Ícones | `icons.tsx:9`: 24/traço 2; `bottom-nav.tsx:78`: 22 e 1,8/2,2; `search-form` usa ícone de busca com traço próprio | Conteúdo 20/24 com traço 2; barra inferior mantém 22 e 1,8/2,2 por hierarquia; ilustração 48/64; busca 2,4 permanece conforme referência. |
| Larguras | `layout.tsx:17`: 1280 com gutter 16/32; `auth-card.tsx:13`: 480; `legal-page.tsx:26`: 760; `rastreio/page.tsx:14`: 520; `admin-shell.tsx:248`: 1200 | Shell público 1280; leitura 760; auth 480; rastreio 520; checkout 1180 aprovado; admin 1200 após sidebar 248. São funções diferentes, não uma única largura universal. |
| Chips/selos | `category-chip.tsx:25`: visual 40 com hitbox ampliado; `catalog-results.tsx:252`: selo “ativos”; `footer.tsx:80`: raio 8 | Chip interativo 44 de altura, raio 999; selo informativo 24–28, texto 12/700; seleção escrita “3 filtros ativos”. Pagamentos são selos informativos, sem simular botão. |
| Movimento de navegação | `navegacao/navigation-progress.tsx:123`: transition de width; `app/globals.css`: fade e tratamento global de movimento reduzido | Barra visual com scaleX, origin-left, mantendo lógica de navegação; página só opacidade. Não propor biblioteca. |

Contrastes calculados sobre os hex do tema, com luminância relativa sRGB: `texto-2/fundo` 7,30:1; `texto-3/branco` 4,80:1; `ciano-ink/ciano-tile` 5,16:1; `rosa-ink/rosa-tile` 5,45:1; `lima/ultramar` 6,55:1; `ultramar/branco` 7,74:1. Atenção: `rosa-ink/rosa` 3,06:1 e `ciano-ink/ciano` 3,71:1. Nos fundos saturados, usar `noite` para texto normal. Estes cálculos não substituem verificação de transparências, foco e estados reais.

## C. Página por página

As capturas de cada item estão vinculadas em ambas as larguras. Problemas aparecem em ordem de impacto. “Proposta” significa mudança futura sujeita à aprovação de fase.

### Home — `/`

[390](../../output/auditoria/home-390.png) · [1440](../../output/auditoria/home-1440.png).

**Funciona:** slogan muito legível, hero noite/lima, categorias reconhecíveis, benefícios antes dos produtos. É a página mais próxima de uma marca própria.

**Problemas:** (1) placeholders e repetições E2E eliminam desejo de compra; (2) bloco de instalação ocupa muita atenção entre vitrines, sobretudo mobile; (3) frase “O que todo mundo está buscando” precisa de base real, não apenas ordenação administrativa; (4) informações “[a preencher]” prejudicam confiança.

**Proposta:** preservar composição, medidas e textos de `Home.dc.html` e `Celular-Home.dc.html` nesta fase. Priorizar fotos dos produtos via admin, com enquadramento consistente e sem fixtures. Validar a origem de “Mais buscados”; se não existir métrica, propor à aprovação editorial “Escolhas da Busca Agora”, sem inventar popularidade. Uma eventual versão mais compacta da instalação — padding 20, título 20, texto 14, ação de 44 — exige revisão do design aprovado, não ajuste silencioso. Não acrescentar carrossel automático.

### Eletrônicos — `/c/eletronicos`

[390](../../output/auditoria/c-eletronicos-390.png) · [1440](../../output/auditoria/c-eletronicos-1440.png).

**Funciona:** título, breadcrumb, filtros por GET e duas colunas mobile. **Problemas:** (1) nenhuma cena visual específica da categoria; (2) área superior direita sem função; (3) filtros e catálogo poluídos por fixtures; (4) card corta nome e não revela material/escala.

**Proposta:** topo com raio 24, `ciano-tile`, padding 24 mobile/32 desktop. Desktop: grid 60/40, gap 32, altura mínima 216; esquerda: label “ELETRÔNICOS” 12/700, H1 34/800, descrição 16, contagem real 14. Direita: placa ciano de 320 × 160 com desenho de fone e relógio de traço, `noite`, sem animação contínua. A placa preenche o vazio; não colocar banner comercial fictício. Mobile: texto primeiro, pequena ilustração 88 × 88 ao lado do título apenas se couber; não empurrar produtos com uma imagem de 200 px. Abaixo, atalhos de 44 px para buscas existentes “Fones”, “Relógios”, “Caixas de som”, “Carregadores”; usar URLs `/busca?q=...` sem criar taxonomia nova. Sidebar 260; gap 32; grid conserva minmax 210 e gap 20. Remover atalhos sem catálogo correspondente.

### Cosméticos — `/c/cosmeticos`

[390](../../output/auditoria/c-cosmeticos-390.png) · [1440](../../output/auditoria/c-cosmeticos-1440.png).

**Funciona:** mesma arquitetura previsível de eletrônicos. **Problemas:** (1) troca somente título/cor de placeholder; (2) séruns duplicados parecem catálogo artificial; (3) categoria não comunica rotina nem textura.

**Proposta:** mesmo topo 24/32 e grid 60/40, com `rosa-tile`. Placa direita rosa 320 × 160, frasco e gota em `noite`; headline “Cuidados para sua rotina” como subtítulo 20/700 abaixo de “Cosméticos”. Atalhos “Skincare”, “Cabelo”, “Corpo”, “Proteção solar” apenas se busca existente retornar itens pertinentes. Em 390 px, chips em uma linha rolável, gap 8, gutter 16; produtos começam após gap 24. Fotos devem mostrar embalagem e volume real, sem promessas de resultados ou selos inventados.

### Busca com resultados — `/busca?q=fone`

[390](../../output/auditoria/busca-fone-390.png) · [1440](../../output/auditoria/busca-fone-1440.png).

**Funciona:** termo destacado, contagem e critérios de ordenação. **Problemas:** (1) filtros ocupam uma coluna alta e pouco densa; (2) contexto do termo não aparece no campo de busca como uma edição natural em todas as situações; (3) marcas artificiais tornam o filtro quase interminável.

**Proposta:** título “Resultados para ‘fone’” 28/34; contagem imediatamente abaixo com margin-top 8. Toolbar acima do grid: contagem à esquerda, ordenação 220 × 48 à direita no desktop; no mobile, um controle “Filtrar e ordenar” 48 de altura. Sidebar fica só com preço/marca; lista de marcas max-height 264 com scroll, nomes 15 e hitboxes 44. Chips dos filtros aplicados, altura 44, texto “Marca: …”, “Até R$ …”, ação para remover um filtro por URL. Não adicionar sugestões sem dados. Preservar termo digitado no campo.

### Busca vazia — `/busca?q=xyz`

[390](../../output/auditoria/busca-vazia-390.png) · [1440](../../output/auditoria/busca-vazia-1440.png).

**Funciona:** explica grafia e palavras mais gerais. **Problemas:** (1) ação principal sai da busca para Home; (2) enorme sidebar ao lado de zero resultado; (3) dois títulos repetem o termo sem ajudar.

**Proposta:** sem filtros ativos, substituir área do grid por bloco max-width 640, padding 24/40, alinhado à esquerda. Ícone busca 48 numa placa ultramar-50 de 72; título “Ainda não achamos ‘xyz’.” 24/28; texto “Tente outra palavra ou explore nossas categorias.” 16. Campo de nova busca 48 + botão lima 48, valor atual preservado e selecionável; abaixo dois links de categoria 44. Com filtros ativos, manter contexto dos filtros e priorizar “Limpar filtros”. Não exibir produtos “parecidos” inventados. Sidebar recolhida no estado sem resultado, abrível para quem deseja ajustar.

### Produto

[390](../../output/auditoria/produto-390.png) · [1440](../../output/auditoria/produto-1440.png).

**Funciona:** vendido pela loja, preço grande, estoque, frete, duas ações distintas, descrição e ficha técnica. **Problemas:** (1) placeholder domina a galeria; (2) no celular, foto e metadados tornam longa a distância até comprar; (3) recomendações incluem fixtures vermelhas; (4) `ProductCard` usa `object-cover`, que pode cortar embalagens.

**Proposta:** primeiro cumprir `Produto.dc.html`, sem redesenhar galeria/compra. Preparar fotos quadradas com produto ocupando 70–80% da placa, margem interna visual mínima 16; manter dimensão da imagem reservada. Fotografias de detalhe em miniaturas já existentes; alt descreve produto/ângulo. Para packshot, propor `object-contain` no card com padding 16/24, diferenciando fotos editoriais que precisam de cover. Não criar zoom complexo, prova social ou reviews. Revisar qualquer CTA fixo mobile junto da barra inferior: soma das alturas + safe-area deve ter espaço equivalente ao final; não esconder frete nem chamar pagamento ainda indisponível.

### Carrinho vazio

[390](../../output/auditoria/carrinho-vazio-390.png) · [1440](../../output/auditoria/carrinho-vazio-1440.png).

**Funciona:** explica ausência e oferece retorno à loja. **Problemas:** (1) estado genérico igual a pedidos; (2) grande card branco sem marca; (3) não aponta os dois universos da loja.

**Proposta:** placa `ultramar-50`, max-width 640, padding 24/40, raio 22/28; caixa de traço 64, sem animação infinita. H2 “Seu próximo achado começa aqui.” 24/28; corpo “Seu carrinho está vazio. Explore eletrônicos e cosméticos.” 16. Ação principal “Buscar produtos” 56 e dois links de categorias 44. Sem itens aleatórios, cupom ou venda cruzada obrigatória.

### Carrinho com item

[390](../../output/auditoria/carrinho-item-390.png) · [1440](../../output/auditoria/carrinho-item-1440.png).

**Funciona:** quantidade 44, remover explícito, subtotal, frete e total separado. **Problemas:** (1) mobile dispersa quantidade/remover/preço em muitas linhas; (2) subtotal aparece duas vezes com pouco contraste de hierarquia; (3) CTA leva a checkout ausente.

**Proposta:** card mobile padding 16; linha inicial foto 88 + título/variação; linha seguinte stepper 44 à esquerda e subtotal 20/800 à direita; remover 44 abaixo, alinhado à esquerda. Gap entre linhas 16. Desktop: lista flexível e resumo 360 px, gap 24; resumo sticky top 24, sem alteração de cálculo. Mostrar “Total dos produtos” e “Frete a calcular” até cotação; total final 28/800. CTA 56 × 100%, texto “Continuar para o pagamento”. Resolver checkout na fase funcional antes de declarar compra pronta.

### Checkout — `/checkout`

[390](../../output/auditoria/checkout-390.png) · [1440](../../output/auditoria/checkout-1440.png).

**Funciona:** só existe referência aprovada. **Problema crítico:** URL atualmente renderiza 404; não há checkout visual para auditar.

**Proposta para a fase autorizada:** implementar `Checkout.dc.html`: shell 1180, gutter desktop 32, header compacto com logo 32 e segurança, main padding 28/32/72, etapas gap 10, colunas gap 24, cards raio 24/padding 28, coluna de formulário flex-basis 560. Em 390: gutter 16, cards padding 20, uma coluna; resumo abaixo de entrega, CTA 56. Manter ordem endereço, frete, CPF, pagamento; não inventar checkout transparente nem status de sucesso. A diferença entre layout aprovado e fluxo funcional deve ser resolvida na fase do checkout, não nesta auditoria.

### Entrar

[390](../../output/auditoria/entrar-390.png) · [1440](../../output/auditoria/entrar-1440.png).

**Funciona:** rótulos, mostrar senha, Google, recuperação e criar conta. **Problemas:** (1) card 480 sozinho num grande fundo não expressa loja; (2) todas as ações secundárias ficam visualmente próximas de uma CTA; (3) foco na borda de superfícies deve manter contraste.

**Proposta:** manter card 480, padding 24/40 e campos 48; inserir ícone de conta 24 dentro de placa 48 ultramar-50 antes do título, gap 16. Texto “Seus pedidos e endereços, tudo por aqui.” Sem prometer dado salvo que não exista. Principal 56; Google contorno 48; links auxiliares 44, fonte 14/700. Não criar coluna ilustrada grande que atrase login. No retorno de carrinho, subtítulo específico “Entre para continuar sua compra.”

### Cadastro

[390](../../output/auditoria/cadastro-390.png) · [1440](../../output/auditoria/cadastro-1440.png).

**Funciona:** estrutura consistente com login e consentimento explícito. **Problemas:** (1) grande sequência de campos e ações semelhantes; (2) informação de senha/termos compete com CTA; (3) personalidade genérica.

**Proposta:** título “Crie sua conta” 28/34; subtítulo “Seus pedidos ficam sempre à mão.” 16. Agrupar campos existentes com gap 16, helper de senha 14/1,5 logo após senha, termos em bloco sem borda com label mínimo 44. CTA 56; “Já tem conta? Entrar” com região clicável 44. Não acrescentar telefone, CPF ou endereço obrigatórios por motivo visual. Confirmar mensagens de sucesso com ícone de check e texto, não só fundo verde.

### Recuperar senha

[390](../../output/auditoria/recuperar-senha-390.png) · [1440](../../output/auditoria/recuperar-senha-1440.png).

**Funciona:** pede apenas e-mail e explica ação. **Problemas:** (1) mesmo card do login para tarefa muito menor; (2) confirmação poderia ser mais inequívoca sem revelar existência de conta.

**Proposta:** variante compacta max-width 440, padding 24/32; placa de chave 48; título 28/34; texto atual mantido. Campo 48, CTA 56 “Enviar link”; retorno 44. Após envio, substituir a explicação por “Se houver uma conta com esse e-mail, você receberá um link para criar uma senha nova.” Não afirmar que enviou a endereço registrado sem garantia.

### Conta — `/conta`

[390](../../output/auditoria/conta-390.png) · [1440](../../output/auditoria/conta-1440.png).

**Funciona:** dados editáveis, CPF opcional e explicação, ação destrutiva separada. **Problemas:** (1) abas mobile largas deixam “Pedidos” cortado; (2) e-mail longo quebra numa posição ruim; (3) excluir conta tem peso quase equivalente à tarefa principal.

**Proposta:** nav mobile com três abas em grid igual, ícone 20, texto 13, altura 48; “Sair” em ação separada ao final. Desktop sidebar 260 permanece. Formulário max-width 680, padding 20/32; e-mail com overflow-wrap:anywhere e fonte 14; campos 48/gap 16. Cartão de excluir conta abaixo com margin-top 32, título 18 e botão contorno rosa-ink 48, sem escondê-lo. Texto de ajuda de CPF mantém finalidade real.

### Endereços

[390](../../output/auditoria/conta-enderecos-390.png) · [1440](../../output/auditoria/conta-enderecos-1440.png).

**Funciona:** CTA claro, autocomplete de CEP previsto e estados de CRUD. **Problemas:** (1) usa ícone de caixa em vez de localização; (2) CTA fica fora do vazio e parece desconectado; (3) mesmos problemas de nav.

**Proposta:** no vazio, pin 48 em placa ciano-tile 72; título “Onde seu pedido vai chegar?” 24/28; corpo “Cadastre um endereço para agilizar sua próxima compra.”; botão “Adicionar endereço” 56 dentro do bloco. Formulário já existente: CEP primeiro, rua e bairro full-width mobile; número/complemento em desktop 1/2, mobile cada um em linha quando rótulo não couber. Cards de endereço padding 20/24, principal em selo 24, editar/excluir com alvo 44. Sem inventar resultado garantido do CEP.

### Pedidos

[390](../../output/auditoria/conta-pedidos-390.png) · [1440](../../output/auditoria/conta-pedidos-1440.png).

**Funciona:** vazio explica local do acompanhamento; lista no código mostra status, número, data e total. **Problemas:** (1) vazio igual ao carrinho; (2) lista compacta tem potencial de quebrar status/preço em 390; (3) componente de status vem do admin e pode usar linguagem operacional.

**Proposta:** vazio com título “Seu primeiro pedido vai aparecer aqui.” 24/28, caixa 48 e texto “Depois da compra, acompanhe cada etapa por aqui.”; CTA “Buscar produtos” 56. Lista futura: linha superior número 15/700 e data 14; linha inferior status textual e total 20/800; padding 20, gap 12, seta 20 com alvo do card inteiro. Reutilizar quatro etapas do `order-progress`, sem mostrar códigos internos como `label_ready`. Estado preenchido avaliado por código, não captura nesta conta vazia.

### Rastreio

[390](../../output/auditoria/rastreio-390.png) · [1440](../../output/auditoria/rastreio-1440.png).

**Funciona:** número + e-mail, instrução onde encontrar número e aba Pedidos ativa. **Problemas:** (1) card dentro de card reduz campo útil; (2) ação lima isolada parece outra família de formulário; (3) falta contexto humano do acompanhamento.

**Proposta:** retirar uma das bordas/paddings aninhados: superfície única max-width 520, padding 24/32, raio 22/28. Placa de caminhão 48 ciano-tile no cabeçalho. H1 “Seu pedido, passo a passo.” 28/34, descrição “Informe o número do pedido e o e-mail usado na compra.” 16. Campos 48, gap 16; CTA ultramar 56, lima reservado ao detalhe gráfico. Preservar mensagem genérica de não encontrado, sem revelar e-mail de terceiro. Timeline existente: textos e datas, etapa atual evidente, sem mapa falso nem progresso inventado.

### Termos

[390](../../output/auditoria/termos-390.png) · [1440](../../output/auditoria/termos-1440.png).

**Funciona:** largura 760, data, títulos e corpo 16 legíveis. **Problemas:** (1) leitura longa sem atalhos; (2) identidade/dados ainda incompletos; (3) grandes blocos brancos repetitivos.

**Proposta:** manter leitura 760 e corpo 16/1,6; índice de âncoras para H2 existentes logo após data, links 44 e gap 8, sem criar nova página. Card padding 20/32; H2 com margin-top 32/margin-bottom 12. Preencher dados por configuração real antes do lançamento; não inventar razão social ou documento. Não reescrever política nesta tarefa visual.

### Privacidade

[390](../../output/auditoria/privacidade-390.png) · [1440](../../output/auditoria/privacidade-1440.png).

**Funciona:** família legal consistente. **Problemas:** (1) mesma densidade independentemente da importância do trecho; (2) contato indefinido enfraquece utilidade; (3) usuários precisam encontrar cookies e direitos rapidamente.

**Proposta:** índice por âncora dos títulos existentes; destaque ultramar-50, padding 16, para canal real de contato quando preenchido; links texto ultramar, sublinhados. Preservar conteúdo e data, sem fabricar conformidade ou consentimento. Rótulo da seção cookies deve coincidir com destino do aviso. Descrição secundária texto-2, nunca cinza muito claro.

### Trocas

[390](../../output/auditoria/trocas-390.png) · [1440](../../output/auditoria/trocas-1440.png).

**Funciona:** informação disponível e ligada a compra. **Problemas:** (1) texto longo oculta ação prática; (2) não separa visualmente orientação e condições; (3) canal operacional ainda pode estar vazio.

**Proposta:** destacar no topo, em ciano-tile, somente as condições já aprovadas no texto; não ampliar prazo nem reinterpretar legislação. Bloco “Como solicitar” com etapas existentes numeradas, ícones stroke, fonte 16, gap 16; botão 48 para área de pedidos ou canal real. Conteúdo completo permanece abaixo com índice. Não transformar prazo em promessa de resolução.

### Sobre

[390](../../output/auditoria/sobre-390.png) · [1440](../../output/auditoria/sobre-1440.png).

**Funciona:** fato próprio e forte: negócio de família, vendedor único; slogan em noite/lima. **Problemas:** (1) tratamento visual de documento jurídico; (2) cards de benefícios repetem a Home; (3) “Despacho em até 24 h” precisa de confirmação operacional.

**Proposta:** separar composição institucional da variante legal, mantendo rota. Shell 960; topo noite raio 28, padding 24/40, H1 32/44 “Uma loja de família. Uma escolha de cada vez.”; texto existente sobre seleção, atendimento e envio 16/18. Abaixo duas placas ciano-tile/rosa-tile, padding 24, explicando as categorias sem invenção. Não usar fotos de pessoas ou estoque fictícios; fotografia real da operação é opcional após aprovação. Dados de vendedor ficam ao final em área clara e legível. Retirar data de atualização do hero institucional, mantendo-a só onde necessária.

### Contato

[390](../../output/auditoria/contato-390.png) · [1440](../../output/auditoria/contato-1440.png).

**Funciona:** canais e atalhos existentes, sem formulário inútil. **Problemas:** (1) “[a preencher]” em todos os canais; (2) card dentro de card; (3) tom de página legal, sem acolhimento.

**Proposta:** cabeçalho “Fale com a Busca Agora” 28/34 e texto “Dúvida sobre produto, entrega ou pedido? Escolha um canal.” 16. Grid desktop duas colunas, mobile uma, gap 16, padding dos cards 24, ícones 24, ações 48. WhatsApp principal ultramar, e-mail link sublinhado; horário escrito sem promessa de resposta não confirmada. Atalhos como três links 44. Dados da loja em bloco separado abaixo. Fonte dos dados continua `getStoreInfo`; preenchimento é requisito operacional, não copy inventada.

### 404

[390](../../output/auditoria/404-390.png) · [1440](../../output/auditoria/404-1440.png).

**Funciona:** “Buscou? Aqui não tá.”, grafismo da Home, busca no próprio estado e CTA de volta. É uma assinatura reaproveitável. **Problemas:** (1) placeholder desktop truncado no campo mobile; (2) potencial competição entre header e segunda busca; (3) endereço inexistente é confundido com checkout não implementado no diagnóstico de usuário.

**Proposta:** preservar bloco noite/lima e H1 36/56. Campo mobile com placeholder curto “Buscar outro produto”, altura 48, label existente. Max-width da busca 520. Corpo 16/18, CTA 48/56. Sem mascote pesado, countdown ou redirecionamento automático. Resolver rotas ausentes funcionalmente, sem maquiar com um 404 mais bonito.

### Splash

[390](../../output/auditoria/splash-390.png) · [1440](../../output/auditoria/splash-1440.png).

**Funciona:** logo própria, slogan, botão para pular, Escape, foco e suporte a movimento reduzido. **Problemas:** (1) muito conteúdo anima dentro de 1,5 s; (2) `.dc.html` original tem CTA entrando depois de 1,9 s, incompatível com decisão posterior; (3) slogan transitório tem baixa opacidade e não deve ser único anúncio útil.

**Proposta:** manter máximo 1,5 s e regra de execução atual: abertura direta da Home/F5/PWA, nunca navegação interna ou produto direto. Logo 240 mobile, slogan 38, subtítulo 17, ring 380; preservar geometria aprovada. Botão pular disponível imediatamente, alvo 56. Entrada logo 180 ms, slogan 180 ms com atraso máximo 120; não prolongar para repetir a referência antiga. Com movimento reduzido, abrir direto a Home. Não confundir splash com carregamento de rede nem bloquear por espera de fonte/foto.

### Admin

[390](../../output/auditoria/admin-390.png) · [1440](../../output/auditoria/admin-1440.png).

**Funciona:** painel já tem hierarquia melhor que páginas utilitárias: venda em ultramar/lima, alertas, pedidos, atalhos e menu mobile. **Problemas:** (1) 390 px empilha muitas métricas antes da tarefa operacional; (2) fontes de 10–12 px em gráfico/pedidos; (3) dado de teste dá falsa sensação de operação real; (4) ações importantes ficam abaixo do gráfico.

**Proposta:** preservar sidebar 248 e shell 1200. Mobile: “Pedidos a enviar” e “Precisa da sua atenção” antes do gráfico; cards de vendas continuam informativos, não comerciais. Métricas em grid duas colunas somente quando texto/preço couber em 167 px; caso contrário uma coluna. Padding mobile do main 16, cards 20; data/status 13 mínimo, número 15 e total 16/700. Gráfico altura 180 mobile/220 desktop, resumo textual 14 e valores acessíveis sem depender de hover. Atalhos de pedidos/produtos 48+. Não criar novos módulos nem ampliar Equipe; se houver rota além da seção 7, registrar separadamente para decisão de escopo.

## D. Componente por componente

| Componente | Problema e evidência | Proposta concreta |
| --- | --- | --- |
| Card de produto | `product-card.tsx:56`: cover; `:71`: nome clamp; parcela fixa `:81`; fixtures nas capturas | Packshot contain e padding 16/24 após aprovação; duas linhas reservadas, preço alinhado; não inventar desconto/parcelamento. Hover/foco em [card-hover](../../output/auditoria/card-hover-1440.png) e [card-foco](../../output/auditoria/card-foco-1440.png). Movimento -4 só motion-safe. |
| Header | `header.tsx:17,43`: duas linhas fortes no desktop; mobile ocupa 198 px nesta composição | Manter referência aprovada. Garantir CEP e busca com hitbox 44+, focus lima. Não acrescentar mensagens/menus ao topo. Analisar compactação somente como revisão posterior. |
| Busca | `search-form.tsx:104,155`: outline no wrapper, popover 18% sombra | Preservar autocomplete atual; opções 44; termo editável; placeholder curto nas variantes mobile/404. Foco não pode ficar cortado em overflow. |
| Chips categoria | `category-chip.tsx:25`: visual 40 com pseudoelemento de hitbox | Para novas telas, altura real 44, gap 8, selecionado com texto e aria-current; cores como ponto decorativo, texto noite. Não duplicar barra de categorias no rodapé. |
| Filtros | `catalog-results.tsx:246`: details nativo; lista de marcas sem limite | Conservar funcionamento sem JS; marca em área max-height 264, filtro com rótulo e opção 44; resumo “Filtrar e ordenar · 3 ativos”. [Aberto](../../output/auditoria/filtros-abertos-390.png). Não transformar automaticamente em drawer pesado. |
| Galeria | `product-gallery.tsx:41,55,69`: 28/16/22, miniaturas 76 | Preservar medidas aprovadas; fotos reais com ângulos úteis, seleção não só cor; teclado/alt. Skeleton reserva aspect-square; não animar imagem entrando toda troca. |
| Compra | `product-buy-box.tsx`: variantes, quantidade e preço já separados | Preservar componente conforme Produto. Hierarquia preço 36/40 conforme referência, CTA 56; estoque esgotado explícito; mensagens de adicionar anunciadas sem perder foco. Sem urgência falsa. |
| Frete | `shipping-quote.tsx:189,229,235`: fundo e campos 46; `cep-button.tsx:69`: dialog | Não inventar prazo. Usar “Frete a calcular” antes de cotação, loading textual e erro com retry. Se revisar controle para 48/raio14, registrar divergência da referência. [CEP aberto](../../output/auditoria/cep-aberto-390.png). Dialog max-width400/gutter16, fechamento/retorno de foco. |
| Linha do carrinho | `cart-line.tsx:58,98,144`: mobile flex-column | Foto+título na primeira linha; stepper e subtotal na segunda; remover separado, alvo 44, padding16. Não esconder erro de estoque ao tentar avançar. |
| Resumo | `cart-summary.tsx:18,33`: card22/28, total28 | Subtotal15, frete15, divisor1/borda, total28/800; CTA 56; sticky somente desktop. Total sem frete claramente rotulado. |
| Formulários | `auth-form.tsx:65,87`: campos48, CTA 56; componentes repetem estilos | Centralizar variantes de campo e erro existentes, sem biblioteca. Label15/700, gap8 para campo, gap16 entre grupos, helper14/1,5, erro com texto/aria-describedby. [Botão foco](../../output/auditoria/botao-foco-390.png). |
| Vazios | `empty-state.tsx:19`: mesmo ícone/estrutura para várias intenções | Variantes por função: pin para endereço, caixa para pedidos/carrinho, lupa para busca. H2 24/28, corpo16 max420, CTA 56. Ilustração 48/64, sem manifesto visual em tarefa utilitária. |
| 404 | `app/(loja)/not-found.tsx:8`: boa extensão da Home | Conservar assinatura. Placeholder curto e busca útil. Não alterar geometria para esconder falha funcional. |
| Rodapé | `footer.tsx:107`: mobile só linha legal; links não têm altura44; placeholders | Preservar desktop aprovado. Propor mobile links em linhas com regiões44, adicionar Sobre/Contato em grupo compacto nas telas utilitárias se aprovado. Completar configuração real; pagamentos exibidos devem refletir meios disponíveis na v1. |
| Barra inferior | `bottom-nav.tsx:66,74,78`: quatro abas, estado ativo correto | Manter quatro abas e aria-current. Região48 por aba, cor texto-2/noite, fonte11 atual; propor12 em revisão sem alterar labels. Reservar espaço total da barra+safe-area ao final; testar último campo e CTA em viewport. |
| Splash | `splash.tsx`: execução por abertura e timeout por performance.now | Preservar regra, reduzir coreografia; CTA imediatamente utilizável; movimento reduzido sem overlay. Não adicionar sons ou delay artificial. |
| Cookies | `cookie-notice.tsx:32,34`: compacto13, bottom86+safe-area | Conteúdo atual correto para cookies necessários; manter “Entendi”44, texto14/1,4 como proposta, contraste lima/noite. Não criar consentimento de marketing inexistente. [Aviso](../../output/auditoria/cookies-390.png). Revalidar posição com barra e teclado. |
| Instalação PWA | `install-card.tsx:100,175`: instrução ocupa muito espaço | Manter recursos reais; evitar insistência após dispensar. Compactação depende de revisão aprovada da Home. Não simular instalação quando navegador não oferece prompt. |
| Timeline/pedido | `pedido/customer-timeline.tsx:12`: lista de eventos; `conta/order-progress.tsx`: quatro etapas | Evento15 e data14, linha vertical2/borda, marcador24; etapa atual ultramar+texto. Sem animação infinita nem porcentagem fictícia. Não expor detalhes internos dos jobs ao cliente. |
| Painel admin | `admin-shell.tsx:248`, `dashboard-cards`, `data-table`, `sales-chart` | Prioridade para operação; tabelas desktop e cards mobile já são caminho correto. Padding20/24, linhas mínimas48, rótulos13, texto15. Upload/variantes com campos48 e erro localizado; confirmação de cancelar/estornar permanece explícita. |

## E. Assinaturas de “alma”

P = pequeno, normalmente até meio dia de implementação; M = médio, cerca de 1–2 dias; G = grande, vários dias ou dependência de produção de ativos. Estimativas indicativas, não promessa de prazo. Nenhuma ideia requer biblioteca nova.

| Assinatura | Onde e execução | Esforço | Desempenho e acessibilidade |
| --- | --- | --- | --- |
| Lima como marca-texto | Palavra final de headlines sobre noite/ultramar, placa retangular 4px de raio em títulos institucionais; não colorir parágrafos inteiros | P | CSS estático, 0 KB de dependência. Texto noite sobre lima; não usar lima sobre branco. |
| Dois universos de produto | Packshots quadrados, placa ciano-tile/rosa-tile e mesma escala visual de 70–80% em todas as fotos | G | Imagens responsivas já via Next Image, sizes coerente; evitar transparências enormes. Alt útil e nenhuma informação só na foto. |
| Forma do “q”/logo | Arcos já presentes no hero/404 como fundo de topos de categoria e Sobre; 1–2 formas estáticas, cortadas dentro da superfície | M | CSS/SVG leve; aria-hidden, pointer-events-none; não sobrepor texto ou contraste. Reutilizar logo, não redesenhá-la. |
| Topos de categoria próprios | Placa direita fone/relógio ou frasco/gota, título/contagem à esquerda, compacta em 390 | M | SVG de traço sem lib, sem animação contínua; texto noite em fundo saturado. |
| Voz de “achado” | “Seu próximo achado começa aqui.” no carrinho; “Ainda não achamos…” na busca; conservar tom direto do 404 | P | Sem impacto de JS. Mensagem de erro técnico continua precisa; não usar brincadeira em pagamento ou falha de pedido. |
| Confirmação discreta de carrinho | Botão muda para “Adicionado”, check de traço entra por opacity150ms; contagem atualizada com aria-live | P | CSS motion-safe; sem fly-to-cart, som ou mudança de layout. Evitar anúncio repetido em duas regiões. |
| Papel de cada CTA | Ultramar para avanço/serviço; lima para descoberta sobre fundo escuro; contorno para alternativa | P | Sem custo extra; padrão melhora reconhecimento. Preservar exceções aprovadas de Home/Produto/Checkout até revisão. |
| Endereço com pin próprio | Estado vazio e cartão principal com placa ciano-tile, não caixa de entrega genérica | P | SVG existente/reutilizado; status “Principal” escrito, não só cor. |
| Ordem com percurso claro | Mesmas quatro etapas existentes, linha contínua e etapa atual escrita; data/hora dos eventos em SP | M | Dados reais, sem polling novo ou animação de mapa. Sem informação exclusiva por cor. |
| Loja de família visível | Sobre com texto real já existente, duas placas das categorias e foto real opcional da operação | G | Foto otimizada, sem vídeo hero; consentimento para foto de pessoa e alt descritivo. Não fabricar equipe, volume ou depoimento. |
| Estados de foco como marca | Contorno lima sobre escuro/ultramar sobre claro e destaque ultramar-50 no item ativo | P | CSS 0 KB. Teclado recebe feedback equivalente ao hover; não depender de transform. |
| Admin que aponta próxima ação | Alertas operacionais antes de gráfico no mobile, CTA direto para pedidos já existente | M | Sem novas consultas obrigatórias; ordem semântica coerente e métricas legíveis. Alma operacional, não decoração de campanha. |

Referências como Mercado Livre, Nike, Glossier, Apple Store, Allbirds e Nothing são usadas aqui como intenção fornecida no briefing: clareza, produto em primeiro plano e linguagem consistente. Não houve benchmark atualizado dos sites dessas marcas, nem se atribuem medidas ou comportamentos específicos a elas.

## F. Plano em três ondas

Não executar automaticamente. Uma fase por vez, com plano e aprovação. As telas aprovadas devem primeiro cumprir suas referências; propostas de revisão são decisões explícitas. Não criar avaliações, cupom, wishlist, marketplace, app nativo ou novos módulos.

### Onda 1 — ganhos rápidos de alto impacto

| Prioridade | Entrega | Arquivos afetados na implementação futura | Esforço |
| --- | --- | --- | --- |
| 1 | Completar canais/dados reais e conferir promessas de despacho, NF e meios de pagamento; bloquear publicação com placeholders | `lib/store-info.ts`, admin/configurações, `components/loja/footer.tsx`, `app/(loja)/sobre/page.tsx`, `app/(loja)/contato/page.tsx` | P/M, depende do dono |
| 2 | Preparar ambiente visual de teste isolado de fixtures e carregar fotos válidas; não limpar banco compartilhado sem aprovação | `scripts/seed-dev.ts`, `tests/e2e/global-setup.ts`, fluxo admin de produto | M; remoção não autorizada nesta auditoria |
| 3 | Busca vazia com nova tentativa/categorias; eliminar card aninhado do rastreio | `components/loja/empty-state.tsx`, `components/loja/catalog-results.tsx`, `app/(loja)/busca/page.tsx`, `app/(loja)/rastreio/page.tsx`, `components/loja/tracking-form.tsx` | M |
| 4 | Padronizar foco/transições nos controles sem referência, corrigir transformação com motion-safe; placeholder 404 curto | `app/globals.css`, `components/loja/product-card.tsx`, `catalog-results.tsx`, `app/(loja)/not-found.tsx` | P |
| 5 | Melhorar ritmo do carrinho e abas de conta em 390 | `components/carrinho/cart-line.tsx`, `cart-summary.tsx`, `components/conta/account-nav.tsx` | M |

Pré-requisito funcional separado: `/checkout` precisa existir antes de lançar fluxo de compra. Não contar implementação de checkout como um polimento pequeno de design.

### Onda 2 — mudanças médias

| Prioridade | Entrega | Arquivos afetados | Esforço |
| --- | --- | --- | --- |
| 1 | Topos ciano/rosa com placas, contagem e atalhos de busca | `app/(loja)/c/[categoria]/page.tsx`, `components/loja/catalog-results.tsx`, `components/loja/icons.tsx` | M |
| 2 | Toolbar de busca, chips dos filtros e limite visual das marcas | `components/loja/catalog-results.tsx`, `components/loja/search-form.tsx`, `lib/catalog/filters.ts` | M |
| 3 | Variantes de vazios, auth compacto e endereço com pin | `components/loja/empty-state.tsx`, `components/conta/auth-card.tsx`, `address-manager.tsx`, `app/(conta)/recuperar-senha/page.tsx` | M |
| 4 | Institucional com personalidade e índice legal | `app/(loja)/sobre/page.tsx`, `contato/page.tsx`, `components/legal/legal-page.tsx`, páginas termos/privacidade/trocas | M |
| 5 | Admin com alertas antes do gráfico no mobile e fontes maiores | `app/admin/page.tsx`, `components/admin/dashboard-cards.tsx`, `recent-orders.tsx`, `sales-chart.tsx`, `admin-shell.tsx` | M |

### Onda 3 — mudanças grandes

| Prioridade | Entrega | Arquivos/ativos afetados | Esforço |
| --- | --- | --- | --- |
| 1 | Produção fotográfica e direção de catálogo para dois universos | Imagens via admin/Storage; `components/loja/product-card.tsx`, `product-gallery.tsx`; sem foto fictícia de produto | G |
| 2 | Fase funcional do checkout fiel à referência e fluxo real testado | Nova rota de checkout e interfaces existentes `lib/payments`, `lib/shipping`; `docs/design/Checkout.dc.html` como referência, sem reescrevê-lo | G |
| 3 | Revisão aprovada da Home/Produto: dimensão de PWA, fotografia, distância até CTA mobile e textos de merchandising | `app/(loja)/page.tsx`, `components/pwa/install-card.tsx`, `components/loja/product-buy-box.tsx`, referências `.dc.html` somente mediante nova aprovação | G |

### Critérios de aceite das ondas

- Conferir 390 e 1440 em viewport e página inteira; nenhuma rolagem horizontal indevida, último campo/CTA acessível acima das barras fixas, teclado virtual sem esconder ação importante.
- Teclado: busca, autocomplete, filtros, cards, galeria, CEP, forms e admin. Foco visível, Escape/retorno de foco nos diálogos, ordem coerente.
- Contraste mínimo 4,5:1 para texto, inclusive auxiliares e estados; alvo 44; zoom 200%; movimento reduzido sem splash nem deslocamentos.
- Estado vazio, loading, erro e preenchido têm texto útil; dados de fixture não entram na avaliação comercial. Checkout não altera status por retorno.
- Imagens com dimensões reservadas e sizes corretos; nenhuma biblioteca nova. Comparar desempenho de produção antes/depois; esta auditoria não certifica métricas.
- `npm run lint`, `npm run typecheck`, testes pertinentes e prévia Vercel exigidos na implementação. Não foram executados como aceite desta avaliação, porque nenhum código do app foi alterado e nenhuma fase foi declarada pronta.

O maior ganho imediato vem de produto real e continuidade de linguagem nas páginas utilitárias. A Home e o404 já fornecem a gramática visual; o trabalho é estendê-la sem transformar toda tela em um banner.
