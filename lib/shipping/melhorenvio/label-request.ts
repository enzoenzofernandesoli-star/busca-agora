export type LabelParty = {
  nome: string;
  telefone: string | null;
  email: string | null;
  documento: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
};
export type LabelItem = {
  nome: string;
  quantidade: number;
  precoCents: number;
  pesoG: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
};
export type LabelInput = {
  numero: string;
  servicoId: number;
  remetente: LabelParty;
  destinatario: LabelParty;
  itens: LabelItem[];
  notaChave: string | null;
};
function validateItems(items: LabelItem[]) {
  if (!items.length) throw new Error("Informe ao menos um item");
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantidade) || item.quantidade < 1)
      throw new Error("Quantidade inválida");
    if (!Number.isSafeInteger(item.precoCents) || item.precoCents < 0)
      throw new Error("Preço deve ser inteiro em centavos");
    if (
      [item.pesoG, item.alturaCm, item.larguraCm, item.comprimentoCm].some(
        (n) => !Number.isFinite(n) || n <= 0,
      )
    )
      throw new Error("Informe peso e medidas de todos os itens");
  }
}
export function packageFor(itens: LabelItem[]): {
  height: number;
  width: number;
  length: number;
  weight: number;
} {
  validateItems(itens);
  const grams = itens.reduce((n, i) => n + i.pesoG * i.quantidade, 0);
  const height = itens.reduce((n, i) => n + i.alturaCm * i.quantidade, 0);
  const width = Math.max(...itens.map((i) => i.larguraCm));
  const length = Math.max(...itens.map((i) => i.comprimentoCm));
  if (![grams, height, width, length].every(Number.isFinite))
    throw new Error("Peso ou medidas excedem o limite");
  return {
    height: Math.max(2, Math.ceil(height)),
    width: Math.max(11, Math.ceil(width)),
    length: Math.max(16, Math.ceil(length)),
    weight: Math.max(1, Math.ceil(grams)) / 1000,
  };
}
function party(p: LabelParty, label: string) {
  const documento = p.documento.replace(/\D/g, "");
  if (!/^(\d{11}|\d{14})$/.test(documento))
    throw new Error(`Informe documento válido do ${label}`);
  const cep = p.cep.replace(/\D/g, "");
  if (!/^\d{8}$/.test(cep))
    throw new Error(`CEP do ${label} deve ter 8 dígitos`);
  return {
    name: p.nome,
    phone: p.telefone?.replace(/\D/g, "") ?? null,
    email: p.email,
    ...(documento.length === 14
      ? { company_document: documento }
      : { document: documento }),
    address: p.rua,
    number: p.numero,
    complement: p.complemento,
    district: p.bairro,
    city: p.cidade,
    state_abbr: p.uf,
    postal_code: cep,
  };
}
export function buildCartRequest(input: LabelInput) {
  validateItems(input.itens);
  if (!Number.isSafeInteger(input.servicoId) || input.servicoId < 1)
    throw new Error("Serviço de frete inválido");
  if (input.notaChave !== null && !/^\d{44}$/.test(input.notaChave))
    throw new Error("Chave da nota deve ter 44 dígitos");
  let total = 0;
  for (const item of input.itens) {
    const line = item.precoCents * item.quantidade;
    if (!Number.isSafeInteger(line) || !Number.isSafeInteger(total + line))
      throw new Error("Valor dos itens excede o limite");
    total += line;
  }
  return {
    service: input.servicoId,
    from: party(input.remetente, "remetente"),
    to: party(input.destinatario, "destinatário"),
    products: input.itens.map((item) => ({
      name: item.nome.slice(0, 255),
      quantity: item.quantidade,
      unitary_value: item.precoCents / 100,
    })),
    volumes: [packageFor(input.itens)],
    options: {
      insurance_value: total / 100,
      receipt: false,
      own_hand: false,
      reverse: false,
      non_commercial: input.notaChave === null,
      ...(input.notaChave ? { invoice: { key: input.notaChave } } : {}),
      platform: "Busca Agora",
      tags: [{ tag: input.numero }],
    },
  };
}
