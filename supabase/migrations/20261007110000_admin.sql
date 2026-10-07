-- Phase 8: admin panel support.
--
-- * Storage bucket `produtos` for product and banner photos: public read
--   (the store shows them), no write policy (uploads only through signed
--   URLs the server creates for admins).
-- * banners: home page banners (CLAUDE.md section 7). Not one of the 18
--   tables of section 6; approved 2026-10-07.
-- * admin_dashboard(): the four numbers of /admin, server only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'produtos',
  'produtos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Banners
-- ---------------------------------------------------------------------------

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  titulo text not null default '',
  imagem_url text not null,
  imagem_path text not null,
  link text check (link is null or link ~ '^/'),
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger banners_updated_at before update on public.banners
  for each row execute function public.set_updated_at();

alter table public.banners enable row level security;
revoke all on public.banners from anon, authenticated;
grant select on public.banners to anon, authenticated;
grant all on public.banners to service_role;

create policy banners_read on public.banners
  for select to anon, authenticated
  using (ativo);

-- ---------------------------------------------------------------------------
-- Dashboard numbers
-- ---------------------------------------------------------------------------

create function public.admin_dashboard()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with hoje as (
    -- "Today" in the store's time zone, not UTC.
    select
      (date_trunc('day', now() at time zone 'America/Sao_Paulo')
        at time zone 'America/Sao_Paulo') as inicio
  )
  select jsonb_build_object(
    'vendas_hoje_cents', coalesce((
      select sum(o.total_cents)
      from public.orders o, hoje
      where o.created_at >= hoje.inicio
        and o.status not in ('pending_payment', 'canceled', 'refunded')
    ), 0),
    'pedidos_hoje', (
      select count(*)
      from public.orders o, hoje
      where o.created_at >= hoje.inicio
        and o.status not in ('pending_payment', 'canceled', 'refunded')
    ),
    'a_enviar', (
      select count(*) from public.orders
      where status in ('paid', 'invoiced', 'label_ready', 'printed')
    ),
    'jobs_erro', (
      select count(*) from public.jobs where status = 'failed'
    ),
    'estoque_baixo', (
      select count(*)
      from public.product_variants v
      join public.products p on p.id = v.product_id and p.ativo
      where v.estoque <= 3
    )
  );
$$;

revoke execute on function public.admin_dashboard() from public, anon, authenticated;
grant execute on function public.admin_dashboard() to service_role;

-- ---------------------------------------------------------------------------
-- Save a product with its variants and photos in ONE transaction
-- ---------------------------------------------------------------------------

