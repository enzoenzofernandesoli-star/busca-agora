import Link from "next/link";

type BreadcrumbProps = {
  /** The last item is the current page (no link). */
  itens: { nome: string; href?: string }[];
};

// "Você está em" trail from docs/design/Produto.dc.html.
export function Breadcrumb({ itens }: BreadcrumbProps) {
  return (
    <nav aria-label="Você está em">
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0 text-sm text-texto-2">
        {itens.map((item, i) => (
          <li key={item.nome} className="flex items-center gap-2">
            {i > 0 ? <span aria-hidden="true">›</span> : null}
            {item.href ? (
              <Link href={item.href}>{item.nome}</Link>
            ) : (
              <span aria-current="page">{item.nome}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
