/**
 * Contracts of the product metrics panel (/admin/metricas). The pages
 * (Claude Code) load these on the server from product_metrics_daily and
 * product_events; the components (Codex C8) only render them. Money is
 * always integer cents; rates are 0..1 (null when the base is zero).
 */

export type PeriodKey = "hoje" | "7" | "30" | "90" | "personalizado";

export type Period = {
  key: PeriodKey;
  /** Inclusive, YYYY-MM-DD in America/Sao_Paulo. */
  de: string;
  ate: string;
};

export type MetricsSummary = {
  /** Sum of daily unique visitors (someone who returns another day counts again). */
  visitantes: number;
  compras: number;
  /** compras / visitantes, or null. */
  conversao: number | null;
  faturamentoCents: number;
  /** faturamento - custo. */
  margemCents: number;
};

export type SortKey =
  | "nome"
  | "views"
  | "visitantes"
  | "carrinho"
  | "checkout"
  | "compras"
  | "conversao"
  | "faturamento"
  | "margem";

export type ProductMetricsRow = {
  productId: string;
  slug: string;
  nome: string;
  categoria: "eletronicos" | "cosmeticos";
  views: number;
  visitantes: number;
  carrinho: number;
  /** carrinho / visitantes, or null. */
  carrinhoTaxa: number | null;
  checkout: number;
  /** checkout / carrinho, or null. */
  checkoutTaxa: number | null;
  /** Paid orders containing the product. */
  compras: number;
  unidades: number;
  /** compras / visitantes, or null. */
  conversao: number | null;
  faturamentoCents: number;
  margemCents: number;
};

export type FunnelData = {
  viu: number;
  carrinho: number;
  checkout: number;
  comprou: number;
};

export type OriginGroup =
  "redes" | "influenciador" | "anuncio" | "direto" | "outros";

export type OriginRow = {
  grupo: OriginGroup;
  /** Raw source shown under the group, e.g. "instagram", "ref: joana". */
  detalhe: string;
  visitas: number;
  vendas: number;
  faturamentoCents: number;
};

export type ViewerRow = {
  /** Anonymous visitor id (cookie). */
  sessionId: string;
  /** Logged-in customer, when known. */
  cliente: { id: string; nome: string } | null;
  origem: string;
  device: "mobile" | "desktop";
  /** ISO timestamp of the first view in the period. */
  primeiraVisita: string;
  visitas: number;
  /** Viewed the product on more than one day. */
  voltou: boolean;
  comprou: boolean;
};

export type DailyPoint = {
  /** YYYY-MM-DD */
  data: string;
  views: number;
  vendas: number;
  faturamentoCents: number;
};

export type ForecastRange = {
  previsto: number;
  minimo: number;
  maximo: number;
};

export type ForecastResult =
  | {
      suficiente: true;
      dias: number;
      views: ForecastRange;
      vendas: ForecastRange;
      /** Cents. */
      faturamento: ForecastRange;
    }
  | { suficiente: false; motivo: string };
