import { cn } from "@/lib/utils";

type CategoryArtProps = {
  categoria: "eletronicos" | "cosmeticos";
  variante?: "placa" | "mini";
  /** "claro": a translucent white plate, for use on the category colour. */
  fundo?: "cor" | "claro";
  className?: string;
};

function Headphones() {
  return (
    <>
      <path d="M20 51V39a24 24 0 0 1 48 0v12" />
      <path d="M26 40v-1a18 18 0 0 1 36 0v1" />
      <rect x="17" y="43" width="13" height="23" rx="6" />
      <rect x="58" y="43" width="13" height="23" rx="6" />
      <path d="M68 66a13 13 0 0 1-13 10h-8" />
    </>
  );
}

function DropperBottle() {
  return (
    <>
      <path d="M38 22v-6a6 6 0 0 1 12 0v6" />
      <rect x="34" y="22" width="20" height="11" rx="3" />
      <path d="M36 33v7l-7 7v23a6 6 0 0 0 6 6h18a6 6 0 0 0 6-6V47l-7-7v-7" />
      <rect x="29" y="51" width="30" height="16" rx="2" fill="#C6FF3D" />
      <path d="M44 54s-4 4-4 6a4 4 0 0 0 8 0c0-2-4-6-4-6Z" />
    </>
  );
}

export function CategoryArt({
  categoria,
  variante = "placa",
  fundo = "cor",
  className,
}: CategoryArtProps) {
  const isElectronics = categoria === "eletronicos";
  const isMini = variante === "mini";
  const width = isMini ? 88 : 320;
  const height = isMini ? 88 : 160;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      // Display stays controlled by the page's responsive classes.
      className={cn(
        "h-auto w-full overflow-hidden",
        isMini ? "rounded-[20px]" : "rounded-[24px]",
        className,
      )}
      style={{ color: "#0A0F3D", height: "auto" }}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        width={width}
        height={height}
        rx={isMini ? 20 : 24}
        fill={
          fundo === "claro" ? "white" : isElectronics ? "#7ADFFF" : "#FF9AC8"
        }
        fillOpacity={fundo === "claro" ? 0.35 : 1}
        stroke="none"
      />
      {!isMini && (
        <g fill="white" fillOpacity={0.25} stroke="none">
          <path d="M0 42.76a76 76 0 0 1 0 114.48Z" />
          <path d="M320 28.77a65 65 0 0 0 0 102.46Z" />
        </g>
      )}
      {isMini ? (
        isElectronics ? (
          <Headphones />
        ) : (
          <DropperBottle />
        )
      ) : isElectronics ? (
        <>
          <g transform="translate(48 30)">
            <Headphones />
          </g>
          <g transform="rotate(12 226 80)">
            <rect x="215" y="21" width="22" height="29" rx="7" />
            <rect x="215" y="110" width="22" height="29" rx="7" />
            <rect x="202" y="46" width="48" height="68" rx="15" />
            <rect x="209" y="53" width="34" height="54" rx="9" />
            <path d="m229 66-13 17h10l-4 13 14-18h-10Z" fill="#C6FF3D" />
            <path d="M250 70h4v12h-4" />
          </g>
        </>
      ) : (
        <>
          <g transform="translate(52 26)">
            <DropperBottle />
          </g>
          <path d="M227 33s-16 18-16 28a16 16 0 0 0 32 0c0-10-16-28-16-28Z" />
          <path d="M219 62a8 8 0 0 0 8 8" />
          <rect x="198" y="106" width="62" height="15" rx="5" />
          <path d="M202 121v13a6 6 0 0 0 6 6h42a6 6 0 0 0 6-6v-13" />
          <path d="M213 130h32" />
        </>
      )}
    </svg>
  );
}
