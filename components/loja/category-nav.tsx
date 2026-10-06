import Link from "next/link";

import { MenuIcon } from "@/components/loja/icons";
import { navCategories } from "@/lib/site";
import { cn } from "@/lib/utils";

const linkClass =
  "inline-flex min-h-11 items-center gap-2 text-white no-underline hover:text-lima";

/** Desktop category menu inside the blue header. */
export function CategoryNav() {
  return (
    <nav
      aria-label="Categorias"
      className="flex flex-wrap items-center gap-x-7 gap-y-2"
    >
      <Link href="/#categorias" className={cn(linkClass, "font-bold")}>
        <MenuIcon size={18} />
        Categorias
      </Link>
      {navCategories.map((c) => (
        <Link key={c.href} href={c.href} className={linkClass}>
          {c.cor ? (
            <span
              aria-hidden="true"
              className={cn("size-2.5 rounded-[3px]", c.cor)}
            />
          ) : null}
          {c.label}
        </Link>
      ))}
      <Link href="/rastreio" className={linkClass}>
        Rastrear pedido
      </Link>
    </nav>
  );
}
