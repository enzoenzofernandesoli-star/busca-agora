import { cn } from "@/lib/utils";

const styles = `
  .ba-marquee { height: 48px; overflow: hidden; }
  .ba-marquee-track { display: flex; width: max-content; height: 100%; animation: ba-marquee 28s linear infinite; }
  .ba-marquee-list { display: flex; flex-shrink: 0; align-items: center; justify-content: space-around; min-width: 100vw; margin: 0; padding: 0; list-style: none; }
  .ba-marquee-item { display: flex; flex-shrink: 0; align-items: center; gap: 24px; padding: 0 12px; white-space: nowrap; }
  .ba-marquee:hover .ba-marquee-track, .ba-marquee:focus-within .ba-marquee-track { animation-play-state: paused; }
  @keyframes ba-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @media (min-width: 768px) { .ba-marquee { height: 56px; } }
  @media (prefers-reduced-motion: reduce) {
    .ba-marquee { height: auto; overflow: visible; }
    .ba-marquee-track { width: 100%; height: auto; animation: none; transform: none; }
    .ba-marquee-list { min-width: 0; width: 100%; flex-wrap: wrap; justify-content: center; gap: 12px 24px; padding: 16px 24px; }
    .ba-marquee-item { flex-shrink: 1; max-width: 100%; padding: 0; white-space: normal; overflow-wrap: anywhere; }
    .ba-marquee-copy { display: none; }
  }
`;

export function Marquee({
  itens,
  className,
}: {
  itens: string[];
  className?: string;
}) {
  if (itens.length === 0) return null;

  const items = itens.map((item, index) => (
    <li className="ba-marquee-item" key={`${index}-${item}`}>
      <span>{item}</span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
        focusable="false"
        className="shrink-0"
      >
        <path d="M5 1 9 5 5 9 1 5Z" strokeLinejoin="round" />
      </svg>
    </li>
  ));

  return (
    <section
      aria-label="Vantagens da loja"
      tabIndex={0}
      className={cn(
        "ba-marquee w-full bg-lima font-display text-[15px] font-bold text-noite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ultramar md:text-[17px]",
        className,
      )}
    >
      <style>{styles}</style>
      <div className="ba-marquee-track">
        <ul className="ba-marquee-list">{items}</ul>
        <ul className="ba-marquee-list ba-marquee-copy" aria-hidden="true">
          {items}
        </ul>
      </div>
    </section>
  );
}
