export type EmailItem = {
  nome: string;
  variacao: string | null;
  quantidade: number;
  precoCents: number;
};
export type EmailAddress = {
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
};
export type OrderEmailBase = {
  siteUrl: string;
  numero: string;
  clienteNome: string;
  itens: EmailItem[];
  subtotalCents: number;
  freteCents: number;
  descontoCents: number;
  totalCents: number;
  freteServico: string | null;
  endereco: EmailAddress;
};
export type PedidoRecebidoProps = OrderEmailBase & {
  metodo: "pix" | "boleto" | "card";
};
export type PagamentoAprovadoProps = OrderEmailBase;
export type NotaEmitidaProps = OrderEmailBase & { danfeUrl: string | null };
export type PedidoEnviadoProps = OrderEmailBase & {
  transportadora: string | null;
  rastreio: string | null;
  rastreioUrl: string | null;
};
export type PedidoEntregueProps = OrderEmailBase;
export const EXAMPLE_ORDER: OrderEmailBase = {
  siteUrl: "https://buscaagora.example",
  numero: "BA-000123",
  clienteNome: "Beatriz Exemplo",
  itens: [
    {
      nome: "Produto de demonstração",
      variacao: "Azul",
      quantidade: 2,
      precoCents: 4990,
    },
  ],
  subtotalCents: 9980,
  freteCents: 1500,
  descontoCents: 0,
  totalCents: 11480,
  freteServico: "PAC",
  endereco: {
    rua: "Rua Exemplo",
    numero: "100",
    complemento: null,
    bairro: "Bairro Modelo",
    cidade: "Cidade Exemplo",
    uf: "SP",
    cep: "00000-000",
  },
};
