# Fase 6 — prompts para o ChatGPT (G31 a G35)

Mesmo esquema: uma conversa por prompt. Ele **só cria os arquivos listados**, não mexe em nenhum outro, não instala nada, não faz commit nem push, e no fim te passa o resumo. Branch atual: `fase-6-automacao`. As bibliotecas `@react-pdf/renderer` e `qrcode` (+ `@types/qrcode`) já estão instaladas (o Claude Code instala antes). Os 5 são independentes.

Bloco de contexto (já incluído em cada prompt):

> Projeto: loja virtual Busca Agora (eletrônicos e cosméticos, um vendedor só, Brasil). Next.js 16 (App Router), React 19, TypeScript strict, zod 4, Vitest 4. Sem "any", sem console.log, sem biblioteca nova. Textos em português do Brasil; código e comentários em inglês. Importações com "@/". DINHEIRO SEMPRE EM CENTAVOS INTEIROS no nosso código (8990 = R$ 89,90); APIs externas que pedem reais recebem `cents / 100` só na hora de montar o JSON. Datas exibidas em America/Sao_Paulo. Funções puras sempre que possível (sem rede, sem process.env): quem chama a API é o Claude Code. Antes de usar qualquer campo de API externa, confira na documentação oficial atual; se algo divergir do que está aqui, siga a documentação e anote a diferença no resumo final. NUNCA invente endpoint ou campo.

---

## G31 — Resumo do pedido em PDF 10x15

```
[cole o bloco de contexto]

Tarefa: crie lib/pdf/order-summary.tsx e tests/unit/order-summary.test.tsx.

1) Tipos e documento (@react-pdf/renderer):
export type OrderSummaryData = {
  numero: string;              // "BA-000123"
  criadoEm: string;            // ISO
  cliente: { nome: string; telefone: string | null };
  endereco: { rua: string; numero: string; complemento: string | null; bairro: string; cidade: string; uf: string; cep: string };
  itens: { nome: string; sku: string; quantidade: number }[];
  freteServico: string | null; // "PAC", "SEDEX"
  transportadora: string | null;
  notaManual: boolean;         // true: nota fiscal ainda precisa ser emitida à mão
  adminUrl: string;            // link do pedido no admin (vira QR code)
};
export function OrderSummaryDocument({ data, qrDataUrl }: { data: OrderSummaryData; qrDataUrl: string }): JSX do react-pdf.
export async function renderOrderSummary(data: OrderSummaryData): Promise<Buffer> — gera o QR com `QRCode.toDataURL(data.adminUrl, { margin: 0, width: 240, errorCorrectionLevel: "M" })` (pacote qrcode) e devolve `renderToBuffer(<OrderSummaryDocument .../>)`.

2) Layout (impressora térmica, PRETO E BRANCO, sem cinza fino, sem imagem colorida):
- Página exatamente 10 x 15 cm: size={[283.46, 425.2]} (pontos), margem 14pt.
- Só fontes embutidas do PDF (Helvetica e Helvetica-Bold): nada de baixar fonte.
- Topo: "BUSCA AGORA" em Helvetica-Bold 16pt e, à direita, o número do pedido em 18pt bold; linha preta de 1.5pt.
- Data e hora do pedido (America/Sao_Paulo, "08/10/2026 14:32"); serviço de frete e transportadora.
- Cliente: nome; telefone se houver. Endereço em até 3 linhas, CEP formatado 00000-000.
- Itens: tabela com Qtd (negrito, 14pt), SKU e nome (corta com "…" para caber em 2 linhas no máximo). Se houver mais itens do que cabem, quebra para uma 2ª página com o mesmo cabeçalho (wrap do react-pdf).
- Se notaManual: caixa com borda preta grossa "EMITIR NOTA FISCAL À MÃO".
- Rodapé: QR code 70x70pt com "Abrir no painel" ao lado e o total de itens ("3 itens").
- Nenhum preço no papel (vai dentro da caixa).

3) Teste (Vitest, ambiente node): renderOrderSummary com dados fictícios devolve Buffer que começa com "%PDF"; com 40 itens não lança erro e gera mais de uma página (procure "/Type /Page" no buffer como string latin1 e conte >= 2); notaManual true contém o texto "EMITIR NOTA FISCAL" (o react-pdf pode comprimir texto: se não der para achar no buffer, teste OrderSummaryDocument renderizando com renderToString do react-pdf ou verifique pela função que monta as linhas — explique a escolha).

Entregue os 2 arquivos completos.
```

---

## G32 — Respostas do Melhor Envio (etiqueta e rastreio)