-- p_product: { id?, nome, slug, descricao, category_id, brand_id, ncm, cfop,
--   origem, ativo, destaque,
--   variantes: [{ id?, sku, nome, preco_cents, preco_de_cents, custo_cents,
--     estoque, peso_g, altura_cm, largura_cm, comprimento_cm, ean }],
--   imagens: [{ id?, url, path, alt }] (in display order) }
-- Variants and photos missing from the lists are deleted. Returns
-- { id, removed_urls } so the server can delete the orphaned files.
create function public.admin_save_product(p_product jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := nullif(p_product ->> 'id', '')::uuid;
  v_variant jsonb;
  v_image jsonb;
  v_keep_variants uuid[] := '{}';
  v_keep_images uuid[] := '{}';
  v_vid uuid;
  v_iid uuid;
  v_ordem integer := 0;
  v_removed text[];
begin
  if jsonb_array_length(coalesce(p_product -> 'variantes', '[]'::jsonb)) = 0 then
    raise exception 'no_variants';
  end if;

  if v_id is null then
    insert into public.products (
      nome, slug, descricao, category_id, brand_id, ncm, cfop, origem, ativo, destaque
    )
    values (
      p_product ->> 'nome', p_product ->> 'slug', coalesce(p_product ->> 'descricao', ''),
      (p_product ->> 'category_id')::uuid, nullif(p_product ->> 'brand_id', '')::uuid,
      p_product ->> 'ncm', coalesce(p_product ->> 'cfop', '5102'),
      coalesce((p_product ->> 'origem')::smallint, 0),
      coalesce((p_product ->> 'ativo')::boolean, false),
      coalesce((p_product ->> 'destaque')::boolean, false)
    )
    returning id into v_id;
  else
    update public.products set
      nome = p_product ->> 'nome',
      slug = p_product ->> 'slug',
      descricao = coalesce(p_product ->> 'descricao', ''),
      category_id = (p_product ->> 'category_id')::uuid,
      brand_id = nullif(p_product ->> 'brand_id', '')::uuid,
      ncm = p_product ->> 'ncm',
      cfop = coalesce(p_product ->> 'cfop', '5102'),
      origem = coalesce((p_product ->> 'origem')::smallint, 0),
      ativo = coalesce((p_product ->> 'ativo')::boolean, false),
      destaque = coalesce((p_product ->> 'destaque')::boolean, false)
    where id = v_id;
    if not found then
      raise exception 'product_not_found';
    end if;
  end if;

  for v_variant in select * from jsonb_array_elements(p_product -> 'variantes')
  loop
    v_vid := nullif(v_variant ->> 'id', '')::uuid;
    if v_vid is not null then
      update public.product_variants set
        sku = v_variant ->> 'sku',
        nome = coalesce(v_variant ->> 'nome', ''),
        preco_cents = (v_variant ->> 'preco_cents')::integer,
        preco_de_cents = nullif(v_variant ->> 'preco_de_cents', '')::integer,
        custo_cents = nullif(v_variant ->> 'custo_cents', '')::integer,
        estoque = (v_variant ->> 'estoque')::integer,
        peso_g = (v_variant ->> 'peso_g')::integer,
        altura_cm = (v_variant ->> 'altura_cm')::numeric,
        largura_cm = (v_variant ->> 'largura_cm')::numeric,
        comprimento_cm = (v_variant ->> 'comprimento_cm')::numeric,
        ean = nullif(v_variant ->> 'ean', '')
      where id = v_vid and product_id = v_id;
      if not found then
        raise exception 'variant_not_found';
      end if;
    else
      insert into public.product_variants (
        product_id, sku, nome, preco_cents, preco_de_cents, custo_cents, estoque,
        peso_g, altura_cm, largura_cm, comprimento_cm, ean
      )
      values (
        v_id, v_variant ->> 'sku', coalesce(v_variant ->> 'nome', ''),
        (v_variant ->> 'preco_cents')::integer,
        nullif(v_variant ->> 'preco_de_cents', '')::integer,
        nullif(v_variant ->> 'custo_cents', '')::integer,
        (v_variant ->> 'estoque')::integer,
        (v_variant ->> 'peso_g')::integer,
        (v_variant ->> 'altura_cm')::numeric,
        (v_variant ->> 'largura_cm')::numeric,
        (v_variant ->> 'comprimento_cm')::numeric,
        nullif(v_variant ->> 'ean', '')
      )
      returning id into v_vid;
    end if;
    v_keep_variants := v_keep_variants || v_vid;
  end loop;

  -- Variants removed from the form. Past orders keep their copies
  -- (order_items.variant_id becomes null); carts drop them.
  delete from public.product_variants
  where product_id = v_id and not (id = any (v_keep_variants));

  for v_image in select * from jsonb_array_elements(coalesce(p_product -> 'imagens', '[]'::jsonb))
  loop
    v_iid := nullif(v_image ->> 'id', '')::uuid;
    if v_iid is not null then
      update public.product_images
      set ordem = v_ordem, alt = coalesce(v_image ->> 'alt', '')
      where id = v_iid and product_id = v_id;
      if not found then
        v_iid := null;
      end if;
    end if;
    if v_iid is null then
      insert into public.product_images (product_id, url, ordem, alt)
      values (v_id, v_image ->> 'url', v_ordem, coalesce(v_image ->> 'alt', ''))
      returning id into v_iid;
    end if;
    v_keep_images := v_keep_images || v_iid;
    v_ordem := v_ordem + 1;
  end loop;

  with removidas as (
    delete from public.product_images
    where product_id = v_id and not (id = any (v_keep_images))
    returning url
  )
  select coalesce(array_agg(url), '{}') into v_removed from removidas;

  return jsonb_build_object('id', v_id, 'removed_urls', to_jsonb(v_removed));
end;
$$;

revoke execute on function public.admin_save_product(jsonb) from public, anon, authenticated;
grant execute on function public.admin_save_product(jsonb) to service_role;
