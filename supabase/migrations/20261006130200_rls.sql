-- Phase 1: row level security on every table (CLAUDE.md rule 5 and section 6).
--
-- How access works:
-- * The server uses the service role, which bypasses RLS. "Only the server
--   writes" therefore means: no write policy and no write grant for the
--   anon/authenticated roles.
-- * Privileges are granted explicitly below instead of relying on the
--   project's default grants, so a table only exposes what is listed here.
-- * (select auth.uid()) instead of auth.uid(): evaluated once per query,
--   not once per row.
-- * Admin screens that change orders, payments, invoices, shipments or jobs
--   run as Server Actions that check the role and then use the service role.

-- ---------------------------------------------------------------------------
-- Helper
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so it reads profiles without going through the profiles
-- policies (which call this function: that would recurse).
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
-- anon needs it too: public catalog policies call it (it returns false).
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere and start from zero privileges
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.shipments enable row level security;
alter table public.jobs enable row level security;
alter table public.order_events enable row level security;
alter table public.webhook_logs enable row level security;
alter table public.settings enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------
-- profiles: owner reads and edits their own row; admin reads all.
-- Nobody can change their own role: only these columns are updatable.
-- Rows are created by the signup trigger, never by the client.
-- ---------------------------------------------------------------------------

grant select on public.profiles to authenticated;
grant update (nome, cpf, telefone, terms_accepted_at) on public.profiles to authenticated;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- addresses: owner only
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.addresses to authenticated;

create policy addresses_owner on public.addresses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Catalog: public read, admin write
-- ---------------------------------------------------------------------------

grant select on public.categories, public.brands, public.products, public.product_images
  to anon, authenticated;
grant insert, update, delete
  on public.categories, public.brands, public.products, public.product_images
  to authenticated;

create policy categories_read on public.categories
  for select to anon, authenticated
  using (ativa or (select public.is_admin()));

create policy categories_admin on public.categories
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy brands_read on public.brands
  for select to anon, authenticated
  using (true);

create policy brands_admin on public.brands
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy products_read on public.products
  for select to anon, authenticated
  using (ativo or (select public.is_admin()));

create policy products_admin on public.products
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy product_images_read on public.product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (p.ativo or (select public.is_admin()))
    )
  );

create policy product_images_admin on public.product_images
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- product_variants: custo_cents never reaches the browser.
-- RLS filters rows, not columns, so the cost column is cut with a column
-- grant: anon/authenticated can SELECT every column except custo_cents.
-- The admin panel reads cost on the server with the service role.
-- ---------------------------------------------------------------------------

grant select (
  id, product_id, sku, nome, preco_cents, preco_de_cents, estoque, peso_g,
  altura_cm, largura_cm, comprimento_cm, ean, created_at, updated_at
) on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;

create policy product_variants_read on public.product_variants
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (p.ativo or (select public.is_admin()))
    )
  );

create policy product_variants_admin on public.product_variants
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- What the store reads. security_invoker: the caller's grants and policies
-- apply, so this view can never show more than the table allows.
create view public.product_variants_public
with (security_invoker = on) as
  select
    id, product_id, sku, nome, preco_cents, preco_de_cents, estoque, peso_g,
    altura_cm, largura_cm, comprimento_cm, ean
  from public.product_variants;

grant select on public.product_variants_public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Cart: logged-in owner only. Visitor carts (session_id) are handled by the
-- server, because the database cannot prove who owns a session id.
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.carts, public.cart_items to authenticated;

create policy carts_owner on public.carts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy cart_items_owner on public.cart_items
  for all to authenticated
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Orders and children: owner reads, admin reads, only the server writes
-- ---------------------------------------------------------------------------

grant select
  on public.orders, public.order_items, public.invoices, public.shipments, public.order_events
  to authenticated;

create policy orders_read on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy order_items_read on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

create policy invoices_read on public.invoices
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

create policy shipments_read on public.shipments
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

create policy order_events_read on public.order_events
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

-- ---------------------------------------------------------------------------
-- Server and admin only
-- ---------------------------------------------------------------------------

grant select on public.payments, public.jobs to authenticated;
grant select, update on public.settings to authenticated;

create policy payments_admin_read on public.payments
  for select to authenticated
  using ((select public.is_admin()));

create policy jobs_admin_read on public.jobs
  for select to authenticated
  using ((select public.is_admin()));

create policy settings_admin_read on public.settings
  for select to authenticated
  using ((select public.is_admin()));

create policy settings_admin_update on public.settings
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- webhook_logs: RLS on, no grant, no policy = service role only.
