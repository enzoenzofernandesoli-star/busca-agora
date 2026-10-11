# Produtos de exemplo e prazo de envio — prompts para o ChatGPT (G39 e G40)

Pedido do Enzo (11/10): produtos fictícios com fotos e descrição para testar o admin e a loja, e o prazo de despacho "em até 24 h" nas páginas. O ChatGPT faz G39 e G40; o Claude Code revisa, roda e confere. Nada pago.

Mesmo esquema: uma conversa por prompt, **só os arquivos listados**, nada instalado, sem commit nem push. Branch: `conteudo-exemplos`.

---

## G39 — Script dos produtos de exemplo

```
Projeto: loja Busca Agora (Next.js 16, TypeScript strict, Supabase). Sem "any", sem biblioteca nova. Código e comentários em inglês; textos dos produtos em português do Brasil. DINHEIRO EM CENTAVOS INTEIROS.

Tarefa: crie scripts/seed-exemplos.ts — script Node (roda com `node scripts/seed-exemplos.ts`, Node 24 com tipos removidos: só sintaxe de tipo que o Node aceita, nada de enum/namespace; importe só pacotes que já existem: "@supabase/supabase-js"; use import com extensão .ts se importar arquivo local — de preferência não importe nada local).

O que faz:
1) Lê NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY de um arquivo .env indicado por --env (padrão ".env.local"), parse simples linha a linha (CHAVE=valor, ignore # e linhas vazias, tire aspas). Nunca imprima a chave.
2) Exige --confirmar para escrever (sem ela, só mostra o que faria). Mostra o host do Supabase antes de começar.
3) Cria 12 produtos FICTÍCIOS (6 da categoria slug "eletronicos", 6 de "cosmeticos"; busque os ids em public.categories pelo slug). Todos com:
   - nome começando com "Exemplo · " (ex.: "Exemplo · Fone Bluetooth com cancelamento de ruído"), sem marcas reais nem nomes de produtos reais;
   - descricao original de 3 a 5 frases, escrita por você (não copie texto de loja nenhuma), em português simples;
   - ativo: false (NÃO aparece na loja até o dono ativar), destaque: false;
   - ncm de 8 dígitos coerente com o tipo (ex.: fones 85183000, carregador 85044010, caixa de som 85182100, smartwatch 85176299, cabo 85444200, power bank 85076000, batom 33041000, máscara de cílios 33042010, base 33049910, perfume 33030010, hidratante 33049990, esmalte 33043000), cfop "5102", origem 0;
   - 1 a 3 variações cada (ex.: cores, volumes), sku único "EX-" + 6 caracteres maiúsculos, preco_cents realista (entre 1990 e 39990), preco_de_cents null ou maior que o preço em ~20% em alguns, custo_cents ~55% do preço, estoque 5 a 30, peso_g, altura_cm, largura_cm, comprimento_cm realistas (> 0), ean null.
4) Fotos: 2 por produto, de bancos de imagem com licença livre para uso comercial (Unsplash ou Pexels). Coloque no script uma lista FIXA de URLs diretas de imagem (ex.: "https://images.unsplash.com/photo-XXXXXXXX?w=1200&q=80&fm=jpg") que você CONFERIU que existem e combinam com o produto (fone com foto de fone, batom com foto de batom). Para cada URL: baixe com fetch, exija status 200 e content-type image/jpeg|png|webp e tamanho < 5 MB; se falhar, pule a foto e avise no console (o produto segue com as fotos que deram certo).
   - Suba no Storage, bucket "produtos", caminho exatamente `${AAAA-MM}/${crypto.randomUUID()}.${ext}` (ext jpg/png/webp pelo content-type) — o servidor da loja só aceita esse formato. Pegue a URL pública com getPublicUrl.
5) Salve cada produto chamando a função do banco `admin_save_product` (rpc) com p_product = { nome, slug (gerado do nome, sem acento, minúsculo, hífens, e com sufixo "-exemplo"), descricao, category_id, brand_id: null, ncm, cfop, origem, ativo, destaque, variantes: [...], imagens: [{ url, alt }] }. Os nomes de campo das variantes: sku, nome, preco_cents, preco_de_cents, custo_cents, estoque, peso_g, altura_cm, largura_cm, comprimento_cm, ean.
6) Idempotente: se já existir produto com o mesmo slug, pule (não duplique). Opção --apagar remove todos os produtos cujo slug termina em "-exemplo" (chamando a função admin_delete_product com o id) e as fotos do Storage.
7) No fim, imprima um resumo: criados, pulados, fotos que falharam.

Entregue o arquivo completo e a lista das 24 URLs usadas com o produto de cada uma.
```

---

## G40 — Prazo de envio "em até 24 h" nas páginas

```
Projeto: loja Busca Agora (Next.js 16, Tailwind v4). Textos em português do Brasil, simples. Não mude layout, só o texto.

Decisão do dono (11/10): os pedidos são despachados em até 24 horas (1 dia útil) depois da confirmação do pagamento.

Tarefa: atualize SÓ estes arquivos para dizer isso de forma consistente, sem prometer prazo de entrega da transportadora (esse aparece no cálculo de frete):
- app/(loja)/termos/page.tsx — seção "Entrega": "Despachamos em até 24 horas (1 dia útil) depois da confirmação do pagamento. O prazo de entrega da transportadora aparece no cálculo do frete e conta a partir do despacho."
- app/(loja)/trocas/page.tsx — seção id="entrega" com o mesmo sentido.
- app/(loja)/sobre/page.tsx — um dos 3 cartões ou um parágrafo curto: "Despacho em até 24 h".
- emails/pagamento-aprovado.tsx — trocar "Você recebe o código de rastreio assim que o pedido sair." por algo como "Despachamos em até 24 horas. Você recebe o código de rastreio assim que o pedido sair."
- tests/unit/emails.test.tsx — se algum teste conferir o texto antigo, ajuste.

Nenhum outro arquivo. Entregue os arquivos completos.
```
