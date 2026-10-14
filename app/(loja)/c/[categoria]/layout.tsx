import { notFound } from "next/navigation";

// Unknown categories answer a real 404 here, before the loading screen of
// this segment starts streaming (a notFound() inside it would send 200).
export default async function CategoriaLayout(
  props: LayoutProps<"/c/[categoria]">,
) {
  const { categoria } = await props.params;
  if (categoria !== "eletronicos" && categoria !== "cosmeticos") notFound();
  return props.children;
}
