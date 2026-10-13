// Shown at once when an account tab is tapped.
export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <div className="h-10 w-56 rounded-lg bg-borda motion-safe:animate-pulse" />
      <div className="h-[360px] rounded-[22px] border border-borda bg-white motion-safe:animate-pulse md:rounded-[28px]" />
    </div>
  );
}
