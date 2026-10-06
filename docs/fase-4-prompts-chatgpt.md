# Fase 4 — prompts para o ChatGPT (G11 a G15)

Mesmo esquema: uma conversa por prompt (GPT-6 Sol). Ele **só cria os arquivos listados**, não mexe em nenhum outro, não faz commit nem push, e no fim te passa o resumo. Comece pelo G11 e G12 (o G13 usa os tipos deles).

Bloco de contexto (já incluído em cada prompt):

> Projeto: loja virtual Busca Agora. Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, zod 4, Vitest 4. Sem "any", sem console.log, sem biblioteca nova. Textos da interface em português do Brasil; código e comentários em inglês. Importações com "@/". Ícones SVG de traço (estilo Lucide), nunca emoji. DINHEIRO SEMPRE EM CENTAVOS INTEIROS (8990 = R$ 89,90), nunca float; para mostrar use formatBRL(cents) de "@/lib/format". Classes de cor do Tailwind: ultramar, ultramar-700, ultramar-50, noite, lima, lima-300, fundo, borda, borda-forte, texto-2, texto-3, rosa-ink, rosa-tile, estoque. Fontes: font-display (Sora), font-sans (DM Sans). Alvos de toque ≥ 44 px, foco visível (outline-3 outline-offset-2 outline-ultramar), labels de verdade.

---

## G11 — Schemas do Melhor Envio

```
[cole o bloco de contexto]

Documentação oficial: https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos (POST /api/v2/me/shipment/calculate). Siga a documentação; não invente campos.

Tarefa: crie lib/shipping/types.ts, lib/shipping/melhorenvio/schemas.ts e tests/unit/melhorenvio-schemas.test.ts.

1) lib/shipping/types.ts (nosso contrato, independente de fornecedor):
export type ShippingItem = { variantId: string; quantidade: number; pesoG: number; alturaCm: number; larguraCm: number; comprimentoCm: number; precoCents: number };
export type ShippingOption = { servicoId: string; servico: string; transportadora: string; precoCents: number; prazoDias: number; prazoMin?: number; prazoMax?: number };
export type QuoteResult =
  | { ok: true; opcoes: ShippingOption[] }
  | { ok: false; motivo: "cep_invalido" | "sem_servico" | "indisponivel" };

2) lib/shipping/melhorenvio/schemas.ts:
- quoteRequestSchema (zod) do corpo enviado: { from: { postal_code: string 8 dígitos }, to: { postal_code }, products: [{ id: string, width: int, height: int, length: int (cm), weight: number (kg), insurance_value: number, quantity: int }], options?: { receipt: boolean, own_hand: boolean } }.
- quoteResponseSchema: array de itens. Cada item tem id (number), name (string), company { id, name, picture? }. Itens disponíveis trazem price/custom_price (string com ponto, ex.: "23.45"), delivery_time/custom_delivery_time (number), delivery_range/custom_delivery_range { min, max } opcionais. Itens indisponíveis trazem "error" (string) e não têm preço. Use .passthrough() ou ignore campos extras, sem quebrar.
- export function toShippingOptions(response: unknown): ShippingOption[]
  - Valida com quoteResponseSchema (se inválido, retorna []).
  - Ignora itens com "error".
  - Usa custom_price (cai para price se faltar) e custom_delivery_time (cai para delivery_time), e custom_delivery_range (cai para delivery_range).
  - Converte o preço de string "23.45" para centavos inteiros SEM float: separe por ".", reais*100 + centavos com padEnd(2,"0"). Aceite também "23" e "23.4". Preço inválido: descarta o item.
  - servicoId = String(id); servico = name; transportadora = company.name.
  - Ordena por precoCents crescente, desempate por prazoDias.
- export function reaisFromCents(cents: number): number — para insurance_value: devolve número com 2 casas (ex.: 8990 -> 89.9). Lance TypeError se cents não for inteiro seguro >= 0.

Testes (sem internet): resposta real de exemplo com 3 serviços (um com "error"), preço "23.45" -> 2345, "23" -> 2300, "23.4" -> 2340, custom_price preferido, ordenação, resposta fora do formato -> [].

Entregue só os 3 arquivos completos.
```

