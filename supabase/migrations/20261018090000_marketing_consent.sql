-- Marketing consent (LGPD, request of 18/10). Separate from the terms:
-- never required to buy or to create an account, never pre-checked.
--
-- profiles.marketing_opt_in (default false), when it was given
-- (marketing_opt_in_at), when it was withdrawn (marketing_opt_out_at) and
-- the channels (email, whatsapp). The dates are written only by the
-- database (set_marketing_consent), never by the browser. The customer
-- reads their own row (existing RLS); there is no column grant for these
-- fields: changes go through the functions below.

alter table public.profiles
  add column marketing_opt_in boolean not null default false,
  add column marketing_opt_in_at timestamptz,
  add column marketing_opt_out_at timestamptz,
  add column marketing_channels text[] not null default '{}'
    check (marketing_channels <@ array['email', 'whatsapp']::text[]);

-- Server-side (sign-up, before the customer has a session).
create function public.set_marketing_consent(
  p_user_id uuid,
  p_opt_in boolean,
  p_channels text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_atual boolean;
  v_channels text[];
begin
  select marketing_opt_in into v_atual from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile_not_found';
  end if;

  if p_opt_in then
    v_channels := coalesce(p_channels, '{}');
    if cardinality(v_channels) = 0 then
      v_channels := array['email', 'whatsapp'];
    end if;
    update public.profiles
    set marketing_opt_in = true,
        marketing_channels = (select array_agg(distinct c order by c) from unnest(v_channels) c),
        marketing_opt_in_at = case when v_atual then marketing_opt_in_at else now() end,
        marketing_opt_out_at = case when v_atual then marketing_opt_out_at else null end
    where id = p_user_id;
  else
    update public.profiles
    set marketing_opt_in = false,
        marketing_channels = '{}',
        marketing_opt_out_at = case when v_atual then now() else marketing_opt_out_at end
    where id = p_user_id;
  end if;
end;
$$;

-- The logged-in customer changes only their own consent.
create function public.set_my_marketing_consent(p_opt_in boolean, p_channels text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  perform public.set_marketing_consent(auth.uid(), p_opt_in, p_channels);
end;
$$;

revoke execute on function public.set_marketing_consent(uuid, boolean, text[]) from public, anon, authenticated;
grant execute on function public.set_marketing_consent(uuid, boolean, text[]) to service_role;
revoke execute on function public.set_my_marketing_consent(boolean, text[]) from public, anon;
grant execute on function public.set_my_marketing_consent(boolean, text[]) to authenticated;
