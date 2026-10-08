// Bridge between instrumentation-client.ts (where Next.js reports that a
// navigation started) and the progress bar component.
export const NAV_START_EVENT = "ba:navegacao-inicio";

export function announceNavigationStart(url: string) {
  // Next.js calls the hook inside the navigation's startTransition: a state
  // update made right there joins the transition and only shows together
  // with the new page (the bar would never appear). A microtask runs after
  // that scope, so the bar renders at once, as an urgent update.
  queueMicrotask(() =>
    window.dispatchEvent(new CustomEvent(NAV_START_EVENT, { detail: url })),
  );
}