```
[cole o bloco de contexto]

Documentação oficial: https://docs.melhorenvio.com.br (seções "Inserir fretes no carrinho", "Compra de etiquetas" / checkout, "Geração de etiquetas", "Impressão de etiquetas", "Rastreio de envios").

Tarefa: crie lib/shipping/melhorenvio/label-schemas.ts e tests/unit/melhorenvio-label-schemas.test.ts.

Para cada resposta, um schema zod com só os campos que usamos (passthrough no resto) e uma função parse que devolve um resultado tipado ou lança Error com mensagem curta em português (sem incluir o corpo inteiro da resposta, que pode ter dados pessoais):

1) POST /api/v2/me/cart → parseCartResponse(json): { cartId: string; protocolo: string | null; status: string }  (campo id da ordem criada).
2) POST /api/v2/me/shipment/checkout (body { orders: [cartId] }) → parseCheckoutResponse(json, cartId): { compraId: string; status: string } — confirme que o cartId aparece entre as ordens compradas; senão lança "Compra não incluiu a etiqueta".
3) POST /api/v2/me/shipment/generate (body { orders: [id] }) → parseGenerateResponse(json, id): { ok: boolean; mensagem: string | null } — a resposta é um objeto indexado pelo id da ordem.
4) POST /api/v2/me/shipment/print (body { mode: "public", orders: [id] }) → parsePrintResponse(json): { url: string } (URL https do PDF).
5) POST /api/v2/me/shipment/tracking (body { orders: [ids] }) → parseTrackingResponse(json): Record<string, { status: string; rastreio: string | null; postadoEm: string | null; entregueEm: string | null; canceladoEm: string | null }> — mapeie os campos de data e o código de rastreio conforme a documentação (tracking / melhorenvio_tracking: use o código da transportadora quando houver).
6) export function trackingToOrderStatus(t): "shipped" | "delivered" | "canceled" | null — regra: delivered/entregueEm → "delivered"; posted/postadoEm → "shipped"; canceled → "canceled"; qualquer outro → null.
7) export function meErrorMessage(status: number, json: unknown): string — mensagem curta para o admin a partir de erros 4xx do Melhor Envio (ex.: saldo insuficiente, CEP inválido, token sem permissão), sem dados pessoais; desconhecido → "Melhor Envio recusou (HTTP {status})".

Testes com respostas de exemplo copiadas do formato da documentação (dados fictícios): casos felizes, campo faltando, cartId fora da compra, generate com status false, tracking postado/entregue/cancelado/pendente, mensagem de saldo insuficiente.

Entregue os 2 arquivos completos.
```

---

## G33 — Pedido de etiqueta (carrinho do Melhor Envio)

```
[cole o bloco de contexto]

Documentação oficial: https://docs.melhorenvio.com.br — "Inserir fretes no carrinho" (POST /api/v2/me/cart).

Tarefa: crie lib/shipping/melhorenvio/label-request.ts e tests/unit/melhorenvio-label-request.test.ts.

export type LabelParty = { nome: string; telefone: string | null; email: string | null; documento: string /* CPF 11 ou CNPJ 14 dígitos */; rua: string; numero: string; complemento: string | null; bairro: string; cidade: string; uf: string; cep: string /* 8 dígitos */ };
export type LabelItem = { nome: string; quantidade: number; precoCents: number; pesoG: number; alturaCm: number; larguraCm: number; comprimentoCm: number };
export type LabelInput = { numero: string /* BA-000123 */; servicoId: number; remetente: LabelParty; destinatario: LabelParty; itens: LabelItem[]; notaChave: string | null /* 44 dígitos ou null */ };

1) export function packageFor(itens: LabelItem[]): { height: number; width: number; length: number; weight: number }
- Uma caixa: altura = soma de (altura × quantidade), largura = maior largura, comprimento = maior comprimento, peso em kg = soma(pesoG × quantidade)/1000.
- Aplique os mínimos aceitos pelos Correios/Melhor Envio conforme a documentação (normalmente 2 × 11 × 16 cm e peso mínimo); arredonde medidas para cima em cm inteiro e peso com 3 casas.

2) export function buildCartRequest(input: LabelInput): objeto pronto para JSON.stringify com: service (servicoId), from e to (name, phone, email, document ou company_document conforme o tamanho, address, number, complement, district, city, state_abbr, postal_code — sem máscara), products (name, quantity, unitary_value em reais), volumes [packageFor], options { insurance_value (soma dos itens em reais), receipt: false, own_hand: false, reverse: false, non_commercial: notaChave === null (declaração de conteúdo quando não há nota), invoice: { key } só quando notaChave existir, platform: "Busca Agora", tags: [{ tag: numero }] }.
- Telefones e documentos só com dígitos. Nome do produto cortado em 255. Lança Error em português se faltar documento do remetente ou destinatário, CEP sem 8 dígitos, item sem peso/medidas ou nenhum item.

3) Testes: caixa com 2 itens empilhados; mínimos aplicados para item pequeno; CNPJ vira company_document; non_commercial true sem nota e invoice.key com nota; valores em reais (8990 → 89.9) sem erro de float (use Math.round(cents)/100); erros de validação.

Entregue os 2 arquivos completos.
```

