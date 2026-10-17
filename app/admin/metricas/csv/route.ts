import { requireAdmin } from "@/lib/auth/session";
import { parseSort } from "@/lib/metrics/params";
import { parsePeriod } from "@/lib/metrics/period";
import { productsTable, sortRows } from "@/lib/metrics/queries";

// GET /admin/metricas/csv?periodo=…&ordem=…&dir=… (admins only).
const cents = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const pct = (r: number | null) =>
  r === null ? "" : (r * 100).toFixed(2).replace(".", ",");

function cell(v: string | number): string {
  const s = String(v);
  // Quote everything; neutralise spreadsheet formulas.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  await requireAdmin("/admin/metricas");
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const period = parsePeriod(params, new Date());
  const { key, dir } = parseSort(params);
  const { rows } = await productsTable(period);
  const header = [
    "produto",
    "views",
    "visitantes",
    "carrinho",
    "carrinho_%",
    "checkout",
    "checkout_%",
    "compras",
    "unidades",
    "conversao_%",
    "faturamento_reais",
    "margem_reais",
  ];
  const lines = sortRows(rows, key, dir).map((r) =>
    [
      r.nome,
      r.views,
      r.visitantes,
      r.carrinho,
      pct(r.carrinhoTaxa),
      r.checkout,
      pct(r.checkoutTaxa),
      r.compras,
      r.unidades,
      pct(r.conversao),
      cents(r.faturamentoCents),
      cents(r.margemCents),
    ]
      .map(cell)
      .join(";"),
  );
  // BOM + ";" so Excel in Portuguese opens it right.
  const body = "﻿" + [header.map(cell).join(";"), ...lines].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="metricas-${period.de}-a-${period.ate}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
