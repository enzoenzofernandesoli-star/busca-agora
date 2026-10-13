import {
  BottleIcon,
  HeadphonesIcon,
  LipstickIcon,
  PlugIcon,
  TruckIcon,
} from "@/components/loja/icons";

const styles = `
  @media (prefers-reduced-motion: no-preference) {
    @keyframes ba-auth-wave { to { transform: translateX(-50%); } }
    @keyframes ba-auth-pulse { to { stroke-dashoffset: -1200; } }
    @keyframes ba-auth-sweep {
      0%, 100% { transform: translateX(0) rotate(-6deg); }
      50% { transform: translateX(-48px) rotate(6deg); }
    }
    .ba-auth-wave { animation: ba-auth-wave 28s linear infinite; }
    .ba-auth-wave-2 { animation-duration: 36s; animation-delay: -12s; }
    .ba-auth-wave-3 { animation-duration: 20s; animation-delay: -8s; }
    .ba-auth-wave-4 { animation-duration: 44s; animation-delay: -20s; }
    .ba-auth-pulse { animation: ba-auth-pulse 24s linear infinite; }
    .ba-auth-sweep { animation: ba-auth-sweep 26s ease-in-out infinite; }
  }
`;

export function AuthBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <style>{styles}</style>
      {/* Thin trails stay faint even where the desktop copy overlaps them. */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[144px] h-[calc(100%-144px)] w-full text-lavanda opacity-20 md:top-0 md:h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        focusable="false"
      >
        {[0, 160, 320, 480, 640].map((offset, index) => (
          <g key={offset}>
            <path d={`M${offset - 400} 900 ${offset + 500} 0`} />
            <path
              className="ba-auth-pulse"
              style={{ animationDelay: `${index * -4}s` }}
              d={`M${offset - 400} 900 ${offset + 500} 0`}
              stroke="var(--color-ciano)"
              strokeWidth="2"
              strokeDasharray="28 1172"
            />
          </g>
        ))}
      </svg>

      {/* Bright shapes are confined to edge bands, outside the copy area. */}
      <div className="absolute inset-x-0 bottom-0 h-[120px] overflow-hidden md:h-[220px]">
        {[
          { color: "text-ultramar", className: "", y: 64 },
          { color: "text-ciano", className: "ba-auth-wave-2", y: 90 },
          { color: "text-rosa", className: "ba-auth-wave-3", y: 116 },
          { color: "text-lima", className: "ba-auth-wave-4", y: 142 },
        ].map(({ color, className, y }) => (
          <svg
            key={color}
            viewBox="0 0 3200 180"
            preserveAspectRatio="none"
            className={`ba-auth-wave absolute inset-y-0 left-0 h-full w-[200%] ${color} ${className}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            opacity=".4"
            focusable="false"
          >
            <path
              d={`M0 ${y} C200 ${y - 50} 600 ${y - 50} 800 ${y} C1000 ${y + 50} 1400 ${y + 50} 1600 ${y} C1800 ${y - 50} 2200 ${y - 50} 2400 ${y} C2600 ${y + 50} 3000 ${y + 50} 3200 ${y}`}
            />
          </svg>
        ))}
        <svg
          viewBox="0 0 220 180"
          className="ba-auth-sweep absolute -right-8 -bottom-14 h-[180px] w-[220px] md:right-[8%] md:-bottom-6 md:h-[240px] md:w-[290px] xl:right-auto xl:left-[38%]"
          fill="none"
          focusable="false"
        >
          <circle
            cx="96"
            cy="76"
            r="52"
            stroke="var(--color-lima)"
            strokeWidth="12"
          />
          <circle cx="96" cy="76" r="45" fill="white" opacity=".1" />
          <path
            d="m134 114 52 52"
            stroke="white"
            strokeWidth="16"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="absolute inset-x-0 top-0 hidden h-[96px] overflow-hidden text-lavanda md:block">
        <span className="ba-float absolute top-5 left-[8%] opacity-35">
          <HeadphonesIcon size={48} />
        </span>
        <span className="ba-float absolute top-4 left-[30%] opacity-30 [animation-delay:-2s]">
          <BottleIcon size={40} />
        </span>
        <span className="ba-float absolute top-6 right-[22%] opacity-40 [animation-delay:-3s]">
          <LipstickIcon size={36} />
        </span>
        <span className="ba-float absolute top-5 right-[5%] opacity-35 [animation-delay:-4s]">
          <PlugIcon size={52} />
        </span>
      </div>
      <span className="ba-float absolute bottom-7 left-5 text-lavanda opacity-30 md:left-[30%]">
        <TruckIcon size={44} />
      </span>
      <svg
        viewBox="0 0 48 48"
        className="ba-float absolute right-5 bottom-9 hidden size-10 text-lavanda opacity-30 md:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        focusable="false"
      >
        <path d="M6 6h19l17 17-19 19L6 25Z" strokeLinejoin="round" />
        <circle cx="16" cy="16" r="3" />
      </svg>
      {/* The existing brand mark remains static and deliberately subdued. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-e-branco.svg"
        alt=""
        width={280}
        height={164}
        className="absolute -bottom-12 -left-14 h-auto w-[240px] opacity-[.06] md:w-[320px]"
      />
    </div>
  );
}
