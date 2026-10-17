-- Phase 5: checkout and payment.
--
-- 1. orders: payment deadline and the Mercado Pago preference.
-- 2. create_order(): the server's only way to create an order. Prices,
--    names, SKU and NCM are read here from the catalog (never from the
--    browser), the order and its items are written and the stock is reserved
--    in one transaction; out of stock = nothing is created.
-- 3. record_payment(): webhook result, after the payment was fetched from
--    the Mercado Pago API. Idempotent per mp_payment_id; marks paid only when
--    approved, in BRL and for the exact total.
-- 4. expire_orders(): unpaid orders past their deadline are canceled and
--    their stock returned (set_order_status -> restore_stock), every 5 min.
-- All server-only (service_role).

-- 1 -------------------------------------------------------------------------
alter table public.orders
  add column expira_em timestamptz,
  add column mp_preference_id text;

create index orders_pending_expiry_idx
  on public.orders (expira_em)
  where status = 'pending_payment';

-- 2 -------------------------------------------------------------------------
create function public.create_order(
  p_user_id uuid,
  p_endereco jsonb,
  p_cliente_nome text,
  p_cliente_cpf text,
  p_payment_method public.payment_method,
  p_frete_cents integer,
  p_frete_servico text,
  p_frete_servico_id integer,
  p_itens jsonb,
  p_validade interval
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

  -- Same variant twice is merged; every variant must be an active product.
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
    payment_method, expira_em
  )
  values (
    p_user_id, 'pending_payment', v_subtotal, p_frete_cents, 0, v_subtotal + p_frete_cents,
    p_frete_servico, p_frete_servico_id, p_endereco, p_cliente_nome, p_cliente_cpf,
    p_payment_method, now() + p_validade
  )
  returning orders.id, orders.numero into v_order_id, v_numero;

  for v_item in select * from pg_temp.checkout_items order by variant_id loop
    insert into public.order_items (order_id, variant_id, nome, sku, ncm, preco_cents, quantidade)
    values (v_order_id, v_item.variant_id, v_item.nome, v_item.sku, v_item.ncm, v_item.preco_cents, v_item.quantidade);
  end loop;

  -- Raises insufficient_stock: the whole order is rolled back.
  perform public.reserve_stock(v_order_id);

  insert into public.order_events (order_id, evento, detalhe)
  values (v_order_id, 'created', jsonb_build_object('pagamento', p_payment_method));

  -- What was bought leaves the customer's cart.
  delete from public.cart_items ci
  using public.carts c
  where ci.cart_id = c.id
    and c.user_id = p_user_id
    and ci.variant_id in (select variant_id from pg_temp.checkout_items);

  return query select v_order_id, v_numero, v_subtotal + p_frete_cents;
end;
$$;

-- 3 -------------------------------------------------------------------------
-- Returns what happened: 'paid', 'already_paid', 'pending', 'late' (approved
-- after the order was canceled: refund by hand), 'mismatch' (amount or
-- currency differ: never paid), 'refunded', 'ignored'.
create function public.record_payment(
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
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using detail = p_order_id::text;
  end if;

  insert into public.payments (order_id, mp_payment_id, metodo, status, valor_cents, parcelas, raw)
  values (p_order_id, p_mp_payment_id, p_metodo, p_status, p_valor_cents, greatest(p_parcelas, 1), coalesce(p_raw, '{}'::jsonb))
  on conflict (mp_payment_id) do update
    set status = excluded.status,
        valor_cents = excluded.valor_cents,
        parcelas = excluded.parcelas,
        raw = excluded.raw
  where public.payments.order_id = p_order_id;

  if not found then
    -- The payment id already belongs to another order: never trust it.
    insert into public.order_events (order_id, evento, detalhe)
    values (p_order_id, 'payment_wrong_order', jsonb_build_object('mp_payment_id', p_mp_payment_id));
    return 'mismatch';
  end if;

  if p_status = 'approved' then
    if p_valor_cents <> v_order.total_cents or upper(coalesce(p_moeda, '')) <> 'BRL' then
      insert into public.order_events (order_id, evento, detalhe)
      values (p_order_id, 'payment_amount_mismatch', jsonb_build_object(
        'mp_payment_id', p_mp_payment_id, 'valor_cents', p_valor_cents,
        'esperado_cents', v_order.total_cents, 'moeda', p_moeda));
      return 'mismatch';
    end if;
    if v_order.status = 'pending_payment' then
      perform public.set_order_status(p_order_id, 'paid',
        jsonb_build_object('mp_payment_id', p_mp_payment_id, 'metodo', p_metodo));
      return 'paid';
    end if;
    if v_order.status = 'canceled' then
      if not exists (
        select 1 from public.order_events
        where order_id = p_order_id and evento = 'payment_after_cancel'
          and detalhe ->> 'mp_payment_id' = p_mp_payment_id
      ) then
        insert into public.order_events (order_id, evento, detalhe)
        values (p_order_id, 'payment_after_cancel', jsonb_build_object('mp_payment_id', p_mp_payment_id));
      end if;
      return 'late';
    end if;
    return 'already_paid';
  end if;

  if p_status in ('refunded', 'charged_back') then
    if v_order.status <> 'refunded'
       and public.order_transition_allowed(v_order.status, 'refunded') then
      perform public.set_order_status(p_order_id, 'refunded',
        jsonb_build_object('mp_payment_id', p_mp_payment_id, 'motivo', p_status));
    end if;
    return 'refunded';
  end if;

  if p_status in ('pending', 'in_process', 'authorized') then
    return 'pending';
  end if;
  return 'ignored';
end;
$$;

-- 4 -------------------------------------------------------------------------
create function public.expire_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select o.id from public.orders o
    where o.status = 'pending_payment' and o.expira_em < now()
    order by o.expira_em
    limit 200
  loop
    begin
      perform public.set_order_status(v_id, 'canceled', jsonb_build_object('motivo', 'pagamento_expirado'));
      v_count := v_count + 1;
    exception when others then
      -- One bad order never blocks the others; it is retried next run.
      insert into public.order_events (order_id, evento, detalhe)
      values (v_id, 'expire_failed', jsonb_build_object('erro', sqlerrm));
    end;
  end loop;
  return v_count;
end;
$$;

select cron.schedule('ba-expire-orders', '*/5 * * * *', 'select public.expire_orders()');

-- Server only ----------------------------------------------------------------
revoke execute on function public.create_order(uuid, jsonb, text, text, public.payment_method, integer, text, integer, jsonb, interval) from public, anon, authenticated;
revoke execute on function public.record_payment(uuid, text, text, public.payment_method, integer, text, smallint, jsonb) from public, anon, authenticated;
revoke execute on function public.expire_orders() from public, anon, authenticated;
grant execute on function public.create_order(uuid, jsonb, text, text, public.payment_method, integer, text, integer, jsonb, interval) to service_role;
grant execute on function public.record_payment(uuid, text, text, public.payment_method, integer, text, smallint, jsonb) to service_role;
grant execute on function public.expire_orders() to service_role;
grant update (mp_preference_id) on public.orders to service_role;
