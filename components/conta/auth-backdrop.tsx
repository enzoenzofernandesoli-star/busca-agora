import {
  BottleIcon,
  HeadphonesIcon,
  LipstickIcon,
  PlugIcon,
  SparklesIcon,
  TruckIcon,
} from "@/components/loja/icons";

/*
 * Every moving piece animates only transform/opacity (composited, no
 * repaint per frame), and stops with reduced motion. Off-screen it is
 * paused by MotionGate.
 */
const styles = `
  @media (prefers-reduced-motion: no-preference) {
    @keyframes ba-auth-wave { to { transform: translate3d(-50%, 0, 0); } }
    @keyframes ba-auth-comet {
      from { transform: translate3d(-30%, 0, 0); opacity: 0; }
      10%, 80% { opacity: 1; }
      to { transform: translate3d(130%, 0, 0); opacity: 0; }
    }
    @keyframes ba-auth-sweep {
      0%, 100% { transform: translate3d(0, 0, 0) rotate(-8deg); }
      25% { transform: translate3d(-36px, -14px, 0) rotate(0deg); }
      50% { transform: translate3d(-72px, 0, 0) rotate(8deg); }
      75% { transform: translate3d(-36px, 12px, 0) rotate(0deg); }
    }
    @keyframes ba-auth-glint {
      0%, 60%, 100% { opacity: 0; transform: translate3d(-18px, 0, 0); }
      75% { opacity: .9; transform: translate3d(18px, 0, 0); }
    }
    @keyframes ba-auth-twinkle {
      0%, 100% { opacity: .15; transform: scale(.6); }
      50% { opacity: 1; transform: scale(1); }
    }
    .ba-auth-wave { animation: ba-auth-wave 26s linear infinite; will-change: transform; }
    .ba-auth-comet { animation: ba-auth-comet 7s cubic-bezier(.45,0,.55,1) infinite; }
    .ba-auth-sweep { animation: ba-auth-sweep 18s ease-in-out infinite; }
    .ba-auth-glint { animation: ba-auth-glint 6s ease-in-out infinite; }
    .ba-auth-twinkle { animation: ba-auth-twinkle 3.2s ease-in-out infinite; }
  }
`;

// One period of a smooth wave across 1600 units, repeated twice so a
// translate of -50% loops without a seam.
function wavePath(y: number, amp: number, fill: boolean) {
  let d = `M0 ${y}`;
  for (let x = 0; x < 3200; x += 800)
    d += ` C${x + 200} ${y - amp} ${x + 600} ${y - amp} ${x + 800} ${y} C${x + 1000} ${y + amp} ${x + 1400} ${y + amp} ${x + 1600} ${y}`;
  return fill ? `${d} V200 H0 Z` : d;
}

const waves = [
  { y: 70, amp: 34, fill: "#3324F5", opacity: 0.55, dur: 34, delay: 0 },
  { y: 104, amp: 26, fill: "#7ADFFF", opacity: 0.22, dur: 24, delay: -9 },
  { y: 134, amp: 22, fill: "#FF9AC8", opacity: 0.2, dur: 18, delay: -4 },
];
const crests = [
  { y: 70, amp: 34, stroke: "#C6FF3D", opacity: 0.7, dur: 34, delay: 0 },
  { y: 104, amp: 26, stroke: "#7ADFFF", opacity: 0.6, dur: 24, delay: -9 },
];

function Waves({ className }: { className: string }) {
  return (
    <div className={`absolute inset-x-0 overflow-hidden ${className}`}>
      {waves.map((w) => (
        <svg
          key={w.fill}
          viewBox="0 0 3200 200"
          preserveAspectRatio="none"
          className="ba-auth-wave absolute inset-y-0 left-0 h-full w-[200%]"
          style={{
            animationDuration: `${w.dur}s`,
            animationDelay: `${w.delay}s`,
          }}
          focusable="false"
        >
          <path
            d={wavePath(w.y, w.amp, true)}
            fill={w.fill}
            opacity={w.opacity}
          />
        </svg>
      ))}
      {crests.map((c) => (
        <svg
          key={c.stroke}
          viewBox="0 0 3200 200"
          preserveAspectRatio="none"
          className="ba-auth-wave absolute inset-y-0 left-0 h-full w-[200%]"
          style={{
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
          }}
          fill="none"
          focusable="false"
        >
          <path
            d={wavePath(c.y, c.amp, false)}
            stroke={c.stroke}
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            opacity={c.opacity}
          />
        </svg>
      ))}
    </div>
  );
}

