-- Phase 9 review (Codex, 2026-10-08): the privacy policy promises how long
-- data is kept; this makes the database keep that promise.
--
-- * auth_rate_limits: the longest window is 1 hour; rows older than 1 day
--   are deleted (hit_rate_limit only cleaned up now and then, at random).
-- * Visitor carts: the ba_carrinho cookie lives 30 days, so a visitor cart
--   untouched for 30 days can never be reached again; it is deleted with its
--   items. Customer carts stay while the account exists.
-- Runs every day at 06:00 UTC (03:00 in São Paulo).

create function public.cleanup_old_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.auth_rate_limits
  where janela_inicio < now() - interval '1 day';

  delete from public.carts c
  where c.user_id is null
    and c.updated_at < now() - interval '30 days'
    and not exists (
      select 1 from public.cart_items i
      where i.cart_id = c.id and i.updated_at >= now() - interval '30 days'
    );
end;
$$;

revoke execute on function public.cleanup_old_data() from public, anon, authenticated;
grant execute on function public.cleanup_old_data() to service_role;

select cron.schedule('ba-cleanup-old-data', '0 6 * * *', 'select public.cleanup_old_data()');
