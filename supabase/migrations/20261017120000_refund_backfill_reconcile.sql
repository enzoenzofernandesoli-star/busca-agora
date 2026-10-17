-- Phase 5, third review (Codex, 2026-10-17): orders whose settling payment
-- was already refunded or charged back before 20261017110000 (the backfill
-- linked them but left the order as it was).
--
-- For each one: move the order to refunded when the state machine allows;
-- if a label/print job holds the order right now, or the move is not
-- allowed, block fulfillment durably (estorno_status) and leave an event for
-- the admin plus a 'refund' job that keeps reconciling. Never guesses: only
-- orders already linked to that payment are touched.

do $$
declare
  v record;
  v_token uuid;
begin
  for v in
    select o.id, o.status, o.paid_payment_id, p.status as pagamento
    from public.orders o
    join public.payments p on p.mp_payment_id = o.paid_payment_id and p.order_id = o.id
    where p.status in ('refunded', 'charged_back')
      and o.status <> 'refunded'
  loop
    begin
      if public.order_transition_allowed(v.status, 'refunded') then
        perform public.set_order_status(v.id, 'refunded', jsonb_build_object(
          'mp_payment_id', v.paid_payment_id, 'motivo', v.pagamento,
          'origem', 'reconciliacao_migracao'));
        continue;
      end if;
    exception when others then
      null; -- e.g. fulfillment_in_progress: blocked below instead.
    end;

    v_token := gen_random_uuid();
    update public.orders
    set estorno_status = 'solicitado', estorno_token = v_token, estorno_em = now()
    where id = v.id and estorno_status is null;
    insert into public.jobs (tipo, order_id, etapa)
    values ('refund', v.id, v_token::text)
    on conflict (tipo, order_id, etapa) do nothing;
    insert into public.order_events (order_id, evento, detalhe)
    values (v.id, 'refund_needs_review', jsonb_build_object(
      'mp_payment_id', v.paid_payment_id, 'motivo', v.pagamento,
      'status_pedido', v.status, 'origem', 'reconciliacao_migracao'));
  end loop;
end;
$$;
