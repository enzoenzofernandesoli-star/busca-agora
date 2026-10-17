-- Product metrics, Codex review of PR #43 (2026-10-18).
--
-- 1. Purchase values are bigint and computed as bigint (cost x quantity can
--    exceed integer), and a failure while writing metrics never blocks the
--    payment: it is recorded as an order event instead.
-- 2. Distinct counts cannot be summed across partitions. Two more summaries,
--    rebuilt by the same refresh:
--    - product_metrics_product_daily: per product and day, visitors distinct
--      across origins and orders distinct;
--    - store_metrics_daily: per day, visitors distinct across products and
--      orders distinct (one order with two products is one purchase).
--    product_metrics_daily keeps the origin breakdown (views, carts, money).

-- 1 -------------------------------------------------------------------------
alter table public.product_events
  alter column valor_cents type bigint,
  alter column custo_cents type bigint;

create or replace function public.record_purchase_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (old.status = 'pending_payment' and new.status = 'paid') then
    return null;
  end if;
  begin
    insert into public.product_events (
      product_id, variant_id, event, session_id, user_id, order_id,
      utm_source, utm_medium, utm_campaign, ref,
      quantidade, valor_cents, custo_cents, created_at
    )
    select
      v.product_id, i.variant_id, 'purchase',
      coalesce(new.visitor_id, 'pedido-' || new.id::text), new.user_id, new.id,
      new.utm_source, new.utm_medium, new.utm_campaign, new.ref,
      i.quantidade, i.preco_cents::bigint * i.quantidade,
      coalesce(v.custo_cents, 0)::bigint * i.quantidade, now()
    from public.order_items i
    join public.product_variants v on v.id = i.variant_id
    where i.order_id = new.id
    on conflict do nothing;
  exception when others then
    -- Metrics are auxiliary: the payment stands; the admin sees why.
    insert into public.order_events (order_id, evento, detalhe)
    values (new.id, 'metricas_falharam', jsonb_build_object('erro', sqlerrm));
  end;
  return null;
end;
$$;

-- 2 -------------------------------------------------------------------------
create table public.product_metrics_product_daily (
  dia date not null,
  product_id uuid not null references public.products (id) on delete cascade,
  visitantes integer not null default 0,
  pedidos integer not null default 0,
  primary key (dia, product_id)
);

create table public.store_metrics_daily (
  dia date primary key,
  visitantes integer not null default 0,
  pedidos integer not null default 0,
  unidades integer not null default 0,
  faturamento_cents bigint not null default 0,
  custo_cents bigint not null default 0
);

alter table public.product_metrics_product_daily enable row level security;
alter table public.store_metrics_daily enable row level security;
create policy product_metrics_product_daily_admin_read on public.product_metrics_product_daily
  for select to authenticated using (public.is_admin());
create policy store_metrics_daily_admin_read on public.store_metrics_daily
  for select to authenticated using (public.is_admin());
revoke all on public.product_metrics_product_daily from anon, authenticated;
revoke all on public.store_metrics_daily from anon, authenticated;
grant select on public.product_metrics_product_daily to authenticated;
grant select on public.store_metrics_daily to authenticated;

create or replace function public.refresh_product_metrics(p_de date, p_ate date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
  v_inicio timestamptz;
  v_fim timestamptz;
begin
  if p_de is null or p_ate is null or p_ate < p_de or p_ate - p_de > 400 then
    raise exception 'invalid_period';
  end if;
  v_inicio := p_de::timestamp at time zone 'America/Sao_Paulo';
  v_fim := (p_ate + 1)::timestamp at time zone 'America/Sao_Paulo';

  -- Per product, day and origin.
  delete from public.product_metrics_daily where dia between p_de and p_ate;
  insert into public.product_metrics_daily (
    dia, product_id, utm_source, utm_medium, utm_campaign, ref,
    views, visitantes, add_to_cart, begin_checkout, pedidos, unidades,
    faturamento_cents, custo_cents
  )
  select
    (e.created_at at time zone 'America/Sao_Paulo')::date,
    e.product_id,
    coalesce(e.utm_source, ''), coalesce(e.utm_medium, ''),
    coalesce(e.utm_campaign, ''), coalesce(e.ref, ''),
    count(*) filter (where e.event = 'view'),
    count(distinct e.session_id) filter (where e.event = 'view'),
    count(*) filter (where e.event = 'add_to_cart'),
    count(*) filter (where e.event = 'begin_checkout'),
    count(distinct e.order_id) filter (where e.event = 'purchase'),
    coalesce(sum(e.quantidade) filter (where e.event = 'purchase'), 0),
    coalesce(sum(e.valor_cents) filter (where e.event = 'purchase'), 0),
    coalesce(sum(e.custo_cents) filter (where e.event = 'purchase'), 0)
  from public.product_events e
  where e.created_at >= v_inicio and e.created_at < v_fim
  group by 1, 2, 3, 4, 5, 6;
  get diagnostics v_rows = row_count;

  -- Per product and day: distinct across origins.
  delete from public.product_metrics_product_daily where dia between p_de and p_ate;
  insert into public.product_metrics_product_daily (dia, product_id, visitantes, pedidos)
  select
    (e.created_at at time zone 'America/Sao_Paulo')::date,
    e.product_id,
    count(distinct e.session_id) filter (where e.event = 'view'),
    count(distinct e.order_id) filter (where e.event = 'purchase')
  from public.product_events e
  where e.created_at >= v_inicio and e.created_at < v_fim
  group by 1, 2;

  -- Per day for the whole store: distinct across products.
  delete from public.store_metrics_daily where dia between p_de and p_ate;
  insert into public.store_metrics_daily (
    dia, visitantes, pedidos, unidades, faturamento_cents, custo_cents
  )
  select
    (e.created_at at time zone 'America/Sao_Paulo')::date,
    count(distinct e.session_id) filter (where e.event = 'view'),
    count(distinct e.order_id) filter (where e.event = 'purchase'),
    coalesce(sum(e.quantidade) filter (where e.event = 'purchase'), 0),
    coalesce(sum(e.valor_cents) filter (where e.event = 'purchase'), 0),
    coalesce(sum(e.custo_cents) filter (where e.event = 'purchase'), 0)
  from public.product_events e
  where e.created_at >= v_inicio and e.created_at < v_fim
  group by 1;

  return v_rows;
end;
$$;

-- Fill the new summaries for what already exists.
select public.refresh_product_metrics(
  coalesce(
    (select min((created_at at time zone 'America/Sao_Paulo')::date) from public.product_events),
    (now() at time zone 'America/Sao_Paulo')::date
  ),
  (now() at time zone 'America/Sao_Paulo')::date
);
