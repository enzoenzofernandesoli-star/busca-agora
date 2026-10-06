import type { ReactNode, SVGProps } from "react";

// Stroke icons copied path-for-path from docs/design/*.dc.html (Lucide style).

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({
  size = 24,
  strokeWidth = 2,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2.4} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </Svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.9} {...props}>
      <path d="M6 7h13l-1.5 8.5a2 2 0 0 1-2 1.5H9.2a2 2 0 0 1-2-1.6L5 3H2.5" />
      <circle cx="9.5" cy="20.5" r="1.2" />
      <circle cx="16.5" cy="20.5" r="1.2" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.8} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </Svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </Svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 10.5L12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" />
    </Svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.8} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </Svg>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.8} {...props}>
      <path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
      <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" />
    </Svg>
  );
}

/** Placeholder art for electronics product tiles (chip). */
export function ChipIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.3} {...props}>
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <path d="M9 2.5v2.5M15 2.5v2.5M9 19v2.5M15 19v2.5M2.5 9h2.5M2.5 15h2.5M19 9h2.5M19 15h2.5" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </Svg>
  );
}

/** Placeholder art for cosmetics product tiles (drop). */
export function DropIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.3} {...props}>
      <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </Svg>
  );
}

/** Electronics category art (headphones). */
export function HeadphonesIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.5} {...props}>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3" y="14" width="4" height="7" rx="1.5" />
      <rect x="17" y="14" width="4" height="7" rx="1.5" />
    </Svg>
  );
}

/** Cosmetics category art (bottle). */
export function BottleIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.5} {...props}>
      <rect x="7" y="9" width="10" height="12.5" rx="3" />
      <path d="M10 9V6h4v3" />
      <path d="M9.5 4h5" />
      <path d="M10 14h4" />
    </Svg>
  );
}

export function WatchIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.5} {...props}>
      <rect x="6" y="6" width="12" height="12" rx="3.5" />
      <path d="M9 6l.8-3.5h4.4L15 6M9 18l.8 3.5h4.4L15 18" />
      <path d="M12 9.5V12l1.8 1.2" />
    </Svg>
  );
}

export function PixIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.9} {...props}>
      <path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" />
      <path d="M8 12h8" />
    </Svg>
  );
}

export function CardIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.9} {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19M6.5 15h4" />
    </Svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.9} {...props}>
      <path d="M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5V16h-7" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </Svg>
  );
}

export function ExchangeIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.9} {...props}>
      <path d="M4 9a8 8 0 0 1 14.5-3M20 4v4h-4" />
      <path d="M20 15a8 8 0 0 1-14.5 3M4 20v-4h4" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2.2} {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2.2} {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Svg strokeWidth={2.2} {...props}>
      <path d="M6 2.5h9l4 4v15H6z" />
      <path d="M9 12h7M9 16h7" />
    </Svg>
  );
}
