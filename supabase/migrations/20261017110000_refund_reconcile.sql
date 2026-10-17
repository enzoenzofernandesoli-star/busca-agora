-- Phase 5, second review (Codex, 2026-10-17): a refund is a durable state,
-- not a lease.
--
-- 1. orders.estorno_status = 'solicitado' from the moment the admin asks for
--    a refund until Mercado Pago confirms it (order -> refunded) or refuses
--    it for sure. While set, no label or print job can start, whatever time
--    passes: fulfillment_lock answers 'ocupado'.
-- 2. One refund at a time, with an owner token: begin_refund hands out a
--    token only when no refund is open; end_refund (definite refusal) only
--    clears the refund that token opened.
-- 3. A 'refund' job reconciles with Mercado Pago (5 attempts with backoff,
--    Telegram alert when exhausted). The order stays blocked until a human
--    or the provider resolves it: an expired timer never resumes shipping.
-- 4. Backfill of orders.paid_payment_id for orders paid before 20261017100000.

alter type public.job_type add value if not exists 'refund';

-- 1 -------------------------------------------------------------------------
alter table public.orders
  add column estorno_status text check (estorno_status in ('solicitado')),
  add column estorno_token uuid,
  add column estorno_em timestamptz;

-- 4 -------------------------------------------------------------------------
-- The payment named in the order's own "paid" event, if it is an approved,
-- non-divergent payment of that order for the exact total.
update public.orders o
set paid_payment_id = p.mp_payment_id
from public.order_events e
join public.payments p on p.mp_payment_id = e.detalhe ->> 'mp_payment_id'
where o.paid_payment_id is null
  and e.order_id = o.id
  and e.evento = 'status_changed'
  and e.detalhe ->> 'para' = 'paid'
  and p.order_id = o.id
  and p.status in ('approved', 'refunded', 'charged_back')
  and not p.divergente
  and p.valor_cents = o.total_cents;

-- Paid orders still without a link are flagged for the admin, never guessed.
insert into public.order_events (order_id, evento, detalhe)
select o.id, 'paid_payment_unknown', '{}'::jsonb
from public.orders o
where o.paid_payment_id is null
  and o.status not in ('pending_payment', 'canceled')
  and exists (select 1 from public.payments p where p.order_id = o.id);

-- 1 -------------------------------------------------------------------------
create or replace function public.fulfillment_lock(
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
  v_estorno text;
  v_ate timestamptz;
begin
  select status, estorno_status into v_status, v_estorno
  from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using detail = p_order_id::text;
  end if;
  if not (
    (p_tipo = 'label' and v_status in ('paid', 'invoiced', 'label_ready'))
    or (p_tipo = 'print' and v_status in ('label_ready', 'printed', 'shipped'))
  ) then
    return 'inelegivel';
  end if;
  -- A refund is open: nothing physical or paid happens until it is resolved.
  if v_estorno is not null then
    return 'ocupado';
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

-- refunded closes the open refund.
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

  -- A label or print job is working on the order: wait for it.
  if p_status in ('refunded', 'canceled') and exists (
    select 1 from public.shipments
    where order_id = p_order_id and trava_ate > now()
      and coalesce(trava_tipo, '') <> 'refund'
  ) then
    raise exception 'fulfillment_in_progress' using detail = p_order_id::text;
  end if;

  update public.orders
  set status = p_status,
      estorno_status = case when p_status = 'refunded' then null else estorno_status end,
      estorno_token = case when p_status = 'refunded' then null else estorno_token end
  where id = p_order_id;

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
drop function public.begin_refund(uuid);
drop function public.end_refund(uuid);

-- resultado: 'ok' (token returned: call the provider now), 'em_andamento'
-- (a refund is already open: only reconcile, never refund again here),
-- 'ocupado' (a label/print job is working: try again in a few minutes) or
-- 'inelegivel' (nothing settled to refund, or already refunded).
create function public.begin_refund(p_order_id uuid)
returns table (resultado text, token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_token uuid;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using detail = p_order_id::text;
  end if;
  if v_order.estorno_status is not null then
    return query select 'em_andamento'::text, null::uuid;
    return;
  end if;
  if v_order.paid_payment_id is null
     or not public.order_transition_allowed(v_order.status, 'refunded') then
    return query select 'inelegivel'::text, null::uuid;
    return;
  end if;
  if exists (
    select 1 from public.shipments
    where order_id = p_order_id and trava_ate > now()
      and coalesce(trava_tipo, '') <> 'refund'
  ) then
    return query select 'ocupado'::text, null::uuid;
    return;
  end if;

  v_token := gen_random_uuid();
  update public.orders
  set estorno_status = 'solicitado', estorno_token = v_token, estorno_em = now()
  where id = p_order_id;

  -- Reconciliation with the provider, a little later (3).
  insert into public.jobs (tipo, order_id, etapa, run_at)
  values ('refund', p_order_id, v_token::text, now() + interval '2 minutes')
  on conflict (tipo, order_id, etapa) do nothing;

  insert into public.order_events (order_id, evento, detalhe)
  values (p_order_id, 'estorno_solicitado',
          jsonb_build_object('mp_payment_id', v_order.paid_payment_id));

  return query select 'ok'::text, v_token;
end;
$$;

-- Definite refusal from the provider: closes only the refund this token
-- opened. Returns true when it did.
create function public.end_refund(p_order_id uuid, p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set estorno_status = null, estorno_token = null
  where id = p_order_id and estorno_status = 'solicitado' and estorno_token = p_token;
  if not found then
    return false;
  end if;
  insert into public.order_events (order_id, evento, detalhe)
  values (p_order_id, 'estorno_recusado', '{}'::jsonb);
  return true;
end;
$$;

revoke execute on function public.begin_refund(uuid) from public, anon, authenticated;
revoke execute on function public.end_refund(uuid, uuid) from public, anon, authenticated;
grant execute on function public.begin_refund(uuid) to service_role;
grant execute on function public.end_refund(uuid, uuid) to service_role;
