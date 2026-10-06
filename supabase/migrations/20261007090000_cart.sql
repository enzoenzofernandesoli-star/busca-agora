-- Phase 4: cart functions.
--
-- The server owns every cart write (Server Actions with the service role):
-- it decides whose cart it is from the verified session (logged in) or the
-- httpOnly `ba_carrinho` cookie (visitor). These functions are therefore
-- service role only and always receive the cart id the server resolved.
-- Every change checks the variant is on sale and caps the quantity at the
-- stock (and at 10 per item), inside one transaction.

create function public.cart_resolve(
  p_user_id uuid default null,
  p_session_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart uuid;
begin
  if num_nonnulls(p_user_id, p_session_id) <> 1 then
    raise exception 'cart_owner_required';
  end if;

  if p_user_id is not null then
    insert into public.carts (user_id) values (p_user_id)
    on conflict (user_id) do update set updated_at = now()
    returning id into v_cart;
  else
    insert into public.carts (session_id) values (p_session_id)
    on conflict (session_id) do update set updated_at = now()
    returning id into v_cart;
  end if;
  return v_cart;
end;
$$;

-- Max units of one variant a cart can hold: the stock, at most 10.
create function public.cart_max_quantity(p_variant_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select least(v.estoque, 10)
  from public.product_variants v
  join public.products p on p.id = v.product_id and p.ativo
  join public.categories c on c.id = p.category_id and c.ativa
  where v.id = p_variant_id;
$$;

-- Adds units (summing with what is already there). Returns the quantity of
-- that variant now in the cart.
create function public.cart_add(
  p_cart_id uuid,
  p_variant_id uuid,
  p_quantidade integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max integer;
  v_atual integer;
  v_nova integer;
begin
  if p_quantidade is null or p_quantidade < 1 then
    raise exception 'invalid_quantity';
  end if;

  perform 1 from public.carts where id = p_cart_id for update;
  if not found then
    raise exception 'cart_not_found';
  end if;

  v_max := public.cart_max_quantity(p_variant_id);
  if v_max is null then
    raise exception 'variant_not_found';
  end if;
  if v_max < 1 then
    raise exception 'out_of_stock';
  end if;

  select quantidade into v_atual
  from public.cart_items
  where cart_id = p_cart_id and variant_id = p_variant_id;

  v_nova := least(coalesce(v_atual, 0) + p_quantidade, v_max);

  insert into public.cart_items (cart_id, variant_id, quantidade)
  values (p_cart_id, p_variant_id, v_nova)
  on conflict (cart_id, variant_id) do update set quantidade = excluded.quantidade;

  update public.carts set updated_at = now() where id = p_cart_id;
  return v_nova;
end;
$$;

-- Sets the quantity of one line (0 removes it), capped at the stock.
-- Returns the quantity kept.
create function public.cart_set_quantity(
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

-- Moves a visitor cart into the account cart at login, summing quantities
-- (capped at the stock). The visitor cart is deleted.
create function public.cart_merge(p_session_id text, p_user_id uuid)
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
  select id into v_guest from public.carts where session_id = p_session_id for update;
  if not found then
    return;
  end if;

  v_user_cart := public.cart_resolve(p_user_id, null);

  for v_item in
    select variant_id, quantidade from public.cart_items where cart_id = v_guest
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

revoke execute on function public.cart_resolve(uuid, text) from public, anon, authenticated;
revoke execute on function public.cart_max_quantity(uuid) from public, anon, authenticated;
revoke execute on function public.cart_add(uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.cart_set_quantity(uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.cart_merge(text, uuid) from public, anon, authenticated;

grant execute on function public.cart_resolve(uuid, text) to service_role;
grant execute on function public.cart_max_quantity(uuid) to service_role;
grant execute on function public.cart_add(uuid, uuid, integer) to service_role;
grant execute on function public.cart_set_quantity(uuid, uuid, integer) to service_role;
grant execute on function public.cart_merge(text, uuid) to service_role;
