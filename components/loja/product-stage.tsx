const styles = `
  @keyframes ba-stage-circuit {
    0% { transform: translate(0, 0); opacity: 0; }
    10% { opacity: 1; }
    40% { transform: translate(104px, 0); }
    65% { transform: translate(104px, 72px); }
    90% { opacity: 1; }
    100% { transform: translate(188px, 72px); opacity: 0; }
  }
  @keyframes ba-stage-rise {
    0%, 100% { transform: translateY(0); opacity: .3; }
    50% { transform: translateY(-24px); opacity: .4; }
  }
  @keyframes ba-stage-sparkle {
    0%, 100% { transform: scale(.7); opacity: .25; }
    50% { transform: scale(1); opacity: .7; }
  }
  .ba-stage-sparkle { transform-box: fill-box; transform-origin: center; }
  @media (prefers-reduced-motion: no-preference) {
    .ba-stage-pulse { animation: ba-stage-circuit 6s linear infinite; }
    .ba-stage-pulse-2 { animation-delay: -2s; }
    .ba-stage-pulse-3 { animation-delay: -4s; }
    .ba-stage-bubble { animation: ba-stage-rise 9s ease-in-out infinite; }
    .ba-stage-bubble-2 { animation-delay: -4s; }
    .ba-stage-sparkle { animation: ba-stage-sparkle 5s ease-in-out infinite; }
    .ba-stage-sparkle-2 { animation-delay: -2.5s; }
    @media (min-width: 768px) and (hover: hover) and (pointer: fine) {
      .ba-stage-photo { transition: transform 240ms ease; }
      .ba-stage-gallery:hover .ba-stage-photo { transform: scale(1.035); }
    }
  }
`;

export function ProductStage({
  categoria,
}: {
  categoria: "eletronicos" | "cosmeticos";
}) {
  const isElectronics = categoria === "eletronicos";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${isElectronics ? "bg-ciano-tile" : "bg-rosa-tile"}`}
    >
      <style>{styles}</style>
      <svg
        viewBox="0 0 560 560"
        className={`h-full w-full ${isElectronics ? "text-ciano-ink" : "text-rosa"}`}
        fill="none"
        focusable="false"
      >
        {isElectronics ? (
          <>
            <circle
              cx="560"
              cy="0"
              r="156"
              stroke="var(--color-ciano)"
              strokeWidth="40"
              opacity=".4"
            />
            <g fill="currentColor" opacity=".18">
              {[48, 80, 112, 448, 480, 512].map((x) =>
                [48, 80, 112, 448, 480, 512].map((y) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />
                )),
              )}
            </g>
            {[
              { x: 24, y: 168, className: "" },
              { x: 336, y: 360, className: "ba-stage-pulse-2" },
              { x: 32, y: 432, className: "ba-stage-pulse-3" },
            ].map((trail) => (
              <g key={trail.y} transform={`translate(${trail.x} ${trail.y})`}>
                <path
                  d="M0 0h104v72h84"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  opacity=".18"
                />
                <circle
                  className={`ba-stage-pulse ${trail.className}`}
                  r="4"
                  fill="var(--color-lima)"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </g>
            ))}
          </>
        ) : (
          <>
            <g fill="currentColor" opacity=".35">
              <circle className="ba-stage-bubble" cx="56" cy="440" r="64" />
              <circle
                className="ba-stage-bubble ba-stage-bubble-2"
                cx="496"
                cy="120"
                r="88"
              />
              <circle className="ba-stage-bubble" cx="468" cy="488" r="32" />
              <path
                className="ba-stage-bubble ba-stage-bubble-2"
                d="M80 64s-24 30-24 46a24 24 0 0 0 48 0C104 94 80 64 80 64Z"
              />
            </g>
            <g fill="var(--color-rosa-ink)" opacity=".4">
              <path
                className="ba-stage-sparkle"
                d="m448 280 6 16 16 6-16 6-6 16-6-16-16-6 16-6Z"
              />
              <path
                className="ba-stage-sparkle ba-stage-sparkle-2"
                d="m104 336 5 13 13 5-13 5-5 13-5-13-13-5 13-5Z"
              />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
