import { PinIcon } from "@/components/loja/icons";
import { cn } from "@/lib/utils";

type CepButtonProps = {
  variant: "desktop" | "mobile";
  /** Formatted CEP once the customer informs it (phase 4). */
  cep?: string;
};

// Visual only in phase 0: the CEP dialog and freight quote arrive in phase 4.
export function CepButton({ variant, cep }: CepButtonProps) {
  const desktop = variant === "desktop";
  return (
    <button
      type="button"
      className={cn(
        "inline-flex cursor-pointer items-center bg-transparent font-sans text-sm text-white",
        desktop
          ? // 40px visual (design); 3px hit area above/below the 38px padding box = 44px
            "relative min-h-10 gap-2 rounded-[10px] border border-white/28 pr-3.5 pl-2.5 before:absolute before:inset-x-0 before:-inset-y-[3px] hover:bg-white/10"
          : "min-h-11 gap-1.5 self-start border-0 p-0",
      )}
    >
      <PinIcon size={desktop ? 18 : 16} />
      <span>
        Enviar para <b>{cep ?? "informe seu CEP"}</b>
        {desktop ? null : <span aria-hidden="true"> ›</span>}
      </span>
    </button>
  );
}
