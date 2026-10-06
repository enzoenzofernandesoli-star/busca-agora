import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "text-[19px] font-bold", // mobile card
  md: "text-[22px] font-bold", // related products
  lg: "text-2xl font-bold tracking-[-0.02em]", // desktop card
  xl: "text-[44px] font-extrabold tracking-[-0.03em]", // product page
} as const;

type PriceProps = {
  /** Integer cents: 8990 = R$ 89,90. */
  cents: number;
  size?: keyof typeof sizes;
  className?: string;
};

export function Price({ cents, size = "lg", className }: PriceProps) {
  return (
    <span
      className={cn("font-display leading-tight", sizes[size], className)}
      data-cents={cents}
    >
      {formatBRL(cents)}
    </span>
  );
}
