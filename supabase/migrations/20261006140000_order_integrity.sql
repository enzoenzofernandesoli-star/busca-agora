-- Phase 1 review fixes (Codex, 2026-10-06).
--
-- 1. orders.status and the stock markers can only change through
--    set_order_status / reserve_stock / restore_stock: the service role
--    loses direct UPDATE on orders and may only INSERT the checkout columns.
-- 2. An order only becomes 'paid' with its stock reserved and not returned.
-- 3. restore_stock only gives units back for a canceled order.
-- 4. Once the stock is reserved, the order's items are frozen, so the units
--    given back are exactly the units taken.
-- 5. Order numbers keep at least six digits without truncating past 999999.

-- ---------------------------------------------------------------------------
-- 1. Only the functions change status and stock markers
-- ---------------------------------------------------------------------------

-- Orders are a fiscal record: never deleted, never edited directly.
revoke insert, update, delete on public.orders from service_role;

-- Checkout writes these; status starts as pending_payment (column default),
-- numero comes from the sequence, the markers stay null.
grant insert (
  id, user_id, subtotal_cents, frete_cents, desconto_cents, total_cents,
  frete_servico, endereco, cliente_nome, cliente_cpf, payment_method
) on public.orders to service_role;

-- ---------------------------------------------------------------------------
-- 5. Order number
-- ---------------------------------------------------------------------------

-- BA-000001 ... BA-999999, then BA-1000000 (lpad alone would truncate).
create function public.format_order_number(p_n bigint)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'BA-' || lpad(p_n::text, greatest(6, length(p_n::text)), '0');
$$;

create function public.next_order_number()
returns text
language sql
volatile
set search_path = ''
as $$
  select public.format_order_number(nextval('public.order_number_seq'));
$$;

revoke execute on function public.format_order_number(bigint) from public, anon, authenticated;
revoke execute on function public.next_order_number() from public, anon, authenticated;
grant execute on function public.format_order_number(bigint) to service_role;
grant execute on function public.next_order_number() to service_role;

alter table public.orders alter column numero set default public.next_order_number();

-- ---------------------------------------------------------------------------
-- 4. Items are frozen once the stock is reserved
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER: FOR SHARE needs UPDATE on orders, which the service
-- role no longer has.
create function public.order_items_frozen_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_reserved timestamptz;
begin
  foreach v_order_id in array array_remove(
    array[
      case when tg_op <> 'INSERT' then old.order_id end,
      case when tg_op <> 'DELETE' then new.order_id end
    ],
    null
  )
  loop
    -- Always lock the order row (no filter in WHERE, or an unreserved order
    -- would not be locked at all). FOR SHARE waits for a reserve_stock
    -- running on the same order, and makes reserve_stock wait for this
    -- change to commit, so reserving always sees the final items.
    select estoque_baixado_em into v_reserved
    from public.orders
    where id = v_order_id
    for share;

    if v_reserved is not null then
      raise exception 'order_items_frozen' using detail = v_order_id::text;
    end if;
  end loop;

  return coalesce(new, old);
end;
$$;

revoke execute on function public.order_items_frozen_guard() from public, anon, authenticated;

create trigger order_items_frozen
  before insert or update or delete on public.order_items
  for each row execute function public.order_items_frozen_guard();

-- ---------------------------------------------------------------------------
-- reserve_stock: same as before, and refuses an order without items
-- ---------------------------------------------------------------------------

create or replace function public.reserve_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  -- Lock the order: two calls for the same order run one after the other,
  -- and item changes wait (order_items_frozen_guard).
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using detail = p_order_id::text;
  end if;

  if v_order.estoque_baixado_em is not null then
    return;
  end if;

  if v_order.status <> 'pending_payment' then
    raise exception 'order_not_pending' using detail = v_order.status::text;
  end if;

  if not exists (select 1 from public.order_items where order_id = p_order_id) then
    raise exception 'order_has_no_items' using detail = p_order_id::text;
  end if;

  if exists (
    select 1 from public.order_items
    where order_id = p_order_id and variant_id is null
  ) then
    raise exception 'variant_not_found';
  end if;

  -- Lock every variant of the order, always in id order, so two orders
  -- sharing variants can never deadlock.
  perform 1
  from public.product_variants
  where id in (select variant_id from public.order_items where order_id = p_order_id)
  order by id
  for update;

  for v_item in
    select variant_id, sum(quantidade)::integer as quantidade
    from public.order_items
    where order_id = p_order_id
    group by variant_id
    order by variant_id
  loop
    update public.product_variants
    set estoque = estoque - v_item.quantidade
    where id = v_item.variant_id
      and estoque >= v_item.quantidade;

    if not found then
      raise exception 'insufficient_stock' using detail = v_item.variant_id::text;
    end if;
  end loop;

  update public.orders set estoque_baixado_em = now() where id = p_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. restore_stock: only for canceled orders
-- ---------------------------------------------------------------------------

create or replace function public.restore_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using detail = p_order_id::text;
  end if;

  if v_order.estoque_baixado_em is null or v_order.estoque_devolvido_em is not null then
    return;
  end if;

  if v_order.status <> 'canceled' then
    raise exception 'order_not_canceled' using detail = v_order.status::text;
  end if;

  -- Items are frozen since the reservation, so these are exactly the
  -- reserved units.
  for v_item in
    select variant_id, sum(quantidade)::integer as quantidade
    from public.order_items
    where order_id = p_order_id and variant_id is not null
    group by variant_id
    order by variant_id
  loop
    update public.product_variants
    set estoque = estoque + v_item.quantidade
    where id = v_item.variant_id;
  end loop;

  update public.orders set estoque_devolvido_em = now() where id = p_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. set_order_status: 'paid' requires reserved stock
-- ---------------------------------------------------------------------------

create or replace function public.set_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_detalhe jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using detail = p_order_id::text;
  end if;

  if v_order.status = p_status then
    return;
  end if;

  if not public.order_transition_allowed(v_order.status, p_status) then
    raise exception 'invalid_transition'
      using detail = v_order.status::text || ' -> ' || p_status::text;
  end if;

  if p_status = 'paid'
    and (v_order.estoque_baixado_em is null or v_order.estoque_devolvido_em is not null)
  then
    raise exception 'stock_not_reserved' using detail = p_order_id::text;
  end if;

  update public.orders set status = p_status where id = p_order_id;

  insert into public.order_events (order_id, evento, detalhe)
  values (
    p_order_id,
    'status_changed',
    coalesce(p_detalhe, '{}'::jsonb)
      || jsonb_build_object('de', v_order.status, 'para', p_status)
  );

  if p_status = 'canceled' then
    perform public.restore_stock(p_order_id);
  end if;
end;
$$;
