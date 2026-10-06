import { SearchIcon } from "@/components/loja/icons";
import { cn } from "@/lib/utils";

type SearchFormProps = {
  id: string;
  placeholder: string;
  variant: "desktop" | "mobile";
  className?: string;
};

// Plain GET form: works without JavaScript. /busca arrives in phase 2.
export function SearchForm({
  id,
  placeholder,
  variant,
  className,
}: SearchFormProps) {
  const desktop = variant === "desktop";
  return (
    <form
      role="search"
      action="/busca"
      method="get"
      className={cn(
        "flex min-w-0 overflow-hidden rounded-[14px] bg-white",
        desktop && "shadow-[0_2px_0_rgba(10,15,61,.15)]",
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        Buscar na loja
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        className={cn(
          "min-w-0 flex-1 border-0 bg-transparent font-sans text-base text-noite outline-none focus-visible:outline-none",
          desktop ? "h-[52px] px-5" : "h-12 px-4",
        )}
      />
      <button
        type="submit"
        aria-label="Buscar"
        className={cn(
          "flex flex-none cursor-pointer items-center justify-center border-0 bg-lima text-noite hover:bg-lima-300",
          desktop ? "h-[52px] w-[60px]" : "h-12 w-[52px]",
        )}
      >
        <SearchIcon size={desktop ? 22 : 20} />
      </button>
    </form>
  );
}
