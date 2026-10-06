-- Phase 3: login/signup rate limits and account deletion (LGPD).

-- ---------------------------------------------------------------------------
-- Rate limits
-- ---------------------------------------------------------------------------

-- One row per key and fixed window. Keys are hashes (IP and/or e-mail), so
-- no personal data is stored here.
create table public.auth_rate_limits (
  chave text not null,
  janela_inicio timestamptz not null,
  tentativas integer not null default 0,
  primary key (chave, janela_inicio)
);

alter table public.auth_rate_limits enable row level security;
-- No grants and no policies: service role only.
revoke all on public.auth_rate_limits from anon, authenticated;
grant all on public.auth_rate_limits to service_role;

-- Counts one attempt for `p_chave` in the current window and returns true
-- while the key is still under `p_max`. Atomic (single upsert), so parallel
-- requests cannot slip past the limit.
create function public.hit_rate_limit(
  p_chave text,
  p_max integer,
  p_janela_segundos integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inicio timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_janela_segundos) * p_janela_segundos
  );
  v_tentativas integer;
begin
  insert into public.auth_rate_limits as r (chave, janela_inicio, tentativas)
  values (p_chave, v_inicio, 1)
  on conflict (chave, janela_inicio)
  do update set tentativas = r.tentativas + 1
  returning r.tentativas into v_tentativas;

  -- Housekeeping: old windows are useless after a day.
  delete from public.auth_rate_limits
  where janela_inicio < now() - interval '1 day'
    and random() < 0.01;

  return v_tentativas <= p_max;
end;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Account deletion (LGPD)
-- ---------------------------------------------------------------------------

-- Deletes the customer's personal data and the login itself. Orders and
-- invoices stay (fiscal retention, 5 years) with only the copies taken at
-- checkout (name, CPF, delivery address), no longer linked to any account.
-- Decision of 2026-10-06.
create function public.delete_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user_not_found';
  end if;

  if exists (
    select 1 from public.profiles where id = p_user_id and role = 'admin'
  ) then
    raise exception 'admin_account';
  end if;

  -- Cascades: auth.users -> profiles -> addresses, carts -> cart_items.
  -- orders.user_id is ON DELETE SET NULL: the orders stay, unlinked.
  delete from auth.users where id = p_user_id;
end;
$$;

revoke execute on function public.delete_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_account(uuid) to service_role;
