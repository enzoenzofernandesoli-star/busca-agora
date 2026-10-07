import "server-only";

import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/db/admin";
import type { CategorySlug } from "@/lib/site";

// Visitor carts are keyed by an httpOnly cookie holding a random UUID. The
// cookie is the only proof of ownership, so cart rows are read and written
// by the server (service role) with the id it resolved here, never by the
// browser.
export const GUEST_COOKIE = "ba_carrinho";
const GUEST_MAX_AGE = 60 * 60 * 24 * 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Owner = { userId: string } | { sessionId: string };

async function guestSession(create: boolean): Promise<string | null> {
  const store = await cookies();
  const current = store.get(GUEST_COOKIE)?.value;
  if (current && UUID.test(current)) return current;
  if (!create) return null;
  const id = randomUUID();
  // Only possible inside a Server Action or Route Handler (create = true).
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_MAX_AGE,
  });
  return id;
}

async function currentOwner(create: boolean): Promise<Owner | null> {
  const user = await getCurrentUser();
  if (user) return { userId: user.id };
  const sessionId = await guestSession(create);
  return sessionId ? { sessionId } : null;
}

/** The cart id for this request; with create=false, null when there is none. */
export async function resolveCartId(create: boolean): Promise<string | null> {
  const owner = await currentOwner(create);
  if (!owner) return null;
  const admin = createAdminClient();

  if (!create) {
    const query = admin.from("carts").select("id");
    const { data } = await (
      "userId" in owner
        ? query.eq("user_id", owner.userId)
        : query.eq("session_id", owner.sessionId)
    ).maybeSingle();
    return data?.id ?? null;
  }

  const { data, error } = await admin.rpc(
    "cart_resolve",
    "userId" in owner
      ? { p_user_id: owner.userId }
      : { p_session_id: owner.sessionId },
  );
  if (error || !data) throw new Error(`cart_resolve: ${error?.message}`);
  return data;
}

export type CartLineData = {
  id: string;
  variantId: string;
  slug: string;
  nome: string;
  varianteNome: string;
  categoria: CategorySlug;
  /** Current price from the database, integer cents. */
  precoCents: number;
  quantidade: number;
  estoque: number;
  disponivel: boolean;
  imagemUrl: string | null;
};

export type CartData = {
  linhas: CartLineData[];
  /** Units of the available lines. */
  quantidadeItens: number;
  /** Available lines only, integer cents. */
  subtotalCents: number;
};

const EMPTY: CartData = { linhas: [], quantidadeItens: 0, subtotalCents: 0 };

export async function getCart(): Promise<CartData> {
  const cartId = await resolveCartId(false);
  if (!cartId) return EMPTY;

  // Explicit columns: custo_cents never leaves the database.
  const { data, error } = await createAdminClient()
    .from("cart_items")
    .select(
      `id, quantidade, created_at,
       product_variants!inner (
         id, nome, preco_cents, estoque,
         products!inner (
           slug, nome, ativo,
           categories!inner ( slug, ativa ),
           product_images ( url, ordem )
         )
       )`,
    )
    .eq("cart_id", cartId)
    .order("created_at");
  if (error) throw new Error(`cart read: ${error.message}`);

  const linhas = (data ?? []).map((row): CartLineData => {
    const v = row.product_variants;
    const p = v.products;
    const categoria: CategorySlug =
      p.categories.slug === "cosmeticos" ? "cosmeticos" : "eletronicos";
    const imagem = [...(p.product_images ?? [])].sort(
      (a, b) => a.ordem - b.ordem,
    )[0];
    return {
      id: row.id,
      variantId: v.id,
      slug: p.slug,
      nome: p.nome,
      varianteNome: v.nome,
      categoria,
      precoCents: v.preco_cents,
      quantidade: row.quantidade,
      estoque: v.estoque,
      disponivel: p.ativo && p.categories.ativa && v.estoque > 0,
      imagemUrl: imagem?.url ?? null,
    };
  });

  const ativas = linhas.filter((l) => l.disponivel);
  return {
    linhas,
    quantidadeItens: ativas.reduce(
      (n, l) => n + Math.min(l.quantidade, l.estoque),
      0,
    ),
    subtotalCents: ativas.reduce(
      (sum, l) => sum + l.precoCents * Math.min(l.quantidade, l.estoque),
      0,
    ),
  };
}

export async function getCartCount(): Promise<number> {
  return (await getCart()).quantidadeItens;
}

/**
 * At login: moves the visitor cart into the account cart and drops the
 * cookie. Never blocks the login: a failure only leaves the visitor cart.
 */
export async function mergeGuestCart(userId: string): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(GUEST_COOKIE)?.value;
  if (!sessionId || !UUID.test(sessionId)) return;
  const { error } = await createAdminClient().rpc("cart_merge", {
    p_session_id: sessionId,
    p_user_id: userId,
  });
  if (!error) store.delete(GUEST_COOKIE);
}
