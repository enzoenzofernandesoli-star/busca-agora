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
        // 40px visual (design); ::before is laid out from the padding box (38px
        // inside the 1px border), so 3px above/below gives a 44px touch target
        "relative inline-flex min-h-10 flex-none items-center gap-2 rounded-full border border-borda bg-white px-3.5 text-sm font-bold text-noite no-underline before:absolute before:inset-x-0 before:-inset-y-[3px] hover:border-ultramar hover:text-noite",
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
