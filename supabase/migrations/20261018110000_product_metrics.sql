-- Product metrics (request of 18/10).
--
-- 1. product_events: view, add_to_cart, begin_checkout, purchase. Written
--    only by the server (service role); read only by admins (RLS).
-- 2. orders.visitor_id: the anonymous visitor (cookie ba_visitante) who
--    placed the order, so a purchase joins the visits that led to it. It
--    travels in create_order's p_origem (key visitor_id).
-- 3. purchase events are written by the database itself, one per item,
--    when an order goes pending_payment -> paid (only the payment webhook
--    does that). Unique per (order, variant): never twice.
-- 4. record_product_view(): one view per visitor and product every 30 min.
-- 5. product_metrics_daily (product x day x origin) and
--    refresh_product_metrics(de, ate); pg_cron recalculates the last two
--    days every hour. The panel reads this table, not the raw events.

-- 1 -------------------------------------------------------------------------
create table public.product_events (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  event text not null check (event in ('view', 'add_to_cart', 'begin_checkout', 'purchase')),
  session_id text not null check (char_length(session_id) between 1 and 64),
  user_id uuid references public.profiles (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  ref text check (char_length(ref) <= 100),
  device text check (device in ('mobile', 'desktop')),
  -- purchase only: units and values at the moment of the sale (cents).
  quantidade integer check (quantidade > 0),
  valor_cents integer check (valor_cents >= 0),
  custo_cents integer check (custo_cents >= 0),
  created_at timestamptz not null default now()
);

create index product_events_product_created_idx on public.product_events (product_id, created_at);
create index product_events_session_idx on public.product_events (session_id);
create unique index product_events_one_purchase_idx
  on public.product_events (order_id, variant_id)
  where event = 'purchase';

alter table public.product_events enable row level security;
create policy product_events_admin_read on public.product_events
  for select to authenticated using (public.is_admin());
revoke all on public.product_events from anon, authenticated;
grant select on public.product_events to authenticated;

-- 2 -------------------------------------------------------------------------
alter table public.orders
  add column visitor_id text check (char_length(visitor_id) <= 64);

-- create_order: same as 20261018100000, plus visitor_id from p_origem.
create or replace function public.create_order(
  p_user_id uuid,
  p_endereco jsonb,
  p_cliente_nome text,
  p_cliente_cpf text,
  p_payment_method public.payment_method,
  p_frete_cents integer,
  p_frete_servico text,
  p_frete_servico_id integer,
  p_itens jsonb,
  p_validade interval,
  p_origem jsonb default null
)
returns table (id uuid, numero text, total_cents integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_numero text;
  v_subtotal integer := 0;
  v_item record;
begin
  if p_frete_cents is null or p_frete_cents < 0 then
    raise exception 'invalid_shipping';
  end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'empty_cart';
  end if;
  if p_validade is null or p_validade <= interval '0' or p_validade > interval '3 days' then
    raise exception 'invalid_deadline';
  end if;

  drop table if exists pg_temp.checkout_items;
  create temporary table pg_temp.checkout_items on commit drop as
  select
    v.id as variant_id,
    v.sku,
    v.preco_cents,
    p.ncm,
    case when coalesce(v.nome, '') = '' then p.nome else p.nome || ' · ' || v.nome end as nome,
    sum((i ->> 'quantidade')::integer)::integer as quantidade
  from jsonb_array_elements(p_itens) as i
  join public.product_variants v on v.id = (i ->> 'variant_id')::uuid
  join public.products p on p.id = v.product_id and p.ativo
  group by v.id, v.sku, v.preco_cents, p.ncm, p.nome, v.nome;

  if (select count(*) from pg_temp.checkout_items)
     <> (select count(distinct i ->> 'variant_id') from jsonb_array_elements(p_itens) as i)
  then
    raise exception 'variant_not_found';
  end if;
  if exists (select 1 from pg_temp.checkout_items where quantidade is null or quantidade <= 0 or quantidade > 99) then
    raise exception 'invalid_quantity';
  end if;

  select coalesce(sum(preco_cents * quantidade), 0)::integer into v_subtotal from pg_temp.checkout_items;

  insert into public.orders (
    user_id, status, subtotal_cents, frete_cents, desconto_cents, total_cents,
    frete_servico, frete_servico_id, endereco, cliente_nome, cliente_cpf,
    payment_method, expira_em,
    utm_source, utm_medium, utm_campaign, ref, visitor_id
  )
  values (
    p_user_id, 'pending_payment', v_subtotal, p_frete_cents, 0, v_subtotal + p_frete_cents,
    p_frete_servico, p_frete_servico_id, p_endereco, p_cliente_nome, p_cliente_cpf,
    p_payment_method, now() + p_validade,
    left(nullif(p_origem ->> 'utm_source', ''), 100),
    left(nullif(p_origem ->> 'utm_medium', ''), 100),
    left(nullif(p_origem ->> 'utm_campaign', ''), 100),
    left(nullif(p_origem ->> 'ref', ''), 100),
    left(nullif(p_origem ->> 'visitor_id', ''), 64)
  )
  returning orders.id, orders.numero into v_order_id, v_numero;

  for v_item in select * from pg_temp.checkout_items order by variant_id loop
    insert into public.order_items (order_id, variant_id, nome, sku, ncm, preco_cents, quantidade)
    values (v_order_id, v_item.variant_id, v_item.nome, v_item.sku, v_item.ncm, v_item.preco_cents, v_item.quantidade);
  end loop;

  perform public.reserve_stock(v_order_id);

  insert into public.order_events (order_id, evento, detalhe)
  values (v_order_id, 'created', jsonb_build_object('pagamento', p_payment_method));

  delete from public.cart_items ci
  using public.carts c
  where ci.cart_id = c.id
    and c.user_id = p_user_id
    and ci.variant_id in (select variant_id from pg_temp.checkout_items);

  return query select v_order_id, v_numero, v_subtotal + p_frete_cents;
end;
$$;

-- 3 -------------------------------------------------------------------------
create function public.record_purchase_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (old.status = 'pending_payment' and new.status = 'paid') then
    return null;
  end if;
  insert into public.product_events (
    product_id, variant_id, event, session_id, user_id, order_id,
    utm_source, utm_medium, utm_campaign, ref,
    quantidade, valor_cents, custo_cents, created_at
  )
  select
    v.product_id, i.variant_id, 'purchase',
    coalesce(new.visitor_id, 'pedido-' || new.id::text), new.user_id, new.id,
    new.utm_source, new.utm_medium, new.utm_campaign, new.ref,
    i.quantidade, i.preco_cents * i.quantidade,
    coalesce(v.custo_cents, 0) * i.quantidade, now()
  from public.order_items i
  join public.product_variants v on v.id = i.variant_id
  where i.order_id = new.id
  on conflict do nothing;
  return null;
end;
$$;

create trigger orders_record_purchase_events
  after update of status on public.orders
  for each row execute function public.record_purchase_events();

-- 4 -------------------------------------------------------------------------
-- Returns true when the view was recorded (false: same visitor and product
-- in the last 30 minutes).
create function public.record_product_view(
  p_product_id uuid,
  p_session_id text,
  p_user_id uuid,
  p_origem jsonb,
  p_device text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Serialise views of the same visitor and product (no double count on a
  -- double request).
  perform pg_advisory_xact_lock(hashtextextended(p_session_id || ':' || p_product_id::text, 0));
  if exists (
    select 1 from public.product_events
    where session_id = p_session_id and product_id = p_product_id
      and event = 'view' and created_at > now() - interval '30 minutes'
  ) then
    return false;
  end if;
  if not exists (select 1 from public.products where id = p_product_id and ativo) then
    return false;
  end if;
  insert into public.product_events (
    product_id, event, session_id, user_id, utm_source, utm_medium, utm_campaign, ref, device
  )
  values (
    p_product_id, 'view', p_session_id, p_user_id,
    left(nullif(p_origem ->> 'utm_source', ''), 100),
    left(nullif(p_origem ->> 'utm_medium', ''), 100),
    left(nullif(p_origem ->> 'utm_campaign', ''), 100),
    left(nullif(p_origem ->> 'ref', ''), 100),
    p_device
  );
  return true;
end;
$$;

-- 5 -------------------------------------------------------------------------
create table public.product_metrics_daily (
  dia date not null,
  product_id uuid not null references public.products (id) on delete cascade,
  -- '' when absent, so the primary key works.
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  ref text not null default '',
  views integer not null default 0,
  visitantes integer not null default 0,
  add_to_cart integer not null default 0,
  begin_checkout integer not null default 0,
  pedidos integer not null default 0,
  unidades integer not null default 0,
  faturamento_cents bigint not null default 0,
  custo_cents bigint not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (dia, product_id, utm_source, utm_medium, utm_campaign, ref)
);

create index product_metrics_daily_product_idx on public.product_metrics_daily (product_id, dia);

alter table public.product_metrics_daily enable row level security;
create policy product_metrics_daily_admin_read on public.product_metrics_daily
  for select to authenticated using (public.is_admin());
revoke all on public.product_metrics_daily from anon, authenticated;
grant select on public.product_metrics_daily to authenticated;

-- Days in America/Sao_Paulo. Recalculates [p_de, p_ate] from the events.
create function public.refresh_product_metrics(p_de date, p_ate date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  if p_de is null or p_ate is null or p_ate < p_de or p_ate - p_de > 400 then
    raise exception 'invalid_period';
  end if;

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
  where e.created_at >= (p_de::timestamp at time zone 'America/Sao_Paulo')
    and e.created_at < ((p_ate + 1)::timestamp at time zone 'America/Sao_Paulo')
  group by 1, 2, 3, 4, 5, 6;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

select cron.schedule(
  'ba-product-metrics',
  '7 * * * *',
  $$select public.refresh_product_metrics(
      ((now() at time zone 'America/Sao_Paulo')::date - 1),
      (now() at time zone 'America/Sao_Paulo')::date)$$
);

-- Server only ----------------------------------------------------------------
revoke execute on function public.record_purchase_events() from public, anon, authenticated;
revoke execute on function public.record_product_view(uuid, text, uuid, jsonb, text) from public, anon, authenticated;
revoke execute on function public.refresh_product_metrics(date, date) from public, anon, authenticated;
grant execute on function public.record_product_view(uuid, text, uuid, jsonb, text) to service_role;
grant execute on function public.refresh_product_metrics(date, date) to service_role;