---

## G12 — Pacote da cotação

```
[cole o bloco de contexto]

Já existe (não recrie): lib/shipping/types.ts com ShippingItem = { variantId, quantidade, pesoG, alturaCm, larguraCm, comprimentoCm, precoCents }, e lib/shipping/melhorenvio/schemas.ts com reaisFromCents(cents).

Tarefa: crie lib/shipping/package.ts e tests/unit/shipping-package.test.ts.

export function toQuoteProducts(items: ShippingItem[]): Array<{ id: string; width: number; height: number; length: number; weight: number; insurance_value: number; quantity: number }>
- Um produto por item, com quantity = quantidade.
- Medidas em cm INTEIROS arredondando para cima (Math.ceil), com mínimos dos Correios: altura 2, largura 11, comprimento 16.
- weight em kg com 3 casas, arredondando para cima o grama (pesoG 300 -> 0.3; 1 -> 0.001), mínimo 0.001.
- insurance_value = reaisFromCents(precoCents) (valor unitário).
- Lança RangeError se a lista estiver vazia, se quantidade < 1 ou não inteira, ou se alguma medida/peso for <= 0.

export function cartFingerprint(items: Pick<ShippingItem, "variantId" | "quantidade">[]): string
- String estável para chave de cache: ordena por variantId e junta "id:qtd" com "|". A ordem de entrada não pode mudar o resultado.

Testes: mínimos aplicados, arredondamentos, kg, seguro em reais, erros, fingerprint estável com ordem diferente.

Entregue só os 2 arquivos completos.
```

---

## G13 — Componente de frete

```
[cole o bloco de contexto]

Já existem (não recrie): lib/br/cep.ts (formatCep, cepSchema), lib/shipping/types.ts (ShippingOption, QuoteResult), lib/format.ts (formatBRL).

Tarefa: crie components/loja/shipping-quote.tsx, Client Component ("use client"), export function ShippingQuote.

Props: {
  itens: { variantId: string; quantidade: number }[];   // o que cotar
  cepInicial?: string;                                  // ex.: CEP do endereço principal
  onSelect?: (opcao: ShippingOption) => void;           // checkout usa; produto e carrinho não
  selecionadoId?: string;
}

Comportamento:
- Bloco com fundo bg-fundo, cantos 18px, padding 18px (igual ao design de docs/design/Produto.dc.html, anexe se puder).
- Label "Calcular frete e prazo" com ícone de alfinete de mapa; campo CEP (máscara formatCep, inputMode numeric, autocomplete postal-code, altura 46px, cantos 12px) + botão "Calcular" (fundo noite, texto branco, 46px).
- Ao enviar: POST /api/frete com JSON { cep: "8 dígitos", itens } (a rota é do projeto). Resposta: QuoteResult.
- Estados: carregando ("Calculando..." com aria-live), sucesso (lista de opções: nome do serviço em bold + "Chega em até N dias úteis" + preço em Sora bold à direita), cep_invalido ("CEP inválido. Confira os números."), sem_servico ("Nenhuma transportadora entrega nesse CEP para esses produtos."), indisponivel ("Não conseguimos calcular agora. Tente de novo em instantes."), HTTP 429 ("Muitas consultas seguidas. Espere um pouco e tente de novo.").
- Com onSelect: as opções viram radio buttons (fieldset + legend "Escolha o frete"), cada uma com 44px+, a selecionada com borda ultramar. Sem onSelect: só lista.
- Guarda o último CEP usado em localStorage ("ba_cep") e usa como valor inicial se não vier cepInicial (envolva o acesso ao localStorage em try/catch).
- Se itens mudar (ex.: quantidade no carrinho) e já houver resultado, refaz a cotação com o mesmo CEP (debounce de 400 ms).
- Cancela a requisição anterior com AbortController.

Entregue só o arquivo completo.
```

