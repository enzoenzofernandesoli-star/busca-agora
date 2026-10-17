-- Phase 5 review fixes (Codex, 2026-10-17).
--
-- 1. orders.paid_payment_id: the one payment that settled the order. Refunds
--    and chargebacks only move the order when they are about THAT payment;
--    a divergent or duplicate payment being refunded never undoes a sale.
-- 2. payments.divergente: approved for the wrong amount/currency; kept for
--    the admin, never settles anything.
-- 3. A payment never goes back: an older snapshot (pending after approved,
--    approved after refunded) is ignored (payment_status_rank).
-- 4. shipped -> refunded is allowed (refund or chargeback of an order in
--    transit). A refund that still cannot move the order is recorded as an
--    event for the admin instead of being silently acknowledged.
-- 5. Refund lease: the admin refund takes the fulfillment lease (type
--    'refund') BEFORE asking Mercado Pago for the money back, so no label is
--    bought or printed meanwhile; set_order_status accepts the move to
--    refunded under that lease.

-- 1, 2 ----------------------------------------------------------------------
alter table public.orders add column paid_payment_id text;
alter table public.payments add column divergente boolean not null default false;

-- 3 -------------------------------------------------------------------------
create function public.payment_status_rank(p_status text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_status in ('refunded', 'charged_back') then 3
    when p_status in ('approved', 'rejected', 'cancelled') then 2
    else 1
  end;
$$;

-- 4 -------------------------------------------------------------------------
create or replace function public.order_transition_allowed(
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
    -- Label printed by hand (PrintNode off) and posted.
    ('label_ready', 'shipped'),
    ('label_ready', 'refunded'),
    ('printed', 'shipped'),
    ('printed', 'refunded'),
    ('shipped', 'delivered'),
    -- Refund or chargeback while the parcel is on its way.
    ('shipped', 'refunded'),
    ('delivered', 'refunded')
  );
$$;

-- 5 -------------------------------------------------------------------------
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

  -- A label or print job is working on the order: wait for it. The refund
  -- lease itself is the one exception (it exists to block those jobs).
  if p_status in ('refunded', 'canceled') and exists (
    select 1 from public.shipments
    where order_id = p_order_id and trava_ate > now()
      and coalesce(trava_tipo, '') <> 'refund'
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
  if p_status = 'refunded' then
    update public.shipments set trava_tipo = null, trava_ate = null
    where order_id = p_order_id and trava_tipo = 'refund';
  end if;
end;
$$;

-- Returns 'ok' (lease taken: ask the provider for the money back now),
-- 'ocupado' (a label/print job is working; try again in a few minutes) or
-- 'inelegivel' (nothing settled to refund, or already refunded).
create function public.begin_refund(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_ate timestamptz;
  v_tipo text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using detail = p_order_id::text;
  end if;
  if v_order.paid_payment_id is null
     or not public.order_transition_allowed(v_order.status, 'refunded') then
    return 'inelegivel';
  end if;

  insert into public.shipments (order_id, status)
  values (p_order_id, 'aguardando')
  on conflict (order_id) do nothing;

  select trava_ate, trava_tipo into v_ate, v_tipo from public.shipments
  where order_id = p_order_id for update;
  if v_ate is not null and v_ate > now() and coalesce(v_tipo, '') <> 'refund' then
    return 'ocupado';
  end if;

  update public.shipments
  set trava_tipo = 'refund', trava_ate = now() + interval '30 minutes'
  where order_id = p_order_id;
  return 'ok';
end;
$$;

-- The provider refused the refund: release the lease so fulfillment goes on.
create function public.end_refund(p_order_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.shipments set trava_tipo = null, trava_ate = null
  where order_id = p_order_id and trava_tipo = 'refund';
$$;

-- 1-4 -----------------------------------------------------------------------
-- Returns: 'paid', 'already_paid', 'pending', 'stale' (older snapshot,
-- ignored), 'late' (approved after cancel: refund by hand), 'duplicate'
-- (second approved payment for a settled order: refund by hand),
-- 'mismatch' (wrong amount/currency or another order's payment), 'refunded',
-- 'refunded_other' (a payment that did not settle the order was refunded:
-- order untouched), 'review' (refund that cannot move the order: event for
-- the admin), 'ignored'.
create or replace function public.record_payment(
  p_order_id uuid,
  p_mp_payment_id text,
  p_status text,
  p_metodo public.payment_method,
  p_valor_cents integer,
  p_moeda text,
  p_parcelas smallint,
  p_raw jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_status text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using detail = p_order_id::text;
  end if;

  select * into v_payment from public.payments
  where mp_payment_id = p_mp_payment_id for update;

  if found and v_payment.order_id <> p_order_id then
    -- The payment id already belongs to another order: never trust it.
    insert into public.order_events (order_id, evento, detalhe)
    values (p_order_id, 'payment_wrong_order', jsonb_build_object('mp_payment_id', p_mp_payment_id));
    return 'mismatch';
  end if;

  if not found then
    insert into public.payments (order_id, mp_payment_id, metodo, status, valor_cents, parcelas, raw)
    values (p_order_id, p_mp_payment_id, p_metodo, p_status, p_valor_cents,
            greatest(p_parcelas, 1), coalesce(p_raw, '{}'::jsonb));
    v_status := p_status;
  elsif public.payment_status_rank(p_status) > public.payment_status_rank(v_payment.status) then
    update public.payments
    set status = p_status, valor_cents = p_valor_cents,
        parcelas = greatest(p_parcelas, 1), raw = coalesce(p_raw, '{}'::jsonb)
    where id = v_payment.id;
    v_status := p_status;
  elsif p_status = v_payment.status then
    v_status := p_status;
  else
    -- Older snapshot than what we already have: ignore it.
    return 'stale';
  end if;

  if v_status = 'approved' then
    if p_valor_cents <> v_order.total_cents or upper(coalesce(p_moeda, '')) <> 'BRL' then
      update public.payments set divergente = true where mp_payment_id = p_mp_payment_id;
      if not exists (
        select 1 from public.order_events
        where order_id = p_order_id and evento = 'payment_amount_mismatch'
          and detalhe ->> 'mp_payment_id' = p_mp_payment_id
      ) then
        insert into public.order_events (order_id, evento, detalhe)
        values (p_order_id, 'payment_amount_mismatch', jsonb_build_object(
          'mp_payment_id', p_mp_payment_id, 'valor_cents', p_valor_cents,
          'esperado_cents', v_order.total_cents, 'moeda', p_moeda));
      end if;
      return 'mismatch';
    end if;
    if v_order.status = 'pending_payment' then
      update public.orders set paid_payment_id = p_mp_payment_id where id = p_order_id;
      perform public.set_order_status(p_order_id, 'paid',
        jsonb_build_object('mp_payment_id', p_mp_payment_id, 'metodo', p_metodo));
      return 'paid';
    end if;
    if v_order.paid_payment_id = p_mp_payment_id then
      return 'already_paid';
    end if;
    -- Approved but it did not settle this order: canceled before it arrived,
    -- or a second payment. Flag once for a manual refund.
    if not exists (
      select 1 from public.order_events
      where order_id = p_order_id
        and evento in ('payment_after_cancel', 'duplicate_payment')
        and detalhe ->> 'mp_payment_id' = p_mp_payment_id
    ) then
      insert into public.order_events (order_id, evento, detalhe)
      values (p_order_id,
              case when v_order.status = 'canceled' then 'payment_after_cancel' else 'duplicate_payment' end,
              jsonb_build_object('mp_payment_id', p_mp_payment_id));
    end if;
    return case when v_order.status = 'canceled' then 'late' else 'duplicate' end;
  end if;

  if v_status in ('refunded', 'charged_back') then
    if v_order.paid_payment_id is distinct from p_mp_payment_id then
      return 'refunded_other';
    end if;
    if v_order.status = 'refunded' then
      return 'refunded';
    end if;
    if public.order_transition_allowed(v_order.status, 'refunded') then
      -- Raises fulfillment_in_progress while a label/print job works: the
      -- webhook answers 500 and Mercado Pago retries later.
      perform public.set_order_status(p_order_id, 'refunded',
        jsonb_build_object('mp_payment_id', p_mp_payment_id, 'motivo', v_status));
      return 'refunded';
    end if;
    if not exists (
      select 1 from public.order_events
      where order_id = p_order_id and evento = 'refund_needs_review'
        and detalhe ->> 'mp_payment_id' = p_mp_payment_id
    ) then
      insert into public.order_events (order_id, evento, detalhe)
      values (p_order_id, 'refund_needs_review', jsonb_build_object(
        'mp_payment_id', p_mp_payment_id, 'motivo', v_status, 'status_pedido', v_order.status));
    end if;
    return 'review';
  end if;

  if v_status in ('pending', 'in_process', 'authorized') then
    return 'pending';
  end if;
  return 'ignored';
end;
$$;

revoke execute on function public.begin_refund(uuid) from public, anon, authenticated;
revoke execute on function public.end_refund(uuid) from public, anon, authenticated;
grant execute on function public.begin_refund(uuid) to service_role;
grant execute on function public.end_refund(uuid) to service_role;
