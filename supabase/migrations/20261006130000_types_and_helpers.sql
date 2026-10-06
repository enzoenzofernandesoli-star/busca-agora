-- Phase 1: enum types and shared helpers.
-- Money is always integer cents. Timestamps are timestamptz (stored in UTC).

create type public.user_role as enum ('customer', 'admin');

create type public.order_status as enum (
  'pending_payment',
  'paid',
  'invoiced',
  'label_ready',
  'printed',
  'shipped',
  'delivered',
  'canceled',
  'refunded'
);

create type public.payment_method as enum ('pix', 'boleto', 'card');

create type public.job_type as enum ('notify', 'invoice', 'label', 'print', 'email');

create type public.job_status as enum ('pending', 'running', 'done', 'failed');

-- Keeps updated_at current on every UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
