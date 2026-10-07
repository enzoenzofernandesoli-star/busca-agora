-- Phase 7: e-mails, Telegram and the jobs worker.
--
-- 1. orders.cliente_email: copy of the buyer's e-mail taken at checkout
--    (where the e-mails go; /rastreio matches it).
-- 2. jobs.etapa: one order sends several e-mails, one per stage. The unique
--    key becomes (tipo, order_id, etapa); '' for one-off jobs (invoice,
--    label, print), so the admin's requeue keeps working.
-- 3. Triggers enqueue the notices of each stage, whatever code path changed
--    the status (webhooks, admin): nobody has to remember to call anything.
-- 4. claim_jobs(): hands due jobs to one worker at a time.
-- 5. pg_cron calls /api/cron/jobs every minute (Vercel's free cron runs once
--    a day). URL and secret live in Vault, never in this file; without them
--    the tick does nothing (local Supabase).

-- ---------------------------------------------------------------------------
-- 1. Buyer's e-mail on the order
-- ---------------------------------------------------------------------------

alter table public.orders
  add column cliente_email text
    check (cliente_email = lower(cliente_email) and cliente_email like '%_@_%');

grant insert (cliente_email) on public.orders to service_role;

create index orders_numero_email_idx on public.orders (numero, cliente_email);

-- ---------------------------------------------------------------------------
-- 2. One job per (tipo, order, etapa)
-- ---------------------------------------------------------------------------

alter table public.jobs add column etapa text not null default '';
alter table public.jobs drop constraint jobs_tipo_order_id_key;
alter table public.jobs
  add constraint jobs_tipo_order_id_etapa_key unique (tipo, order_id, etapa);

-- ---------------------------------------------------------------------------
-- 3. Enqueue the notices of each stage
-- ---------------------------------------------------------------------------

create function public.enqueue_job(
  p_tipo public.job_type,
  p_order_id uuid,
  p_etapa text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.jobs (tipo, order_id, etapa)
  values (p_tipo, p_order_id, p_etapa)
  on conflict (tipo, order_id, etapa) do nothing;
$$;

-- New order: "Recebemos seu pedido".
create function public.enqueue_order_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.enqueue_job('email', new.id, 'pending_payment');
  return null;
end;
$$;

create trigger orders_enqueue_created
  after insert on public.orders
  for each row execute function public.enqueue_order_created();

-- Status change (set_order_status writes the event): e-mail of the stage,
-- and the Telegram notice when paid.
create function public.enqueue_status_notices()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_para text := new.detalhe ->> 'para';
begin
  if new.evento <> 'status_changed' then
    return null;
  end if;
  if v_para in ('paid', 'invoiced', 'shipped', 'delivered') then
    perform public.enqueue_job('email', new.order_id, v_para);
  end if;
  if v_para = 'paid' then
    perform public.enqueue_job('notify', new.order_id, 'paid');
  end if;
  return null;
end;
$$;

create trigger order_events_enqueue_notices
  after insert on public.order_events
  for each row execute function public.enqueue_status_notices();

-- One return/exchange request per order (a double click stays one).
create unique index order_events_one_return_idx
  on public.order_events (order_id)
  where evento = 'devolucao_solicitada';

-- ---------------------------------------------------------------------------
-- 4. Worker: claim due jobs
-- ---------------------------------------------------------------------------

-- Due pending jobs of the types this worker knows, plus "running" ones stuck
-- for 10 minutes (a worker that died mid-job). SKIP LOCKED: two workers never
-- take the same job.
create function public.claim_jobs(
  p_tipos public.job_type[],
  p_limit integer default 10
)
returns setof public.jobs
language sql
security definer
set search_path = ''
as $$
  update public.jobs j
  set status = 'running', updated_at = now()
  where j.id in (
    select id from public.jobs
    where tipo = any (p_tipos)
      and (
        (status = 'pending' and run_at <= now())
        or (status = 'running' and updated_at < now() - interval '10 minutes')
      )
    order by run_at
    limit greatest(1, least(p_limit, 50))
    for update skip locked
  )
  returning j.*;
$$;

revoke execute on function public.enqueue_job(public.job_type, uuid, text)
  from public, anon, authenticated;
revoke execute on function public.enqueue_order_created() from public, anon, authenticated;
revoke execute on function public.enqueue_status_notices() from public, anon, authenticated;
revoke execute on function public.claim_jobs(public.job_type[], integer) from public, anon, authenticated;
grant execute on function public.enqueue_job(public.job_type, uuid, text) to service_role;
grant execute on function public.claim_jobs(public.job_type[], integer) to service_role;

-- ---------------------------------------------------------------------------
-- 5. Every minute, call the worker
-- ---------------------------------------------------------------------------

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- Secrets created once per project (not in any file):
--   select vault.create_secret('<https://site/api/cron/jobs>', 'ba_jobs_url');
--   select vault.create_secret('<CRON_SECRET>', 'ba_cron_secret');
create function public.jobs_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url
  from vault.decrypted_secrets where name = 'ba_jobs_url';
  select decrypted_secret into v_secret
  from vault.decrypted_secrets where name = 'ba_cron_secret';
  if v_url is null or v_secret is null then
    return;
  end if;
  -- Only wake the worker when there is something due.
  if not exists (
    select 1 from public.jobs
    where (status = 'pending' and run_at <= now())
       or (status = 'running' and updated_at < now() - interval '10 minutes')
  ) then
    return;
  end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$$;

revoke execute on function public.jobs_tick() from public, anon, authenticated;

select cron.schedule('ba-jobs-tick', '* * * * *', 'select public.jobs_tick()');
