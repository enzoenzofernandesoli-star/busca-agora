-- Phase 4 review fixes (ChatGPT review of PR #7, 2026-10-07).
--
-- 1. Same lock order in every cart write: the cart row first, then its
--    items. cart_add already did that; cart_set_quantity locked the item
--    first, so an add and a change on the same cart could deadlock (40P01).
-- 2. Cart writes are server-only (service role through these functions).
--    Customers lose the direct INSERT/UPDATE/DELETE grants on carts and
--    cart_items, which let them skip the stock and 10-unit checks. Reading
--    their own cart through RLS stays.

revoke insert, update, delete on public.carts, public.cart_items from authenticated;

create or replace function public.cart_set_quantity(
  p_cart_id uuid,
  p_item_id uuid,
  p_quantidade integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant uuid;
  v_max integer;
  v_nova integer;
begin
  if p_quantidade is null or p_quantidade < 0 then
    raise exception 'invalid_quantity';
  end if;

  -- Cart first (same order as cart_add and cart_merge).
  perform 1 from public.carts where id = p_cart_id for update;
  if not found then
    raise exception 'item_not_found';
  end if;

  -- The item must belong to the cart the server resolved for this caller.
  select variant_id into v_variant
  from public.cart_items
  where id = p_item_id and cart_id = p_cart_id
  for update;
  if not found then
    raise exception 'item_not_found';
  end if;

  v_max := coalesce(public.cart_max_quantity(v_variant), 0);
  v_nova := least(p_quantidade, v_max);

  if v_nova < 1 then
    delete from public.cart_items where id = p_item_id;
    v_nova := 0;
  else
    update public.cart_items set quantidade = v_nova where id = p_item_id;
  end if;

  update public.carts set updated_at = now() where id = p_cart_id;
  return v_nova;
end;
$$;

-- cart_merge: lock both carts up front, always in id order, so a merge can
-- never wait on a cart another merge or write holds in the opposite order.
create or replace function public.cart_merge(p_session_id text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest uuid;
  v_user_cart uuid;
  v_item record;
begin
  select id into v_guest from public.carts where session_id = p_session_id;
  if not found then
    return;
  end if;

  v_user_cart := public.cart_resolve(p_user_id, null);

  perform 1 from public.carts
  where id in (v_guest, v_user_cart)
  order by id
  for update;

  for v_item in
    select variant_id, quantidade
    from public.cart_items
    where cart_id = v_guest
    order by variant_id
  loop
    begin
      perform public.cart_add(v_user_cart, v_item.variant_id, v_item.quantidade);
    exception
      -- A variant that sold out or left the store is simply dropped.
      when raise_exception then null;
    end;
  end loop;

  delete from public.carts where id = v_guest;
end;
$$;
