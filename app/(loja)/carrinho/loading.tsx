// Shown at once when the cart tab is tapped, while prices and stock load.
export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <div className="h-10 w-48 rounded-lg bg-borda motion-safe:animate-pulse" />
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
        <div className="flex flex-1 flex-col gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-[120px] rounded-[22px] border border-borda bg-white motion-safe:animate-pulse"
            />
          ))}
        </div>
        <div className="h-[320px] rounded-[22px] border border-borda bg-white motion-safe:animate-pulse md:w-[380px] md:rounded-[28px]" />
      </div>
    </div>
  );
}