// Light rails: hairlines with a bright comet running along each one.
const rails = [12, 26, 40, 54, 68, 82];

export function AuthBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <style>{styles}</style>

      {/* Static colour glows (gradients, no blur filter). */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_100%_0%,rgba(51,36,245,.45),transparent_70%),radial-gradient(50%_40%_at_0%_100%,rgba(122,223,255,.14),transparent_70%)]" />

      {/* Rails stay behind the card side (and below the copy on phones). */}
      <div className="absolute inset-x-0 top-[210px] bottom-0 overflow-hidden lg:top-0 lg:left-[52%]">
        <div className="absolute -inset-[40%] rotate-[-28deg]">
          {rails.map((top, i) => (
            <div
              key={top}
              className="absolute inset-x-0 h-px bg-lavanda/15"
              style={{ top: `${top}%` }}
            >
              <span
                className="ba-auth-comet absolute -top-px left-0 h-[3px] w-[22%] rounded-full bg-[linear-gradient(90deg,transparent,#7ADFFF_70%,#fff)] opacity-0"
                style={{ animationDelay: `${i * -1.3}s` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Waves at the bottom: on phones the card floats over them. */}
      <Waves className="bottom-0 h-[170px] md:h-[240px]" />

      {/* The store's magnifier, sweeping over the waves. */}
      <svg
        viewBox="0 0 220 200"
        className="ba-auth-sweep absolute right-2 bottom-3 h-[118px] w-[130px] md:right-[6%] md:bottom-4 md:h-[200px] md:w-[220px] xl:right-auto xl:left-[36%]"
        fill="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="ba-auth-lens" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".28" />
            <stop offset="1" stopColor="#fff" stopOpacity=".04" />
          </linearGradient>
          <clipPath id="ba-auth-lens-clip">
            <circle cx="92" cy="84" r="50" />
          </clipPath>
        </defs>
        <circle cx="92" cy="84" r="50" fill="url(#ba-auth-lens)" />
        <g clipPath="url(#ba-auth-lens-clip)">
          <rect
            className="ba-auth-glint"
            x="70"
            y="20"
            width="14"
            height="130"
            fill="#fff"
            opacity="0"
            transform="rotate(30 92 84)"
          />
        </g>
        <circle cx="92" cy="84" r="56" stroke="#C6FF3D" strokeWidth="13" />
        <path
          d="m134 126 50 50"
          stroke="#fff"
          strokeWidth="17"
          strokeLinecap="round"
        />
        <path
          d="M64 66a34 34 0 0 1 26-14"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".7"
        />
      </svg>

      {/* What the store sells, floating at the edges. */}
      <div className="absolute inset-x-0 top-6 h-[60px] text-lavanda lg:top-0 lg:h-[110px]">
        <span className="ba-float absolute top-1 right-4 opacity-40 lg:top-6 lg:right-auto lg:left-[8%]">
          <HeadphonesIcon size={30} className="lg:size-12" />
        </span>
        <span className="ba-float absolute top-5 left-[30%] hidden opacity-30 [animation-delay:-2s] lg:block">
          <BottleIcon size={40} />
        </span>
        <span className="ba-float absolute top-6 right-[24%] hidden opacity-40 [animation-delay:-3s] lg:block">
          <LipstickIcon size={36} />
        </span>
        <span className="ba-float absolute top-5 right-[5%] hidden opacity-35 [animation-delay:-4s] lg:block">
          <PlugIcon size={52} />
        </span>
      </div>
      <span className="ba-float absolute bottom-[150px] left-6 hidden text-lavanda opacity-30 [animation-delay:-1s] lg:block">
        <TruckIcon size={44} />
      </span>

      {/* Twinkles in the brand colours. */}
      {[
        { c: "text-lima", pos: "top-[14%] left-[46%]", d: 0 },
        { c: "text-rosa", pos: "top-[30%] right-[3%]", d: -1.1 },
        { c: "text-ciano", pos: "bottom-[38%] left-[4%]", d: -2.2 },
      ].map((s) => (
        <span
          key={s.pos}
          className={`ba-auth-twinkle absolute hidden lg:block ${s.c} ${s.pos}`}
          style={{ animationDelay: `${s.d}s` }}
        >
          <SparklesIcon size={22} />
        </span>
      ))}

      {/* The brand mark, static and subdued. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-e-branco.svg"
        alt=""
        width={280}
        height={164}
        className="absolute -bottom-12 -left-14 hidden h-auto w-[320px] opacity-[.06] lg:block"
      />
    </div>
  );
}
