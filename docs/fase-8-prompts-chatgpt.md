# Fase 8 — prompts para o ChatGPT (G16 a G20)

Mesmo esquema: uma conversa por prompt (GPT-6 Sol). Ele **só cria os arquivos listados**, não mexe em nenhum outro, não faz commit nem push, e no fim te passa o resumo. A branch atual é `fase-8-admin`. Comece pelo G16 (os outros usam os tipos dele).

Bloco de contexto (já incluído em cada prompt):

> Projeto: loja virtual Busca Agora, painel administrativo para um usuário NÃO técnico (o dono). Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, zod 4, Vitest 4. Sem "any", sem console.log, sem biblioteca nova. Textos da interface em português do Brasil, simples e diretos; código e comentários em inglês. Importações com "@/". Ícones SVG de traço (estilo Lucide), nunca emoji. DINHEIRO SEMPRE EM CENTAVOS INTEIROS (8990 = R$ 89,90), nunca float; para mostrar use formatBRL(cents) de "@/lib/format"; para ler o que o usuário digita em reais use reaisToCents(texto) de "@/lib/catalog/filters" (aceita "89,90", "1.299,90", devolve number | undefined). Classes de cor do Tailwind: ultramar, ultramar-700, ultramar-50, noite, lima, lima-300, fundo, borda, borda-forte, texto-2, texto-3, rosa-ink, rosa-tile, estoque, ciano-tile, ciano-ink. Fontes: font-display (Sora), font-sans (DM Sans). Cartões brancos com borda borda e cantos 22px; botões com cantos 14px e altura mínima 48px. Alvos de toque ≥ 44 px, foco visível (outline-3 outline-offset-2 outline-ultramar), labels de verdade em todo campo.

---

## G16 — Schema do produto

```
[cole o bloco de contexto]

Tarefa: crie lib/admin/product-schema.ts e tests/unit/product-schema.test.ts.

1) export function slugify(nome: string): string
- minúsculas, sem acento (normalize NFD e remova diacríticos), só [a-z0-9] separados por "-", sem "-" no começo/fim, no máximo 80 caracteres sem cortar no meio de um "-" final.

2) variantSchema (zod) — campos chegam como string do formulário:
{ id?: uuid; sku: string 1..40 (A-Z 0-9 e "-", convertido para maiúsculas); nome: string 0..60 (ex.: "Preto", "128 GB"); preco: reais -> preco_cents inteiro > 0 (use reaisToCents; mensagem "Informe o preço, ex.: 89,90"); precoDe: opcional, reais -> preco_de_cents, e se vier tem que ser MAIOR que o preço (mensagem "O preço 'de' precisa ser maior que o preço de venda"); custo: opcional, reais -> custo_cents >= 0; estoque: inteiro 0..99999; pesoG: inteiro 1..30000 ("Peso em gramas"); alturaCm, larguraCm, comprimentoCm: número > 0 e <= 200, aceitando vírgula ("2,5"), com no máximo 1 casa; ean: opcional, 8 a 14 dígitos }.
Saída com os nomes do banco: { id?, sku, nome, preco_cents, preco_de_cents: number | null, custo_cents: number | null, estoque, peso_g, altura_cm, largura_cm, comprimento_cm, ean: string | null }.

3) productSchema (zod):
{ id?: uuid; nome: 3..120; slug: opcional (se vazio, slugify(nome)); descricao: 0..5000; categoryId: uuid ("Escolha a categoria"); brandId: opcional uuid; ncm: exatamente 8 dígitos (aceita "8518.30.00" e remove os pontos; mensagem "NCM tem 8 dígitos, ex.: 8518.30.00"); cfop: 4 dígitos, padrão "5102"; origem: inteiro 0..8, padrão 0; ativo: checkbox ("on" -> true, ausente -> false); destaque: idem; variantes: array de variantSchema com pelo menos 1 ("Cadastre pelo menos uma variação") e SKUs sem repetição ("SKU repetido: X") }.
Saída com nomes do banco: { id?, nome, slug, descricao, category_id, brand_id: string | null, ncm, cfop, origem, ativo, destaque, variantes }.

4) export function parseProductForm(formData: FormData) — lê os campos simples pelo nome e as variações de um campo hidden "variantes" com JSON (array de objetos com os nomes do item 2 como strings). Devolve o safeParse do productSchema. JSON inválido -> erro "Variações inválidas".

Testes: slugify com acentos e símbolos; preço "89,90" -> 8990 e "1.299,90" -> 129990; precoDe menor que preço falha; NCM com pontos; medidas "2,5"; SKU repetido; sem variações; checkbox ausente -> false; JSON quebrado.

Entregue só os 2 arquivos completos.
```

