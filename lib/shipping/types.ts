export type ShippingItem = {
  variantId: string;
  quantidade: number;
  pesoG: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  precoCents: number;
};

export type ShippingOption = {
  servicoId: string;
  servico: string;
  transportadora: string;
  precoCents: number;
  prazoDias: number;
  prazoMin?: number;
  prazoMax?: number;
};

export type QuoteResult =
  | { ok: true; opcoes: ShippingOption[] }
  | { ok: false; motivo: "cep_invalido" | "sem_servico" | "indisponivel" };
