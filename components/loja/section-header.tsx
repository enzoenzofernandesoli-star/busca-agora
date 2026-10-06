import Link from "next/link";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  /** id for the h2, so the section can use aria-labelledby. */
  id: string;
  title: string;
  eyebrow?: string;
  /** Tailwind text class for the eyebrow (default: text-ultramar). */
  eyebrowColor?: string;
  /** Tailwind bg class for a color square before the eyebrow. */
  eyebrowSquare?: string;
  link?: { href: string; label: string };
  /** Shorter title/link label for < md (docs/design/Celular-Home.dc.html). */
  mobileTitle?: string;
  mobileLinkLabel?: string;
  className?: string;
};

export function SectionHeader({
  id,
  title,
  eyebrow,
  eyebrowColor = "text-ultramar",
  eyebrowSquare,
  link,
  mobileTitle,
  mobileLinkLabel,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 md:items-end",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        {eyebrow ? (
          <span
            className={cn(
              "hidden items-center gap-2 text-[13px] font-bold tracking-[.1em] uppercase md:inline-flex",
              eyebrowColor,
            )}
          >
            {eyebrowSquare ? (
              <span
                aria-hidden="true"
                className={cn("size-2.5 rounded-[3px]", eyebrowSquare)}
              />
            ) : null}
            {eyebrow}
          </span>
        ) : null}
        <h2
          id={id}
          className="m-0 font-display text-[22px] font-extrabold md:text-[34px] md:tracking-[-0.02em]"
        >
          {mobileTitle ? (
            <>
              <span className="md:hidden">{mobileTitle}</span>
              <span className="hidden md:inline">{title}</span>
            </>
          ) : (
            title
          )}
        </h2>
      </div>
      {link ? (
        <Link
          href={link.href}
          className="inline-flex min-h-11 items-center text-sm font-bold text-ultramar hover:text-noite md:text-[15px]"
        >
          {mobileLinkLabel ? (
            <>
              <span className="md:hidden">{mobileLinkLabel}</span>
              <span className="hidden md:inline">{link.label}</span>
            </>
          ) : (
            link.label
          )}
          <span aria-hidden="true" className="hidden md:inline">
            &nbsp;→
          </span>
        </Link>
      ) : null}
    </div>
  );
}
