/**
 * Official company data (CCMEI, 01/11/2026). The ONLY place where the
 * store's legal identity is written: footer, legal pages, checkout, order
 * e-mails, JSON-LD and the shipping label sender all read from here.
 *
 * Never put anyone's CPF here (Decreto 7.962/2013 asks for the CNPJ).
 */

export type Endereco = {
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  /** 8 digits. */
  cep: string;
};

export type Empresa = {
  nomeFantasia: string;
  razaoSocial: string;
  /** 14 digits. */
  cnpj: string;
  tipo: "MEI";
  /** YYYY-MM-DD */
  abertaEm: string;
  endereco: Endereco;
  email: string;
  /** Digits with country code (5511999998888), or null while there is none. */
  whatsapp: string | null;
  horario: string | null;
};

export const EMPRESA: Empresa = {
  nomeFantasia: "Busca Agora",
  razaoSocial: "69.919.406 TIAGO SILVA DE OLIVEIRA",
  cnpj: "69919406000179",
  tipo: "MEI",
  abertaEm: "2026-11-01",
  endereco: {
    logradouro: "Avenida São João",
    numero: "802",
    complemento: "Apto 56",
    bairro: "República",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01036100",
  },
  email: "buscaagoraa@gmail.com",
  whatsapp: null,
  horario: null,
};

/** 69.919.406/0001-79 */
export function formatCnpj(digits: string): string {
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

/** 01036-100 */
export function formatCep(digits: string): string {
  return digits.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

/** "Avenida São João, 802, Apto 56, República, São Paulo - SP, CEP 01036-100" */
export function enderecoEmLinha(e: Endereco = EMPRESA.endereco): string {
  return [
    e.logradouro,
    e.numero,
    e.complemento,
    e.bairro,
    `${e.cidade} - ${e.uf}`,
    `CEP ${formatCep(e.cep)}`,
  ]
    .filter(Boolean)
    .join(", ");
}

/** (11) 99999-8888 from "5511999998888". */
export function formatTelefone(whatsapp: string): string {
  const d = whatsapp.replace(/^55/, "");
  return d.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
}

/** CNPJ check digits (Receita Federal algorithm). */
export function cnpjValido(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const calc = (len: number) => {
    const pesos =
      len === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((s, p, i) => s + p * Number(digits[i]), 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(digits[12]) && calc(13) === Number(digits[13]);
}
