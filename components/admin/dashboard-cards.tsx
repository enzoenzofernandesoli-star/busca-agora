import type { ReactNode } from "react";
import Link from "next/link";

const focus =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar";
const shell =
  "min-w-0 rounded-[22px] border border-borda bg-white p-5 text-noite md:rounded-[28px] md:p-7";
function Icon({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
export function KpiCard({
  titulo,
  valor,
  comparacao,
  href,
  destaque = false,
}: {
  titulo: string;
  valor: string;
  comparacao?: { texto: string; variacao: number | null };
  href?: string;
  destaque?: boolean;
}) {
  const change = comparacao?.variacao;
  const valid = typeof change === "number" && Number.isFinite(change);
  const direction = valid ? Math.sign(change) : 0;
  const contents = (
    <>
      <h2
        className={`text-[15px] font-bold ${destaque ? "text-lavanda" : "text-texto-2"}`}
      >
        {titulo}
      </h2>
      <p
        className={`mt-3 font-display text-[30px] font-extrabold tracking-tight whitespace-nowrap md:text-[32px] xl:text-[28px] 2xl:text-[32px] ${destaque ? "text-lima" : "text-noite"}`}
      >
        {valor}
      </p>
      {comparacao && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 font-bold ${destaque ? "rounded-full bg-white px-2 py-1" : ""} ${direction > 0 ? "text-estoque" : direction < 0 ? "text-rosa-ink" : "text-texto-2"}`}
          >
            <Icon>
              {direction > 0 ? (
                <path d="M12 19V5m-6 6 6-6 6 6" />
              ) : direction < 0 ? (
                <path d="M12 5v14m-6-6 6 6 6-6" />
              ) : (
                <path d="M5 12h14" />
              )}
            </Icon>
            <span className="sr-only">
              {direction > 0 ? "Aumento de " : direction < 0 ? "Queda de " : ""}
            </span>
            {valid
              ? `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(change))}%`
              : "sem comparação"}
          </span>
          <span className={destaque ? "text-lavanda" : "text-texto-2"}>
            {comparacao.texto}
          </span>
        </div>
      )}
    </>
  );
  const classes = `${shell} ${destaque ? "!border-ultramar !bg-ultramar !text-white" : ""}`;
  return href ? (
    <Link href={href} className={`block ${classes} ${focus}`}>
      {contents}
    </Link>
  ) : (
    <section className={classes}>{contents}</section>
  );
}
export function DashboardAlerts({
  alertas,
}: {
  alertas: {
    tipo: "erro" | "aviso" | "ok";
    texto: string;
    href?: string;
    acao?: string;
  }[];
}) {
  const needsAttention = alertas.some((alert) => alert.tipo !== "ok");
  return (
    <section className={shell}>
      <h2 className="font-display text-lg font-bold">Precisa da sua atenção</h2>
      {!needsAttention && (
        <p className="mt-4 flex items-center gap-3 font-bold text-estoque">
          <Icon>
            <path d="m5 12 4 4L19 6" />
          </Icon>
          Tudo em dia.
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {alertas.map((alert, index) => (
          <li
            key={`${alert.tipo}-${index}`}
            className="flex flex-wrap items-center gap-3"
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-[12px] ${alert.tipo === "erro" ? "bg-rosa-tile text-rosa-ink" : alert.tipo === "aviso" ? "bg-ciano-tile text-ciano-ink" : "text-estoque"}`}
            >
              <Icon>
                {alert.tipo === "erro" ? (
                  <>
                    <path d="m12 3 10 18H2L12 3Z" />
                    <path d="M12 9v4m0 4h.01" />
                  </>
                ) : alert.tipo === "aviso" ? (
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </>
                ) : (
                  <path d="m5 12 4 4L19 6" />
                )}
              </Icon>
            </span>
            <p className="min-w-0 flex-1 basis-40 text-sm break-words">
              {alert.texto}
            </p>
            {alert.href && (
              <Link
                href={alert.href}
                className={`inline-flex min-h-11 items-center justify-center rounded-[14px] border border-ultramar px-4 font-display text-sm font-bold text-ultramar hover:bg-ultramar-50 ${focus}`}
              >
                {alert.acao ?? "Ver"}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
export function QuickActions({
  acoes,
}: {
  acoes: {
    titulo: string;
    descricao: string;
    href: string;
    icone: "produto" | "pedidos" | "config" | "equipe";
  }[];
}) {
  return (
    <nav
      aria-label="Atalhos do painel"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {acoes.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`min-h-[88px] min-w-0 rounded-[22px] border border-borda bg-white p-4 hover:border-ultramar ${focus}`}
        >
          <span className="mb-3 flex size-11 items-center justify-center rounded-[14px] bg-ultramar-50 text-ultramar">
            <Icon>
              {action.icone === "produto" ? (
                <>
                  <path d="m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10" />
                </>
              ) : action.icone === "pedidos" ? (
                <>
                  <rect x="5" y="4" width="14" height="17" rx="2" />
                  <path d="M9 4V2h6v2M9 10h6m-6 4h6" />
                </>
              ) : action.icone === "config" ? (
                <>
                  <path d="M4 7h16M4 17h16M8 4v6m8 4v6" />
                  <circle cx="8" cy="7" r="2" />
                  <circle cx="16" cy="17" r="2" />
                </>
              ) : (
                <>
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3 21v-3a6 6 0 0 1 12 0v3m3-17a3 3 0 0 1 0 6m3 11v-3a6 6 0 0 0-3-5" />
                </>
              )}
            </Icon>
          </span>
          <span className="block font-display text-sm font-bold break-words text-noite">
            {action.titulo}
          </span>
          <span className="mt-1 block text-xs leading-relaxed break-words text-texto-2">
            {action.descricao}
          </span>
        </Link>
      ))}
    </nav>
  );
}
