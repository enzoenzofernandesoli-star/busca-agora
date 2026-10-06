-- Phase 1: signup trigger, stock reservation and order status functions.
--
-- Stock is reserved when the order is created (pending_payment) and given
-- back when the order is canceled (unpaid Pix after 30 min, boleto after
-- 3 days). Decision of 2026-10-06; see CLAUDE.md section 5.

-- ---------------------------------------------------------------------------
-- Profile on signup
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Stock
-- ---------------------------------------------------------------------------

-- Takes the order's units out of stock. All or nothing: if any variant is
-- short, raises 'insufficient_stock' and nothing changes. Calling it again
-- for the same order does nothing (rule 4).
create function public.reserve_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  -- Lock the order: two calls for the same order run one after the other.
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

-- Gives a reserved order's units back. Does nothing if the stock was never
-- reserved or was already given back.
create function public.restore_stock(p_order_id uuid)
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
-- Order status (rule 8: only the server changes it, always with an event)
-- ---------------------------------------------------------------------------

create function public.order_transition_allowed(
  p_from public.order_status,
  p_to public.order_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (p_from, p_to) in (
    ('pending_payment', 'paid'),
    ('pending_payment', 'canceled'),
    ('paid', 'invoiced'),
    -- NF-e off (NFE_ENABLED=false): label with content declaration.
    ('paid', 'label_ready'),
    ('paid', 'refunded'),
    ('invoiced', 'label_ready'),
    ('invoiced', 'refunded'),
    ('label_ready', 'printed'),
    ('label_ready', 'refunded'),
    ('printed', 'shipped'),
    ('printed', 'refunded'),
    ('shipped', 'delivered'),
    ('delivered', 'refunded')
  );
$$;

-- Changes the status and writes the order_events row in the same
-- transaction. Setting the current status again does nothing (a repeated
-- webhook). Canceling gives the reserved stock back.
create function public.set_order_status(
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
  v_from public.order_status;
begin
  select status into v_from from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using detail = p_order_id::text;
  end if;

  if v_from = p_status then
    return;
  end if;

  if not public.order_transition_allowed(v_from, p_status) then
    raise exception 'invalid_transition' using detail = v_from::text || ' -> ' || p_status::text;
  end if;

  update public.orders set status = p_status where id = p_order_id;

  insert into public.order_events (order_id, evento, detalhe)
  values (
    p_order_id,
    'status_changed',
    coalesce(p_detalhe, '{}'::jsonb)
      || jsonb_build_object('de', v_from, 'para', p_status)
  );

  if p_status = 'canceled' then
    perform public.restore_stock(p_order_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Only the server (service role) may call these
-- ---------------------------------------------------------------------------

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.reserve_stock(uuid) from public, anon, authenticated;
revoke execute on function public.restore_stock(uuid) from public, anon, authenticated;
revoke execute on function public.set_order_status(uuid, public.order_status, jsonb)
  from public, anon, authenticated;
revoke execute on function public.order_transition_allowed(public.order_status, public.order_status)
  from public, anon, authenticated;

grant execute on function public.reserve_stock(uuid) to service_role;
grant execute on function public.restore_stock(uuid) to service_role;
grant execute on function public.set_order_status(uuid, public.order_status, jsonb)
  to service_role;
grant execute on function public.order_transition_allowed(public.order_status, public.order_status)
  to service_role;
