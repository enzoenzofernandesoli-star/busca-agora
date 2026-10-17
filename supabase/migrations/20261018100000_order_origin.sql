-- Order origin (request of 18/10): the visitor's UTM and creator code
-- (cookie ba_origem, validated by the server) are copied to the order when
-- it is created, for the admin and for the metrics.
--
-- create_order gains p_origem (jsonb, optional); everything else is the
-- same as 20261017090000.

alter table public.orders
  add column utm_source text check (char_length(utm_source) <= 100),
  add column utm_medium text check (char_length(utm_medium) <= 100),
  add column utm_campaign text check (char_length(utm_campaign) <= 100),
  add column ref text check (char_length(ref) <= 100);

drop function public.create_order(uuid, jsonb, text, text, public.payment_method, integer, text, integer, jsonb, interval);

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
    payment_method, expira_em,
    utm_source, utm_medium, utm_campaign, ref
  )
  values (
    p_user_id, 'pending_payment', v_subtotal, p_frete_cents, 0, v_subtotal + p_frete_cents,
    p_frete_servico, p_frete_servico_id, p_endereco, p_cliente_nome, p_cliente_cpf,
    p_payment_method, now() + p_validade,
    left(nullif(p_origem ->> 'utm_source', ''), 100),
    left(nullif(p_origem ->> 'utm_medium', ''), 100),
    left(nullif(p_origem ->> 'utm_campaign', ''), 100),
    left(nullif(p_origem ->> 'ref', ''), 100)
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

revoke execute on function public.create_order(uuid, jsonb, text, text, public.payment_method, integer, text, integer, jsonb, interval, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(uuid, jsonb, text, text, public.payment_method, integer, text, integer, jsonb, interval, jsonb) to service_role;
