import Link from "next/link";

import { CartIcon } from "@/components/loja/icons";
import { cn } from "@/lib/utils";

type CartButtonProps = {
  count: number;
  variant: "desktop" | "mobile";
};

function cartLabel(count: number) {
  if (count === 0) return "Carrinho vazio";
  return count === 1 ? "Carrinho com 1 item" : `Carrinho com ${count} itens`;
}

export function CartButton({ count, variant }: CartButtonProps) {
  const desktop = variant === "desktop";
  return (
    <Link
      href="/carrinho"
      aria-label={cartLabel(count)}
      className={cn(
        "relative flex flex-none items-center justify-center bg-white/12 text-white hover:bg-white/20 hover:text-white",
        desktop ? "size-12 rounded-[14px]" : "size-11 rounded-xl",
      )}
    >
      <CartIcon size={desktop ? 24 : 22} />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute flex items-center justify-center bg-lima font-bold text-noite",
            desktop
              ? "-top-1.5 -right-1.5 h-[22px] min-w-[22px] rounded-[11px] px-1.5 text-xs"
              : "-top-[5px] -right-[5px] h-5 min-w-5 rounded-[10px] px-1 text-[11px]",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
