import Link from "next/link";

export function StatCard({
  titulo,
  valor,
  detalhe,
  href,
  tom = "neutro",
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  href?: string;
  tom?: "neutro" | "alerta" | "ok";
}) {
  const tone =
    tom === "alerta"
      ? "border-rosa-ink"
      : tom === "ok"
        ? "border-estoque"
        : "border-borda";
  const text =
    tom === "alerta"
      ? "text-rosa-ink"
      : tom === "ok"
        ? "text-estoque"
        : "text-noite";
  const content = (
    <>
      <h2 className="text-[15px] font-bold text-texto-2">{titulo}</h2>
      <p className={`font-display text-[32px] font-extrabold ${text}`}>
        {valor}
      </p>
      {detalhe && <p className="text-sm text-texto-2">{detalhe}</p>}
      {href && (
        <span className="inline-flex items-center gap-2 text-sm font-bold text-ultramar">
          Ver
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      )}
    </>
  );
  const classes = `flex flex-col gap-3 rounded-[22px] border bg-white p-6 font-sans ${tone}`;
  return href ? (
    <Link
      href={href}
      className={`${classes} focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar`}
    >
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}
