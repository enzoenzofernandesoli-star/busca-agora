import { notFound } from "next/navigation";

// Any unknown URL falls here, so the 404 renders inside the store layout
// (header, footer, bottom nav) instead of the bare root not-found.
export default function UnknownRoute() {
  notFound();
}
