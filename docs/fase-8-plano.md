# Fase 8 — Painel admin: plano (aguardando aprovação)

Branch `fase-8-admin`. Feita antes das fases 5 a 7 (decisão de 07/10: o Mercado Pago espera o pai do Enzo). Divisão 50/50: o ChatGPT faz G16–G20 (`docs/fase-8-prompts-chatgpt.md`), o Claude Code faz o resto e revisa tudo.
Público: o pai do Enzo, usuário não técnico. Telas simples, textos claros, confirmação antes de qualquer ação que não dá para desfazer.

## Segurança (vale para tudo)

- `/admin` já exige login e `role = admin` no servidor (fase 3). Toda Server Action do admin chama `requireAdmin()` de novo antes de escrever, e escreve com a service role. Nada do admin confia no navegador.
- Fotos: o servidor gera um link de upload assinado do Supabase Storage (válido por poucos minutos, só para admin) e o navegador manda a foto direto para o Storage. Só JPG, PNG e WEBP até 5 MB.
- Configurações mostram se cada integração está ligada e respondendo, nunca o valor da chave.

## Claude Code

1. **Banco** (migration nova):
   - Bucket público `produtos` no Storage (leitura pública, escrita só service role).
   - Tabela `banners` (imagem, título, link, ordem, ativo): não está entre as 18 tabelas da seção 6, mas a seção 7 pede "banners da home". RLS: leitura pública dos ativos, escrita só servidor.
   - Funções de leitura do painel (só admin/servidor): vendas de hoje (fuso `America/Sao_Paulo`), pedidos a enviar, jobs com erro, estoque baixo (≤ 3).
2. **`lib/admin`**: Server Actions com zod para produtos (criar, editar, ativar/desativar, destaque, variações, fotos com ordem), categorias, banners, configurações e ações de pedido.
3. **Telas**:
   - `/admin`: 4 cartões (vendas de hoje, a enviar, erros na fila, estoque baixo) com link para a lista certa.
   - `/admin/pedidos` (filtro por status, busca por número) e `/admin/pedidos/[numero]`: itens, cliente, endereço, linha do tempo (`order_events`), e ações:
     - **Cancelar** (pedido aguardando pagamento) — devolve o estoque.
     - **Marcar nota manual emitida** (para a venda no CPF, `NFE_ENABLED=false`).
     - **Reimprimir** e **Reemitir nota** — colocam o trabalho de novo na fila `jobs`; quem executa é a fase 6.
     - **Estornar** — aparece desativado até o Mercado Pago (fase 5).
   - `/admin/produtos` (lista com busca e filtro ativo/inativo) e `/admin/produtos/novo` e `/[id]`: nome, descrição, categoria, marca, NCM (8 dígitos, obrigatório), CFOP, origem, ativo, destaque, fotos (arrastar para ordenar), variações com preço e custo em reais (convertidos para centavos), estoque, peso e medidas obrigatórios, SKU e EAN.
   - `/admin/categorias`, `/admin/banners`, `/admin/clientes` (só leitura, CPF mascarado) e `/admin/configuracoes` (dados da empresa, endereço de origem, impressora, status das integrações).
   - Home passa a mostrar os banners ativos no lugar da faixa padrão quando houver.
4. **Testes**: banco (cliente comum não lê nem escreve nada do admin; bucket recusa upload anônimo), unidade (schemas), e2e (admin cria produto com foto e variação e ele aparece na loja; cliente comum recebe 404 em todas as rotas do admin; cancelar pedido devolve estoque).

## ChatGPT (G16–G20)

| # | Arquivo | O que é |
| --- | --- | --- |
| G16 | `lib/admin/product-schema.ts` + teste | Schema zod do formulário de produto e variações (reais → centavos, NCM, medidas), `slugify` |
| G17 | `components/admin/image-uploader.tsx` | Fotos: escolher várias, prévia, enviar pelo link assinado, ordenar arrastando (e por teclado), remover |
| G18 | `components/admin/variant-editor.tsx` | Tabela de variações: adicionar, remover, editar preço/custo/estoque/peso/medidas |
| G19 | `components/admin/admin-shell.tsx`, `stat-card.tsx`, `data-table.tsx` | Estrutura do painel: menu lateral (gaveta no celular), cartões do painel, tabela simples |
| G20 | `components/admin/order-timeline.tsx`, `confirm-dialog.tsx`, `status-badge.tsx` | Linha do tempo do pedido, diálogo de confirmação, selo de status em português |

## Preciso do seu ok em 3 pontos

1. **Tabela nova `banners`** (fora das 18 da seção 6, pedida na seção 7).
2. **Estornar fica desativado** até a fase 5 (precisa da API do Mercado Pago); reimprimir e reemitir nota só enfileiram (a fase 6 executa).
3. **Quem é admin**: me diga o e-mail da sua conta no site (crie em https://busca-agora.vercel.app/cadastro se ainda não tiver). Eu marco como admin direto no banco; depois você pode marcar o do seu pai pelo mesmo caminho (ou eu marco).
