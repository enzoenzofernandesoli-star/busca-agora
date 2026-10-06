import Image from "next/image";

// logo-d viewBox is 6490 x 1031 (ratio ~6.295).
const RATIO = 6490 / 1031;

type LogoProps = {
  height: number;
  tone?: "branco" | "escuro";
  priority?: boolean;
  className?: string;
};

export function LogoD({
  height,
  tone = "branco",
  priority,
  className,
}: LogoProps) {
  return (
    <Image
      src={`/brand/logo-d-${tone}.svg`}
      alt="Busca Agora"
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      unoptimized
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
