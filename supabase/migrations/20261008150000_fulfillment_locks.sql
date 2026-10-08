-- Phase 6 review fixes (Codex, 2026-10-08).
--
-- 1. Fulfillment lease per order: the label and print jobs take it before
--    any paid or physical effect (buying, printing) and release it at the
--    end. Taking it re-checks, under the order's row lock, that the order
--    can still be fulfilled. Two processes never work on one order at once,
--    and a refund or cancel waits until the lease is released or expires.
-- 2. shipments.me_order_id cannot change once set: a second execution can
--    never replace the label we may already have paid for.
-- 3. shipments.impressoes: what each print round already sent, per document,
--    so a late retry never prints a document twice.

alter table public.shipments
  add column trava_tipo text,
  add column trava_ate timestamptz,
  add column impressoes jsonb not null default '{}'::jsonb;

-- 1 -------------------------------------------------------------------------
-- Returns 'ok' (lease taken), 'ocupado' (another execution holds it) or
-- 'inelegivel' (the order can no longer be fulfilled: canceled, refunded...).
create function public.fulfillment_lock(
  p_order_id uuid,
  p_tipo text,
  p_segundos integer default 300
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.order_status;
  v_ate timestamptz;
begin
  select status into v_status from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using detail = p_order_id::text;
  end if;
  if not (
    (p_tipo = 'label' and v_status in ('paid', 'invoiced', 'label_ready'))
    or (p_tipo = 'print' and v_status in ('label_ready', 'printed', 'shipped'))
  ) then
    return 'inelegivel';
  end if;

  insert into public.shipments (order_id, status)
  values (p_order_id, 'aguardando')
  on conflict (order_id) do nothing;

  select trava_ate into v_ate from public.shipments
  where order_id = p_order_id for update;
  if v_ate is not null and v_ate > now() then
    return 'ocupado';
  end if;

  update public.shipments
  set trava_tipo = p_tipo,
      trava_ate = now() + make_interval(secs => greatest(30, least(p_segundos, 900)))
  where order_id = p_order_id;
  return 'ok';
end;
$$;

create function public.fulfillment_unlock(p_order_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.shipments set trava_tipo = null, trava_ate = null
  where order_id = p_order_id;
$$;

revoke execute on function public.fulfillment_lock(uuid, text, integer)
  from public, anon, authenticated;
revoke execute on function public.fulfillment_unlock(uuid)
  from public, anon, authenticated;
grant execute on function public.fulfillment_lock(uuid, text, integer) to service_role;
grant execute on function public.fulfillment_unlock(uuid) to service_role;

-- A refund or cancel while a label is being bought or printed would leave a
-- paid label for a refunded order: refuse it until the lease ends.
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

  if p_status in ('refunded', 'canceled') and exists (
    select 1 from public.shipments
    where order_id = p_order_id and trava_ate > now()
  ) then
    raise exception 'fulfillment_in_progress' using detail = p_order_id::text;
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

-- 2 -------------------------------------------------------------------------
create function public.shipments_keep_me_order_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.me_order_id is not null
    and new.me_order_id is distinct from old.me_order_id
  then
    raise exception 'me_order_id_immutable' using detail = old.order_id::text;
  end if;
  return new;
end;
$$;

create trigger shipments_keep_me_order_id
  before update on public.shipments
  for each row execute function public.shipments_keep_me_order_id();
