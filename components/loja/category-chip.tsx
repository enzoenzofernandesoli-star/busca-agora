import Link from "next/link";

import { cn } from "@/lib/utils";

type CategoryChipProps = {
  href: string;
  label: string;
  /** Tailwind bg class for the color square, e.g. "bg-ciano". */
  cor?: string;
  className?: string;
};

export function CategoryChip({
  href,
  label,
  cor,
  className,
}: CategoryChipProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 flex-none items-center gap-2 rounded-full border border-borda bg-white px-3.5 text-sm font-bold text-noite no-underline hover:border-ultramar hover:text-noite",
        className,
      )}
    >
      {cor ? (
        <span
          aria-hidden="true"
          className={cn("size-[9px] rounded-[3px]", cor)}
        />
      ) : null}
      {label}
    </Link>
  );
}