---

## G34 — Trabalhos de impressão do PrintNode

```
[cole o bloco de contexto]

Documentação oficial: https://www.printnode.com/en/docs/api/curl (Print jobs: POST https://api.printnode.com/printjobs, autenticação Basic com a API key como usuário).

Tarefa: crie lib/printer/printnode-request.ts e tests/unit/printnode-request.test.ts.

1) export type PrintDoc = { titulo: string; pdf: { base64: string } | { url: string } };
export function buildPrintJob(printerId: number, doc: PrintDoc, idempotencyKey: string): { body: object; headers: Record<string, string> }
- body: { printerId, title (máx. 80 caracteres), contentType "pdf_base64" ou "pdf_uri", content, source: "Busca Agora", options: { fit_to_page: true, paper: tamanho 10x15 se a documentação permitir nomear o papel; senão deixe sem e explique }, qty: 1 }.
- headers: a documentação do PrintNode aceita um cabeçalho de idempotência para não imprimir duas vezes quando a requisição é repetida: confira o nome exato (ex.: "X-Idempotency-Key") e use; se não existir, retorne headers vazio e explique no resumo.
2) export function basicAuthHeader(apiKey: string): string — "Basic " + base64(apiKey + ":").
3) export function parsePrintJobResponse(json: unknown): number — a API devolve o id do trabalho (número); senão lança Error "PrintNode não aceitou a impressão".
4) export function printNodeErrorMessage(status: number, json: unknown): string — 401 "Chave do PrintNode inválida", 404 impressora não encontrada, 429 limite de impressões, outro "PrintNode recusou (HTTP n)"; nunca inclui a chave.
5) export const PRINT_ORDER = ["resumo", "nota", "etiqueta"] as const; export function orderedDocs(docs: Partial<Record<(typeof PRINT_ORDER)[number], PrintDoc>>): PrintDoc[] — devolve na ordem resumo, nota (se houver), etiqueta.

Testes: base64 e url; título cortado; header de autenticação; ordem com e sem nota; resposta numérica e inválida; mensagens de erro sem a chave.

Entregue os 2 arquivos completos.
```

---

## G35 — Cartão "Envio" no admin

```
[cole o bloco de contexto]

Visual do painel: Tailwind v4 com as cores ultramar (#3324F5), noite (#0A0F3D), lima (#C6FF3D), fundo, borda, texto-2, ciano-tile, ciano-ink, rosa-tile, rosa-ink; cartões brancos border-borda cantos 22px p-5 md:p-7; botões min-h-12 cantos 14px; labels claros para um usuário NÃO técnico (o dono da loja). Ícones SVG de traço, nunca emoji.

Tarefa: crie components/admin/shipment-card.tsx (Server Component, sem "use client").

export function ShipmentCard(props: {
  status: "pending_payment" | "paid" | "invoiced" | "label_ready" | "printed" | "shipped" | "delivered" | "canceled" | "refunded";
  servico: string | null; transportadora: string | null;
  rastreio: string | null; rastreioUrl: string | null;
  meStatus: string | null;                 // status no Melhor Envio (pending, released, posted, delivered...)
  etiquetaUrl: string | null;              // link temporário do PDF da etiqueta
  resumoUrl: string | null;                // link temporário do PDF do resumo
  notaManual: boolean;                     // nota precisa ser emitida à mão
  erroEtiqueta: string | null;             // última falha da fila de etiqueta, para mostrar
})

- Título "Envio". Linha com serviço e transportadora.
- Uma "trilha" simples de 4 passos para o dono entender onde está: Etiqueta comprada → Impresso → Postado → Entregue, marcando os concluídos pelo status (label_ready = 1 passo, printed = 2, shipped = 3, delivered = 4). Cancelado/estornado: aviso rosa "Pedido cancelado: não envie.".
- Se notaManual: aviso destacado (cartão rosa-tile, rosa-ink) "Emita a nota fiscal deste pedido à mão antes de despachar."
- Rastreio: código grande, selecionável, e link "Ver rastreio" (target _blank, rel noopener noreferrer, texto escondido "(abre em nova aba)") se rastreioUrl.
- Botões-link (a com download/target _blank): "Baixar etiqueta (PDF)" e "Baixar resumo (PDF)" quando houver URL; sem URL, texto "Etiqueta ainda não gerada".
- erroEtiqueta: caixa rosa com "A etiqueta não saiu: {erro}" e a dica "Confira o saldo da carteira do Melhor Envio e use Tentar de novo na fila abaixo."
- meStatus traduzido: pending "Aguardando pagamento no Melhor Envio", released "Etiqueta liberada", posted "Postado", delivered "Entregue", canceled "Cancelado", outro → o próprio texto.

Entregue o arquivo completo.
```