---

## G17 — Fotos do produto

```
[cole o bloco de contexto]

Tarefa: crie components/admin/image-uploader.tsx ("use client"), export function ImageUploader.

Props:
type AdminImage = { id?: string; url: string; path: string; alt: string };
{
  value: AdminImage[];                       // fotos atuais, na ordem
  onChange: (images: AdminImage[]) => void;  // nova lista/ordem
  requestUpload: (file: { name: string; type: string; size: number }) => Promise<{ ok: true; path: string; signedUrl: string; publicUrl: string } | { ok: false; message: string }>;  // Server Action do projeto
  max?: number;                              // padrão 8
  nomeProduto: string;                       // para o alt padrão
}

Comportamento:
- Área "Arraste fotos aqui ou clique para escolher" (input type=file multiple accept="image/jpeg,image/png,image/webp", label de verdade). Recusa no navegador arquivos acima de 5 MB ou de outro tipo, com mensagem clara.
- Para cada arquivo: chama requestUpload; se ok, faz PUT do arquivo no signedUrl (fetch com body = file e header "Content-Type": file.type); se o PUT der certo, adiciona { url: publicUrl, path, alt: nomeProduto } ao fim. Mostra progresso simples ("Enviando 2 de 3...") com aria-live. Erros por arquivo não param os outros.
- Grade de miniaturas 112x112 (cantos 16px, object-cover, next/image com unoptimized). A primeira tem o selo "Capa".
- Reordenar: arrastar e soltar (HTML5 drag and drop nativo) E, para teclado/celular, botões "Mover para a esquerda"/"Mover para a direita" (44px, aria-label com a posição). Botão "Remover" (com aria-label "Remover foto N").
- Campo de texto alternativo por foto (label "Descrição da foto N", opcional).
- Não envia nada ao servidor além de requestUpload; quem salva a ordem é o formulário do projeto (o componente chama onChange).
- Limite: com max fotos, a área de envio some e aparece "Máximo de N fotos".

Entregue só o arquivo completo.
```

---

## G18 — Variações

```
[cole o bloco de contexto]

Já existe (não recrie): lib/admin/product-schema.ts (variantSchema).

Tarefa: crie components/admin/variant-editor.tsx ("use client"), export function VariantEditor.

Props:
type VariantDraft = { id?: string; sku: string; nome: string; preco: string; precoDe: string; custo: string; estoque: string; pesoG: string; alturaCm: string; larguraCm: string; comprimentoCm: string; ean: string };
{ initial: VariantDraft[]; errors?: Partial<Record<string, string[]>>; name?: string /* padrão "variantes" */ }

- Lista de cartões, um por variação (no celular empilhado; no desktop campos em grade). Campos com label: "Nome da variação (cor, tamanho...)", "SKU", "Preço (R$)", "Preço 'de' (R$, opcional)", "Custo (R$, opcional — não aparece para o cliente)", "Estoque", "Peso (g)", "Altura (cm)", "Largura (cm)", "Comprimento (cm)", "Código de barras (EAN, opcional)". Preço/custo com inputMode decimal; estoque/peso numeric.
- Botão "Adicionar variação" (contorno ultramar) que copia peso e medidas da última variação (o comum é mudar só a cor) e deixa SKU/nome em branco. Botão "Remover" por variação (desabilitado se só houver uma).
- Mantém o estado e grava tudo num <input type="hidden" name={name} value={JSON.stringify(drafts)} /> para o formulário do projeto enviar.
- Mostra errors (chaves como "variantes.0.preco") embaixo do campo certo, em rosa-ink.
- Dica fixa no topo: "Peso e medidas da embalagem pronta para envio. Eles definem o frete."

Entregue só o arquivo completo.
```

---

## G19 — Estrutura do painel

