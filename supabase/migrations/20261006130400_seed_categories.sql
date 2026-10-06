-- Phase 1: the two store categories (CLAUDE.md section 4). No products.
-- A migration, not seed.sql, because production needs these rows too.

insert into public.categories (nome, slug, cor, icone, ordem, ativa)
values
  ('Eletrônicos', 'eletronicos', '#7ADFFF', 'smartphone', 1, true),
  ('Cosméticos', 'cosmeticos', '#FF9AC8', 'sparkles', 2, true)
on conflict (slug) do nothing;
