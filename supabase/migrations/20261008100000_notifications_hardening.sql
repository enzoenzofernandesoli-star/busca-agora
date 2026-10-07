-- Phase 7 review fixes (Codex, 2026-10-08).
--
-- 1. A return request and its Telegram notice are written in the same
--    transaction: the trigger enqueues the notice when the event is
--    inserted, so a request can never be recorded without reaching us.
-- 2. Customers read only the events meant for them (status changes and
--    their own return request). Admin actions, failed jobs and requeues stay
--    admin-only, even through the API: filtering the page was not enough.

-- ---------------------------------------------------------------------------
-- 1. Return request enqueues its notice
-- ---------------------------------------------------------------------------

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
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Customer-visible events only
-- ---------------------------------------------------------------------------

drop policy order_events_read on public.order_events;

create policy order_events_read on public.order_events
  for select to authenticated
  using (
    (select public.is_admin())
    or (
      evento in ('status_changed', 'devolucao_solicitada')
      and exists (
        select 1 from public.orders o
        where o.id = order_id and o.user_id = (select auth.uid())
      )
    )
  );
