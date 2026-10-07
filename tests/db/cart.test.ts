import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createCustomer, createVariant, serviceClient } from "./helpers";

const admin = () => serviceClient();

async function guestCart() {
  const { data, error } = await admin().rpc("cart_resolve", {
    p_session_id: randomUUID(),
  });
  if (error) throw error;
  return data as string;
}

async function lines(cartId: string) {
  const { data } = await admin()
    .from("cart_items")
    .select("id, variant_id, quantidade")
    .eq("cart_id", cartId);
  return data ?? [];
}

describe("cart functions", () => {
  it("adds, sums and caps at the stock", async () => {
    const cart = await guestCart();
    const { variantId } = await createVariant({ estoque: 3 });

    expect(
      (
        await admin().rpc("cart_add", {
          p_cart_id: cart,
          p_variant_id: variantId,
          p_quantidade: 2,
        })
      ).data,
    ).toBe(2);
    expect(
      (
        await admin().rpc("cart_add", {
          p_cart_id: cart,
          p_variant_id: variantId,
          p_quantidade: 5,
        })
      ).data,
    ).toBe(3);
    expect(await lines(cart)).toHaveLength(1);
  });

  it("caps at 10 per item even with more stock", async () => {
    const cart = await guestCart();
    const { variantId } = await createVariant({ estoque: 50 });
    const r = await admin().rpc("cart_add", {
      p_cart_id: cart,
      p_variant_id: variantId,
      p_quantidade: 30,
    });
    expect(r.data).toBe(10);
  });

  it("refuses sold-out and inactive variants", async () => {
    const cart = await guestCart();
    const esgotado = await createVariant({ estoque: 0 });
    const inativo = await createVariant({ estoque: 5, ativo: false });

    const a = await admin().rpc("cart_add", {
      p_cart_id: cart,
      p_variant_id: esgotado.variantId,
      p_quantidade: 1,
    });
    expect(a.error?.message).toBe("out_of_stock");

    const b = await admin().rpc("cart_add", {
      p_cart_id: cart,
      p_variant_id: inativo.variantId,
      p_quantidade: 1,
    });
    expect(b.error?.message).toBe("variant_not_found");
  });

  it("sets quantity, removes at zero, and only touches its own cart", async () => {
    const mine = await guestCart();
    const other = await guestCart();
    const { variantId } = await createVariant({ estoque: 4 });
    await admin().rpc("cart_add", {
      p_cart_id: mine,
      p_variant_id: variantId,
      p_quantidade: 1,
    });
    await admin().rpc("cart_add", {
      p_cart_id: other,
      p_variant_id: variantId,
      p_quantidade: 1,
    });
    const [item] = await lines(mine);
    const [otherItem] = await lines(other);

    expect(
      (
        await admin().rpc("cart_set_quantity", {
          p_cart_id: mine,
          p_item_id: item!.id,
          p_quantidade: 9,
        })
      ).data,
    ).toBe(4);

    // An item id from another cart is refused, even with the service role.
    const cross = await admin().rpc("cart_set_quantity", {
      p_cart_id: mine,
      p_item_id: otherItem!.id,
      p_quantidade: 0,
    });
    expect(cross.error?.message).toBe("item_not_found");
    expect(await lines(other)).toHaveLength(1);

    expect(
      (
        await admin().rpc("cart_set_quantity", {
          p_cart_id: mine,
          p_item_id: item!.id,
          p_quantidade: 0,
        })
      ).data,
    ).toBe(0);
    expect(await lines(mine)).toEqual([]);
  });

  it("merges the visitor cart into the account cart at login", async () => {
    const c = await createCustomer("carrinho-merge");
    const session = randomUUID();
    const guest = (await admin().rpc("cart_resolve", { p_session_id: session }))
      .data as string;
    const userCart = (await admin().rpc("cart_resolve", { p_user_id: c.id }))
      .data as string;
    const a = await createVariant({ estoque: 5 });
    const b = await createVariant({ estoque: 2 });
    const esgotou = await createVariant({ estoque: 1 });

    await admin().rpc("cart_add", {
      p_cart_id: guest,
      p_variant_id: a.variantId,
      p_quantidade: 2,
    });
    await admin().rpc("cart_add", {
      p_cart_id: guest,
      p_variant_id: b.variantId,
      p_quantidade: 2,
    });
    await admin().rpc("cart_add", {
      p_cart_id: guest,
      p_variant_id: esgotou.variantId,
      p_quantidade: 1,
    });
    await admin().rpc("cart_add", {
      p_cart_id: userCart,
      p_variant_id: a.variantId,
      p_quantidade: 1,
    });
    await admin().rpc("cart_add", {
      p_cart_id: userCart,
      p_variant_id: b.variantId,
      p_quantidade: 1,
    });
    await admin()
      .from("product_variants")
      .update({ estoque: 0 })
      .eq("id", esgotou.variantId);

    const { error } = await admin().rpc("cart_merge", {
      p_session_id: session,
      p_user_id: c.id,
    });
    expect(error).toBeNull();

    const merged = Object.fromEntries(
      (await lines(userCart)).map((l) => [l.variant_id, l.quantidade]),
    );
    expect(merged).toEqual({ [a.variantId]: 3, [b.variantId]: 2 });
    const { data: gone } = await admin()
      .from("carts")
      .select("id")
      .eq("id", guest);
    expect(gone).toEqual([]);
  });

  it("customers cannot call the cart functions directly", async () => {
    const c = await createCustomer("carrinho-rpc");
    const { error } = await c.client.rpc("cart_resolve", { p_user_id: c.id });
    expect(error).not.toBeNull();
  });
});

describe("cart hardening (review of PR #7)", () => {
  it("customers cannot write their cart directly", async () => {
    const c = await createCustomer("carrinho-dml");
    const cart = (await admin().rpc("cart_resolve", { p_user_id: c.id }))
      .data as string;
    const { variantId } = await createVariant({ estoque: 3 });

    const insert = await c.client
      .from("cart_items")
      .insert({ cart_id: cart, variant_id: variantId, quantidade: 999 });
    expect(insert.error?.code).toBe("42501");

    await admin().rpc("cart_add", {
      p_cart_id: cart,
      p_variant_id: variantId,
      p_quantidade: 1,
    });
    const update = await c.client
      .from("cart_items")
      .update({ quantidade: 999 })
      .eq("cart_id", cart);
    expect(update.error?.code).toBe("42501");
    const del = await c.client.from("carts").delete().eq("id", cart);
    expect(del.error?.code).toBe("42501");

    // Reading the own cart still works through RLS.
    const read = await c.client
      .from("cart_items")
      .select("quantidade")
      .eq("cart_id", cart);
    expect(read.data).toEqual([{ quantidade: 1 }]);
  });

  it("adds and quantity changes on the same cart never deadlock", async () => {
    const cart = await guestCart();
    const { variantId } = await createVariant({ estoque: 10 });
    await admin().rpc("cart_add", {
      p_cart_id: cart,
      p_variant_id: variantId,
      p_quantidade: 1,
    });
    const [item] = await lines(cart);

    const calls = Array.from({ length: 30 }, (_, i) =>
      i % 2 === 0
        ? admin().rpc("cart_add", {
            p_cart_id: cart,
            p_variant_id: variantId,
            p_quantidade: 1,
          })
        : admin().rpc("cart_set_quantity", {
            p_cart_id: cart,
            p_item_id: item!.id,
            p_quantidade: 2,
          }),
    );
    const results = await Promise.all(calls);
    const errors = results
      .map((r) => r.error?.message)
      .filter((m) => m && m !== "item_not_found");
    expect(errors).toEqual([]);
  });
});