---

## G14 — Linha e resumo do carrinho

```
[cole o bloco de contexto]

Tarefa: crie 2 arquivos.

1) components/carrinho/cart-line.tsx ("use client") — export function CartLine
Props: {
  item: { id: string; slug: string; nome: string; varianteNome: string; precoCents: number; quantidade: number; estoque: number; imagemUrl: string | null; categoria: "eletronicos" | "cosmeticos" };
  setQuantity: (formData: FormData) => Promise<void>;   // Server Action do projeto; campos: itemId, quantidade
  remove: (formData: FormData) => Promise<void>;        // campos: itemId
}
- Layout: foto 88x88 (cantos 16px; sem foto: placa ciano-tile/rosa-tile conforme categoria com ícone de traço), nome (link para /p/{slug}, 2 linhas no máximo), variante em texto-2, preço unitário formatado.
- Stepper de quantidade igual ao do produto (bordas borda-forte 1.5px, cantos 14px, botões 44x44 "−" e "+" com aria-label "Diminuir quantidade de {nome}" / "Aumentar..."), mínimo 1, máximo = min(estoque, 10). Cada clique envia um <form action={setQuantity}> com itemId e a nova quantidade; use useTransition/useOptimistic para atualizar na hora e voltar se falhar.
- Se estoque === 0: mostra "Esgotado" em rosa-ink e desabilita o stepper. Se quantidade > estoque: aviso "Só {estoque} em estoque" em rosa-ink.
- Botão "Remover" (texto rosa-ink, 44px) num <form action={remove}>.
- Total da linha (precoCents * quantidade) em Sora bold à direita no desktop, embaixo no celular.

2) components/carrinho/cart-summary.tsx (Server Component) — export function CartSummary
Props: { subtotalCents: number; freteCents?: number | null; quantidadeItens: number; children?: React.ReactNode }
- Card branco, borda borda, cantos 22px (md 28px), padding 24px. Título "Resumo".
- Linhas: "Produtos ({n})" e subtotal; "Frete" e valor ou "Calcule abaixo" em texto-2; separador; "Total" em Sora 800 28px. O total é subtotal + frete (frete ausente conta como 0 e mostra "+ frete").
- "em até 12x no cartão · ou no Pix, aprovado na hora" em texto-2 14px.
- children logo abaixo (o projeto coloca ali o componente de frete e o botão de seguir).

Entregue só os 2 arquivos completos.
```

---

## G15 — Botões de comprar

```
[cole o bloco de contexto]

Tarefa: crie components/loja/add-to-cart.tsx ("use client"), export function AddToCart.

Props: {
  variantId: string;
  quantidade: number;
  disponivel: boolean;                                    // false = esgotado
  addToCart: (formData: FormData) => Promise<{ ok: boolean; message?: string; cartCount?: number }>;  // Server Action do projeto; campos: variantId, quantidade
}

- Dois botões empilhados, largura total, 56px, cantos 16px, Sora 700 17px:
  - "Comprar agora" (fundo ultramar, texto branco): chama addToCart e, se ok, navega para /carrinho (useRouter().push).
  - "Adicionar ao carrinho" (borda 2px ultramar, texto ultramar, fundo branco): chama addToCart e mostra "Adicionado ✓" por 2 s (use um SVG de check, não o caractere ✓).
- Enquanto envia: botões desabilitados, aria-busy.
- Erro (ok false): mensagem em role="alert", texto rosa-ink, abaixo dos botões.
- disponivel false: botão único desabilitado "Esgotado".
- Avisos para leitor de tela num aria-live="polite" ("Produto adicionado ao carrinho").
- Dispara window.dispatchEvent(new CustomEvent("ba:carrinho", { detail: { count: cartCount } })) quando ok e cartCount vier, para o ícone do header se atualizar.

Entregue só o arquivo completo.
```
