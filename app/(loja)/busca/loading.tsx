import { ProductGridSkeleton } from "@/components/loja/product-card-skeleton";

// Shown while a store page loads (category, search, product).
export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-5 w-48 rounded-md bg-borda motion-safe:animate-pulse" />
      <div className="h-9 w-72 max-w-full rounded-lg bg-borda motion-safe:animate-pulse" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