```
[cole o bloco de contexto]

Tarefa: crie 3 arquivos.

1) components/admin/admin-shell.tsx ("use client") — export function AdminShell({ children, nome }: { children: React.ReactNode; nome: string })
- Desktop (md+): menu lateral fixo 248px fundo noite, texto branco: logo "/brand/logo-d-branco.svg" (next/image unoptimized, altura 28), itens com ícone de traço: Painel (/admin), Pedidos (/admin/pedidos), Produtos (/admin/produtos), Categorias (/admin/categorias), Banners (/admin/banners), Clientes (/admin/clientes), Configurações (/admin/configuracoes). Item atual com fundo ultramar (usePathname; /admin só exato, os outros por prefixo), aria-current="page". No rodapé do menu: "Ver a loja" (link /, abre na mesma aba) e "Sair" (<form action="/auth/sair" method="post"><button>).
- Celular: barra superior noite com logo e botão "Menu" (aria-expanded, aria-controls) que abre o menu como gaveta por cima (fecha com Esc, clique fora e ao navegar; foco preso dentro enquanto aberta).
- Conteúdo: fundo bg-fundo, padding 24px (md 40px), largura máxima 1200px. Topo com "Olá, {primeiro nome}".

2) components/admin/stat-card.tsx (Server Component) — export function StatCard({ titulo, valor, detalhe, href, tom = "neutro" }: { titulo: string; valor: string; detalhe?: string; href?: string; tom?: "neutro" | "alerta" | "ok" })
- Cartão branco; valor em Sora 800 32px; tom alerta = borda e valor rosa-ink; ok = estoque. Com href o cartão inteiro é um link com "Ver →".

3) components/admin/data-table.tsx (Server Component) — export function DataTable<T>({ colunas, linhas, chave, vazio }: { colunas: { titulo: string; render: (linha: T) => React.ReactNode; className?: string }[]; linhas: T[]; chave: (linha: T) => string; vazio: string })
- <table> de verdade com <caption className="sr-only">, cabeçalho texto-2 13px bold; no celular (< md) cada linha vira um cartão empilhado com "título: valor" (use classes responsivas, sem JS). Sem linhas: mostra vazio.

Entregue só os 3 arquivos completos.
```

---

## G20 — Pedido: linha do tempo, status e confirmação

```
[cole o bloco de contexto]

Tarefa: crie 3 arquivos.

1) components/admin/status-badge.tsx (Server Component) — export function StatusBadge({ status }: { status: "pending_payment" | "paid" | "invoiced" | "label_ready" | "printed" | "shipped" | "delivered" | "canceled" | "refunded" })
- Selo (cantos 999px, 13px bold) com texto em português: Aguardando pagamento, Pago, Nota emitida, Etiqueta pronta, Impresso, Enviado, Entregue, Cancelado, Estornado. Cores com contraste ≥ 4.5:1 (ex.: aguardando = fundo #FFF7E0 texto #8A5A00; pago/nota/etiqueta/impresso = fundo ultramar-50 texto ultramar; enviado = fundo ciano-tile texto ciano-ink; entregue = fundo #ECFDF3 texto estoque; cancelado/estornado = fundo rosa-tile texto rosa-ink). Também export const STATUS_LABEL com os textos.

2) components/admin/order-timeline.tsx (Server Component) — export function OrderTimeline({ eventos }: { eventos: { id: string; evento: string; detalhe: Record<string, unknown>; created_at: string }[] })
- Lista vertical (<ol>) do mais antigo para o mais novo, com bolinha e linha. Data/hora em America/Sao_Paulo ("07/10/2026 14:32").
- Texto: evento "status_changed" -> "Status: {de} → {para}" usando STATUS_LABEL; outros eventos mostram o próprio nome com a primeira letra maiúscula e "_" virando espaço. Se detalhe tiver "motivo" ou "observacao" (string), mostra embaixo em texto-2.

3) components/admin/confirm-dialog.tsx ("use client") — export function ConfirmDialog({ gatilho, titulo, texto, confirmarLabel, perigo = false, action, campos }: { gatilho: string; titulo: string; texto: string; confirmarLabel: string; perigo?: boolean; action: (formData: FormData) => Promise<{ ok: boolean; message?: string }>; campos?: Record<string, string> })
- Botão gatilho (perigo: contorno rosa-ink; senão contorno ultramar) que abre <dialog> nativo com showModal. Esc e "Voltar" fecham. Foco no botão "Voltar" ao abrir (o mais seguro), volta ao gatilho ao fechar.
- Ao confirmar: envia um <form> com os campos hidden de "campos" para action; botões desabilitados enquanto envia; resultado ok fecha e mostra aviso role="status" "Feito."; erro mostra message em role="alert" dentro do diálogo.
- Campo opcional "Motivo (aparece no histórico do pedido)" name="motivo", até 200 caracteres.

Entregue só os 3 arquivos completos.
```
