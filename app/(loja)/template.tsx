// Re-mounted on every page change: the new page fades in, so the visitor
// sees it arrive (no animation when the device asks for reduced motion).
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 motion-safe:animate-[page-in_200ms_ease-out] md:gap-10">
      {children}
    </div>
  );
}
