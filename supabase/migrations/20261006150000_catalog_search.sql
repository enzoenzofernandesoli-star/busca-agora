-- Phase 2: catalog listing and search.
--
-- * products.busca: full-text vector (Portuguese, accents removed), so
--   "serum" finds "Sérum".
-- * product_listing: what the store shows for a product card. Active
--   products only, cheapest variant price, total stock, first image.
--   Never exposes custo_cents.
-- * search_products / suggest_products: run as the caller (security
--   invoker), so RLS and the column grants keep applying.

create extension if not exists unaccent with schema extensions;

-- unaccent() is only STABLE (it depends on search_path), which a generated
-- column cannot use. Pinning the dictionary makes this wrapper IMMUTABLE.
create function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1);
$$;

-- Turns free text typed by a customer into a prefix query: every word must
-- match the start of a word ("fon blu" finds "Fone Bluetooth"). Anything
-- that is not a letter or digit is dropped, so the input can never break
-- the tsquery syntax. Returns NULL for empty input.
create function public.prefix_tsquery(p_text text)
returns tsquery
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when words = '' then null
    else to_tsquery(
      'portuguese',
      array_to_string(
        array(
          select w || ':*'
          from unnest(string_to_array(words, ' ')) as w
          where w <> ''
          limit 8
        ),
        ' & '
      )
    )
  end
  from (
    select btrim(
      regexp_replace(lower(public.f_unaccent(coalesce(p_text, ''))), '[^a-z0-9]+', ' ', 'g')
    ) as words
  ) as s;
$$;

alter table public.products
  add column busca tsvector generated always as (
    setweight(to_tsvector('portuguese', public.f_unaccent(nome)), 'A')
    || setweight(to_tsvector('portuguese', public.f_unaccent(descricao)), 'C')
  ) stored;

create index products_busca_idx on public.products using gin (busca);

-- ---------------------------------------------------------------------------
-- Listing view
-- ---------------------------------------------------------------------------

create view public.product_listing
with (security_invoker = on) as
  select
    p.id,
    p.slug,
    p.nome,
    p.destaque,
    p.created_at,
    c.slug as categoria_slug,
    c.nome as categoria_nome,
    b.slug as marca_slug,
    b.nome as marca_nome,
    v.preco_cents,
    v.preco_de_cents,
    v.preco_max_cents,
    v.estoque,
    img.url as imagem_url,
    img.alt as imagem_alt
  from public.products p
  join public.categories c on c.id = p.category_id and c.ativa
  left join public.brands b on b.id = p.brand_id
  join lateral (
    select
      min(pv.preco_cents) as preco_cents,
      max(pv.preco_cents) as preco_max_cents,
      -- "de" price of the cheapest variant, shown crossed out
      (array_agg(pv.preco_de_cents order by pv.preco_cents))[1] as preco_de_cents,
      sum(pv.estoque)::integer as estoque
    from public.product_variants pv
    where pv.product_id = p.id
  ) v on v.preco_cents is not null
  left join lateral (
    select pi.url, pi.alt
    from public.product_images pi
    where pi.product_id = p.id
    order by pi.ordem, pi.created_at
    limit 1
  ) img on true
  where p.ativo;

grant select on public.product_listing to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Search
-- ---------------------------------------------------------------------------

create function public.search_products(
  p_q text default null,
  p_categoria text default null,
  p_marca text default null,
  p_preco_min integer default null,
  p_preco_max integer default null,
  p_ordem text default 'relevancia',
  p_pagina integer default 1,
  p_por_pagina integer default 24
)
returns table (
  id uuid,
  slug text,
  nome text,
  destaque boolean,
  created_at timestamptz,
  categoria_slug text,
  categoria_nome text,
  marca_slug text,
  marca_nome text,
  preco_cents integer,
  preco_de_cents integer,
  preco_max_cents integer,
  estoque integer,
  imagem_url text,
  imagem_alt text,
  total bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      public.prefix_tsquery(p_q) as tsq,
      least(greatest(coalesce(p_por_pagina, 24), 1), 48) as por_pagina,
      greatest(coalesce(p_pagina, 1), 1) as pagina
  ),
  base as (
    select
      l.*,
      case when params.tsq is null then 0 else ts_rank(p.busca, params.tsq) end as rank
    from public.product_listing l
    join public.products p on p.id = l.id
    cross join params
    where (params.tsq is null or p.busca @@ params.tsq)
      and (p_categoria is null or l.categoria_slug = p_categoria)
      and (p_marca is null or l.marca_slug = p_marca)
      and (p_preco_min is null or l.preco_cents >= p_preco_min)
      and (p_preco_max is null or l.preco_cents <= p_preco_max)
  )
  select
    b.id, b.slug, b.nome, b.destaque, b.created_at,
    b.categoria_slug, b.categoria_nome, b.marca_slug, b.marca_nome,
    b.preco_cents, b.preco_de_cents, b.preco_max_cents, b.estoque,
    b.imagem_url, b.imagem_alt,
    count(*) over () as total
  from base b
  cross join params
  order by
    case when p_ordem = 'menor_preco' then b.preco_cents end asc,
    case when p_ordem = 'maior_preco' then b.preco_cents end desc,
    case when p_ordem = 'novidades' then b.created_at end desc,
    b.rank desc,
    b.destaque desc,
    b.created_at desc,
    b.id
  limit (select por_pagina from params)
  offset (select (pagina - 1) * por_pagina from params);
$$;

-- Up to 6 suggestions while the customer types.
create function public.suggest_products(p_q text)
returns table (slug text, nome text, categoria_slug text)
language sql
stable
security invoker
set search_path = ''
as $$
  select l.slug, l.nome, l.categoria_slug
  from public.product_listing l
  join public.products p on p.id = l.id
  where p.busca @@ public.prefix_tsquery(p_q)
  order by ts_rank(p.busca, public.prefix_tsquery(p_q)) desc, l.destaque desc, l.nome
  limit 6;
$$;

grant execute on function public.f_unaccent(text) to anon, authenticated, service_role;
grant execute on function public.prefix_tsquery(text) to anon, authenticated, service_role;
grant execute on function public.search_products(text, text, text, integer, integer, text, integer, integer)
  to anon, authenticated, service_role;
grant execute on function public.suggest_products(text) to anon, authenticated, service_role;
