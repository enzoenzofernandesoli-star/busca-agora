export function CheckoutSteps({
  currentStep = 0,
  labels = ["Carrinho", "Entrega", "Pagamento"],
}: {
  currentStep?: number;
  labels?: readonly string[];
}) {
  return (
    <nav aria-label="Etapas da compra">
      <ol className="m-0 grid list-none grid-cols-3 p-0 font-sans text-xs font-bold sm:text-sm">
        {labels.map((label, index) => (
          <li
            key={label}
            aria-current={index === currentStep ? "step" : undefined}
            className="relative flex min-w-0 flex-col items-center gap-2 text-texto-2"
          >
            {index < 2 && (
              <span
                aria-hidden="true"
                className="absolute top-4 left-1/2 h-px w-full bg-borda"
              />
            )}
            <span
              aria-hidden="true"
              className={`relative flex size-8 items-center justify-center rounded-full font-display ${index <= currentStep ? "bg-ultramar text-lima" : "border border-borda bg-fundo text-texto-2"}`}
            >
              {index + 1}
            </span>
            <span
              className={index === currentStep ? "text-ultramar" : undefined}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
