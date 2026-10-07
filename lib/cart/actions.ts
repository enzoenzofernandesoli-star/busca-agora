"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/db/admin";

import { getCartCount, resolveCartId } from "./server";

export type AddToCartResult = {
  ok: boolean;
  message?: string;
  cartCount?: number;
};

const addSchema = z.object({
  variantId: z.uuid(),
  quantidade: z.coerce.number().int().min(1).max(10),
});

const errorMessages: Record<string, string> = {
  out_of_stock: "Esse produto acabou de esgotar.",
  variant_not_found: "Esse produto não está mais à venda.",
};

// Prices never come from the browser: the cart stores variant and quantity
// only, and the cart page reads the current price from the database.
export async function addToCart(formData: FormData): Promise<AddToCartResult> {
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Escolha a quantidade e tente de novo." };
  }
  const cartId = await resolveCartId(true);
  if (!cartId) return { ok: false, message: "Não deu certo agora." };

  const { error } = await createAdminClient().rpc("cart_add", {
    p_cart_id: cartId,
    p_variant_id: parsed.data.variantId,
    p_quantidade: parsed.data.quantidade,
  });
  if (error) {
    return {
      ok: false,
      message:
        errorMessages[error.message] ??
        "Não deu certo agora. Tente de novo em instantes.",
    };
  }
  revalidatePath("/carrinho");
  return { ok: true, cartCount: await getCartCount() };
}

const lineSchema = z.object({
  itemId: z.uuid(),
  quantidade: z.coerce.number().int().min(0).max(10),
});

export async function setCartQuantity(formData: FormData): Promise<void> {
  const parsed = lineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const cartId = await resolveCartId(false);
  if (!cartId) return;
  const { error } = await createAdminClient().rpc("cart_set_quantity", {
    p_cart_id: cartId,
    p_item_id: parsed.data.itemId,
    p_quantidade: parsed.data.quantidade,
  });
  // item_not_found = stale page; the revalidated cart shows the truth.
  if (error && error.message !== "item_not_found") {
    throw new Error(`cart_set_quantity: ${error.message}`);
  }
  revalidatePath("/carrinho");
}

export async function removeFromCart(formData: FormData): Promise<void> {
  const itemId = formData.get("itemId");
  const data = new FormData();
  data.set("itemId", typeof itemId === "string" ? itemId : "");
  data.set("quantidade", "0");
  await setCartQuantity(data);
}
