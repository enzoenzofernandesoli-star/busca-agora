const items = [
  { label: "Pix aprovado na hora", dot: "bg-lima" },
  { label: "Frete calculado no seu CEP", dot: "bg-ciano" },
  { label: "Troca em até 7 dias", dot: "bg-rosa" },
];

export function TopBar() {
  return (
    <div className="hidden bg-noite text-[13px] text-lavanda md:block">
      <ul className="mx-auto flex max-w-[1280px] flex-wrap justify-center gap-x-10 gap-y-2 px-8 py-[9px]">
        {items.map((item) => (
          <li key={item.label} className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${item.dot}`}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
