-- Admin panel, round 2 (approved 08/10): richer dashboard, delete product,
-- team (who is admin). All service_role only; the server checks the role
-- (requireAdmin) before calling them.

-- ---------------------------------------------------------------------------
-- Dashboard: numbers, 14-day sales and the latest orders in one call
-- ---------------------------------------------------------------------------

create function public.admin_dashboard_v2()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with
  dia0 as (
    -- Today's start in the store's time zone, as timestamptz.
    select (date_trunc('day', now() at time zone 'America/Sao_Paulo')
      at time zone 'America/Sao_Paulo') as inicio
  ),
  vendas as (
    -- A sale: paid at some point (not waiting, canceled or refunded).
    select o.*, (o.created_at at time zone 'America/Sao_Paulo')::date as dia
    from public.orders o
    where o.status not in ('pending_payment', 'canceled', 'refunded')
  ),
  serie as (
    select d::date as dia
    from dia0, generate_series(
      (dia0.inicio at time zone 'America/Sao_Paulo')::date - 13,
      (dia0.inicio at time zone 'America/Sao_Paulo')::date,
      interval '1 day'
    ) as d
  )
  select jsonb_build_object(
    'vendas_hoje_cents', coalesce((
      select sum(total_cents) from vendas, dia0 where created_at >= dia0.inicio
    ), 0),
    'pedidos_hoje', (
      select count(*) from vendas, dia0 where created_at >= dia0.inicio
    ),
    'vendas_7d_cents', coalesce((
      select sum(total_cents) from vendas, dia0
      where created_at >= dia0.inicio - interval '6 days'
    ), 0),
    'pedidos_7d', (
      select count(*) from vendas, dia0
      where created_at >= dia0.inicio - interval '6 days'
    ),
    'vendas_7d_anterior_cents', coalesce((
      select sum(total_cents) from vendas, dia0
      where created_at >= dia0.inicio - interval '13 days'
        and created_at < dia0.inicio - interval '6 days'
    ), 0),
    'pedidos_7d_anterior', (
      select count(*) from vendas, dia0
      where created_at >= dia0.inicio - interval '13 days'
        and created_at < dia0.inicio - interval '6 days'
    ),
    'a_enviar', (
      select count(*) from public.orders
      where status in ('paid', 'invoiced', 'label_ready', 'printed')
    ),
    'jobs_erro', (select count(*) from public.jobs where status = 'failed'),
    'estoque_baixo', (
      select count(*)
      from public.product_variants v
      join public.products p on p.id = v.product_id and p.ativo
      where v.estoque <= 3
    ),
    'notas_pendentes', (
      select count(*) from public.invoices where status = 'pendente_manual'
    ),
    'dias', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'dia', s.dia,
        'total_cents', coalesce((select sum(total_cents) from vendas v where v.dia = s.dia), 0),
        'pedidos', (select count(*) from vendas v where v.dia = s.dia)
      ) order by s.dia), '[]'::jsonb)
      from serie s
    ),
    'ultimos', (
      select coalesce(jsonb_agg(u order by u.created_at desc), '[]'::jsonb)
      from (
        select o.numero, o.cliente_nome, o.total_cents, o.status, o.created_at,
          (select coalesce(sum(i.quantidade), 0) from public.order_items i
           where i.order_id = o.id) as itens
        from public.orders o
        order by o.created_at desc
        limit 8
      ) u
    )
  );
$$;

revoke execute on function public.admin_dashboard_v2() from public, anon, authenticated;
grant execute on function public.admin_dashboard_v2() to service_role;

-- ---------------------------------------------------------------------------
-- Delete a product (its variants and photos). Orders keep their own copies
-- of name, SKU and price (order_items.variant_id becomes null).
-- Returns { removed_urls, vendido } so the server deletes the files.
-- ---------------------------------------------------------------------------

create function public.admin_delete_product(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_urls text[];
  v_vendido boolean;
begin
  if not exists (select 1 from public.products where id = p_id) then
    raise exception 'product_not_found' using detail = p_id::text;
  end if;

  select exists (
    select 1 from public.order_items i
    join public.product_variants v on v.id = i.variant_id
    where v.product_id = p_id
  ) into v_vendido;

  select coalesce(array_agg(url), '{}') into v_urls
  from public.product_images where product_id = p_id;

  delete from public.product_images where product_id = p_id;
  delete from public.product_variants where product_id = p_id;
  delete from public.products where id = p_id;

  return jsonb_build_object('removed_urls', to_jsonb(v_urls), 'vendido', v_vendido);
end;
$$;

revoke execute on function public.admin_delete_product(uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_product(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Team: make an account admin or take the access away. Never removes the
-- caller's own access, and never leaves the store without an admin.
-- ---------------------------------------------------------------------------

create function public.admin_set_role(
  p_target uuid,
  p_role public.user_role,
  p_actor uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_target = p_actor and p_role <> 'admin' then
    raise exception 'cannot_demote_self';
  end if;
  -- Serialize role changes so two admins cannot remove each other at once.
  perform 1 from public.profiles where role = 'admin' for update;
  if p_role <> 'admin' and (
    select count(*) from public.profiles where role = 'admin' and id <> p_target
  ) = 0 then
    raise exception 'last_admin';
  end if;
  update public.profiles set role = p_role where id = p_target;
  if not found then
    raise exception 'profile_not_found';
  end if;
end;
$$;

revoke execute on function public.admin_set_role(uuid, public.user_role, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_set_role(uuid, public.user_role, uuid)
  to service_role;
