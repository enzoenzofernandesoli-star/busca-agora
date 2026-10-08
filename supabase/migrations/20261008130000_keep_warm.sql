-- Keeps the site's server function warm (decision of 08/10: the store felt
-- frozen on the first click after a pause; Vercel's free plan cold-starts an
-- idle function in ~1 s). Every 4 minutes, a GET to /api/saude on the same
-- host as the jobs worker URL kept in Vault. Without that secret (local
-- Supabase) it does nothing.

create function public.keep_warm()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
begin
  select regexp_replace(decrypted_secret, '/api/cron/jobs$', '/api/saude')
  into v_url
  from vault.decrypted_secrets where name = 'ba_jobs_url';
  if v_url is null then
    return;
  end if;
  perform net.http_get(url := v_url, timeout_milliseconds := 10000);
end;
$$;

revoke execute on function public.keep_warm() from public, anon, authenticated;

select cron.schedule('ba-keep-warm', '*/4 * * * *', 'select public.keep_warm()');
