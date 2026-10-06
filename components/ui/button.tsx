import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// shadcn/ui Button with the Busca Agora variants (docs/design/*.dc.html).
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-display font-bold whitespace-nowrap no-underline transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        principal:
          "bg-ultramar text-white hover:bg-ultramar-700 hover:text-white",
        lima: "bg-lima text-noite hover:bg-lima-300 hover:text-noite",
        contorno:
          "border-2 border-ultramar bg-white text-ultramar hover:bg-ultramar-50 hover:text-ultramar",
      },
      size: {
        md: "min-h-12 rounded-[14px] px-6 text-[15px]",
        lg: "min-h-14 rounded-2xl px-7 text-[17px]",
      },
    },
    defaultVariants: {
      variant: "principal",
      size: "md",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. <Link>) with button styles. */
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? undefined : (type ?? "button")}
      {...props}
    />
  );
}

export { Button, buttonVariants };
