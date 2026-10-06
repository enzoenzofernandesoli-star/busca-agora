-- Phase 1: the 18 tables (CLAUDE.md section 6).
-- Orders and their children are never deleted (fiscal record), so their
-- foreign keys use RESTRICT; customer data copied into the order survives
-- the customer deleting the account.

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  cpf text check (cpf ~ '^\d{11}$'),
  telefone text check (telefone ~ '^\d{10,11}$'),
  terms_accepted_at timestamptz,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  cep text not null check (cep ~ '^\d{8}$'),
  rua text not null,
  numero text not null,
  complemento text,
  bairro text not null,
  cidade text not null,
  uf text not null check (uf ~ '^[A-Z]{2}$'),
  principal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);
-- At most one main address per customer.
create unique index addresses_one_principal_idx
  on public.addresses (user_id) where principal;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  cor text not null check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  icone text,
  ordem integer not null default 0,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  descricao text not null default '',
  category_id uuid not null references public.categories (id) on delete restrict,
  brand_id uuid references public.brands (id) on delete set null,
  ncm text not null check (ncm ~ '^\d{8}$'),
  cfop text not null default '5102' check (cfop ~ '^\d{4}$'),
  -- Origem da mercadoria (tabela A do ICMS): 0 nacional ... 8.
  origem smallint not null default 0 check (origem between 0 and 8),
  ativo boolean not null default false,
  destaque boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_brand_id_idx on public.products (brand_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  nome text not null default '',
  preco_cents integer not null check (preco_cents >= 0),
  preco_de_cents integer check (preco_de_cents >= 0),
  -- Never sent to the browser: see the column grants in the RLS migration.
  custo_cents integer check (custo_cents >= 0),
  estoque integer not null default 0 check (estoque >= 0),
  peso_g integer not null check (peso_g > 0),
  altura_cm numeric(6, 2) not null check (altura_cm > 0),
  largura_cm numeric(6, 2) not null check (largura_cm > 0),
  comprimento_cm numeric(6, 2) not null check (comprimento_cm > 0),
  ean text check (ean ~ '^\d{8,14}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_variants_product_id_idx on public.product_variants (product_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  ordem integer not null default 0,
  alt text not null default '',
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);

-- ---------------------------------------------------------------------------
-- Cart
-- ---------------------------------------------------------------------------

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete cascade,
  session_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A cart belongs to a logged-in customer OR to a visitor session, never both.
  constraint carts_owner_check check (num_nonnulls(user_id, session_id) = 1)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantidade integer not null check (quantidade > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index cart_items_variant_id_idx on public.cart_items (variant_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

-- BA-000001, BA-000002, ... A failed insert burns a number; gaps are accepted.
create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique
    default 'BA-' || lpad(nextval('public.order_number_seq')::text, 6, '0'),
  user_id uuid references public.profiles (id) on delete set null,
  status public.order_status not null default 'pending_payment',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  frete_cents integer not null default 0 check (frete_cents >= 0),
  desconto_cents integer not null default 0 check (desconto_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  frete_servico text,
  -- Copies taken at checkout: later profile/address edits never change an order.
  endereco jsonb not null,
  cliente_nome text not null,
  cliente_cpf text not null check (cliente_cpf ~ '^\d{11}$'),
  payment_method public.payment_method not null,
  -- Set by reserve_stock(); makes the stock reservation idempotent (rule 4).
  estoque_baixado_em timestamptz,
  -- Set by restore_stock() when a canceled order gives its units back.
  estoque_devolvido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_check
    check (total_cents = subtotal_cents + frete_cents - desconto_cents)
);

alter sequence public.order_number_seq owned by public.orders.numero;

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete set null,
  nome text not null,
  sku text not null,
  ncm text not null check (ncm ~ '^\d{8}$'),
  preco_cents integer not null check (preco_cents >= 0),
  quantidade integer not null check (quantidade > 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_variant_id_idx on public.order_items (variant_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  mp_payment_id text not null unique,
  metodo public.payment_method not null,
  -- Mercado Pago status, as returned by their API (approved, pending, ...).
  status text not null,
  valor_cents integer not null check (valor_cents >= 0),
  parcelas smallint not null default 1 check (parcelas >= 1),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_id_idx on public.payments (order_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete restrict,
  numero text,
  serie text,
  chave text unique check (chave ~ '^\d{44}$'),
  status text not null,
  xml_url text,
  danfe_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete restrict,
  me_order_id text unique,
  transportadora text,
  servico text,
  rastreio text,
  etiqueta_url text,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Server internals
-- ---------------------------------------------------------------------------

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  tipo public.job_type not null,
  order_id uuid not null references public.orders (id) on delete restrict,
  status public.job_status not null default 'pending',
  tentativas integer not null default 0 check (tentativas between 0 and 5),
  ultimo_erro text,
  run_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tipo, order_id)
);

create index jobs_order_id_idx on public.jobs (order_id);
-- The worker picks due pending jobs.
create index jobs_due_idx on public.jobs (run_at) where status = 'pending';

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  evento text not null,
  detalhe jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index order_events_order_id_idx on public.order_events (order_id, created_at);

create table public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  origem text not null,
  external_id text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (origem, external_id)
);

-- Single row: the primary key can only ever be TRUE.
create table public.settings (
  id boolean primary key default true check (id),
  razao_social text,
  cnpj text check (cnpj ~ '^\d{14}$'),
  ie text,
  endereco_origem jsonb,
  regime_tributario text,
  printer_id text,
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (true);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger brands_updated_at before update on public.brands
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();
create trigger carts_updated_at before update on public.carts
  for each row execute function public.set_updated_at();
create trigger cart_items_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger shipments_updated_at before update on public.shipments
  for each row execute function public.set_updated_at();
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
