-- Phase 6: after payment, invoice -> label -> print, then tracking.
--
-- 1. orders.frete_servico_id: Melhor Envio service id chosen at checkout
--    (phase 5 fills it); the label is bought for that exact service.
-- 2. shipments: Melhor Envio status and where our PDFs live.
-- 3. A paid order starts the chain with an "invoice" job; each handler
--    enqueues the next one when it finishes (lib/jobs/handlers.tsx).
-- 4. label_ready -> shipped is allowed: an order can be posted without the
--    automatic print (PrintNode off, label printed by hand).
-- 5. Private bucket "documentos" for labels and order summaries.
-- 6. Tracking poll every 2 hours (/api/cron/rastreio), same Vault secrets
--    as the jobs worker.

-- 1 -------------------------------------------------------------------------
alter table public.orders
  add column frete_servico_id integer check (frete_servico_id > 0);

grant insert (frete_servico_id) on public.orders to service_role;

-- 2 -------------------------------------------------------------------------
alter table public.shipments
  add column me_status text,
  add column etiqueta_path text,
  add column resumo_path text,
  add column rastreio_consultado_em timestamptz;

-- 3 -------------------------------------------------------------------------
create or replace function public.enqueue_status_notices()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_para text := new.detalhe ->> 'para';
begin
  if new.evento = 'devolucao_solicitada' then
    perform public.enqueue_job('notify', new.order_id, 'devolucao');
    return null;
  end if;
  if new.evento <> 'status_changed' then
    return null;
  end if;
  if v_para in ('paid', 'invoiced', 'shipped', 'delivered') then
    perform public.enqueue_job('email', new.order_id, v_para);
  end if;
  if v_para = 'paid' then
    perform public.enqueue_job('notify', new.order_id, 'paid');
    -- Start of the fulfillment chain (invoice -> label -> print).
    perform public.enqueue_job('invoice', new.order_id, '');
  end if;
  return null;
end;
$$;

-- 4 -------------------------------------------------------------------------
create or replace function public.order_transition_allowed(
  p_from public.order_status,
  p_to public.order_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (p_from, p_to) in (
    ('pending_payment', 'paid'),
    ('pending_payment', 'canceled'),
    ('paid', 'invoiced'),
    -- NF-e off (NFE_ENABLED=false): label with content declaration.
    ('paid', 'label_ready'),
    ('paid', 'refunded'),
    ('invoiced', 'label_ready'),
    ('invoiced', 'refunded'),
    ('label_ready', 'printed'),
    -- Label printed by hand (PrintNode off) and posted.
    ('label_ready', 'shipped'),
    ('label_ready', 'refunded'),
    ('printed', 'shipped'),
    ('printed', 'refunded'),
    ('shipped', 'delivered'),
    ('delivered', 'refunded')
  );
$$;

-- 5 -------------------------------------------------------------------------
-- No policies: only the service role reads or writes; the admin downloads
-- through short-lived signed links made on the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- 6 -------------------------------------------------------------------------
create function public.tracking_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select regexp_replace(decrypted_secret, '/api/cron/jobs$', '/api/cron/rastreio')
  into v_url
  from vault.decrypted_secrets where name = 'ba_jobs_url';
  select decrypted_secret into v_secret
  from vault.decrypted_secrets where name = 'ba_cron_secret';
  if v_url is null or v_secret is null then
    return;
  end if;
  -- Only when something is on its way.
  if not exists (
    select 1 from public.orders o
    join public.shipments s on s.order_id = o.id
    where o.status in ('label_ready', 'printed', 'shipped')
      and s.me_order_id is not null
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

revoke execute on function public.tracking_tick() from public, anon, authenticated;

select cron.schedule('ba-tracking-tick', '15 */2 * * *', 'select public.tracking_tick()');
