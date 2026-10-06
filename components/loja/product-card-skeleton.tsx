export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[18px] border border-borda bg-white md:rounded-[22px]"
    >
      <div className="h-[150px] animate-pulse bg-fundo motion-reduce:animate-none md:h-[210px]" />
      <div className="space-y-3 p-3 md:px-[18px] md:pt-4 md:pb-5">
        <div className="h-3 w-20 animate-pulse rounded bg-fundo motion-reduce:animate-none" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-fundo motion-reduce:animate-none" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-fundo motion-reduce:animate-none" />
        </div>
        <div className="h-7 w-28 animate-pulse rounded bg-fundo motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] md:gap-5"
    >
      <span className="sr-only">Carregando produtos</span>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
