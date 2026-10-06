-- Phase 3 review fixes (ChatGPT review of PR #4, 2026-10-06).
--
-- 1. terms_accepted_at is a record written by the server (signup and
--    acceptTerms). Customers lose the direct UPDATE grant on that column;
--    nome, cpf and telefone stay editable.
-- 2. Address writes that touch the main address run in ONE transaction:
--    the current main address is only unset after the target is confirmed
--    to exist and belong to the caller. A missing or foreign id raises
--    instead of "succeeding" with zero rows. SECURITY INVOKER: RLS on
--    addresses still decides what the caller can see and change.

revoke update (terms_accepted_at) on public.profiles from authenticated;

-- ---------------------------------------------------------------------------
-- Address functions
-- ---------------------------------------------------------------------------

create function public.set_main_address(p_address_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  -- Lock the target first: it must exist and be the caller's.
  perform 1 from public.addresses
  where id = p_address_id and user_id = v_user
  for update;
  if not found then
    raise exception 'address_not_found';
  end if;

  update public.addresses
  set principal = false
  where user_id = v_user and principal and id <> p_address_id;

  update public.addresses
  set principal = true
  where id = p_address_id and user_id = v_user;
end;
$$;

-- Creates (p_address_id null) or edits an address. The first address of a
-- customer is always the main one, and the main address can only change by
-- choosing another one (unchecking it while editing keeps it main).
create function public.save_address(
  p_cep text,
  p_rua text,
  p_numero text,
  p_bairro text,
  p_cidade text,
  p_uf text,
  p_principal boolean,
  p_complemento text default null,
  -- null creates a new address
  p_address_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_id uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  if p_address_id is null then
    insert into public.addresses (
      user_id, cep, rua, numero, complemento, bairro, cidade, uf, principal
    )
    values (
      v_user, p_cep, p_rua, p_numero, p_complemento, p_bairro, p_cidade, p_uf, false
    )
    returning id into v_id;
  else
    update public.addresses
    set cep = p_cep, rua = p_rua, numero = p_numero, complemento = p_complemento,
        bairro = p_bairro, cidade = p_cidade, uf = p_uf
    where id = p_address_id and user_id = v_user
    returning id into v_id;
    if v_id is null then
      raise exception 'address_not_found';
    end if;
  end if;

  if p_principal or not exists (
    select 1 from public.addresses where user_id = v_user and principal
  ) then
    perform public.set_main_address(v_id);
  end if;

  return v_id;
end;
$$;

-- Deletes an address; when it was the main one, the oldest remaining
-- address becomes main.
create function public.delete_address(p_address_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_era_principal boolean;
  v_outro uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.addresses
  where id = p_address_id and user_id = v_user
  returning principal into v_era_principal;
  if not found then
    raise exception 'address_not_found';
  end if;

  if v_era_principal then
    select id into v_outro
    from public.addresses
    where user_id = v_user
    order by created_at, id
    limit 1;
    if v_outro is not null then
      update public.addresses set principal = true where id = v_outro;
    end if;
  end if;
end;
$$;

revoke execute on function public.set_main_address(uuid) from public, anon;
revoke execute on function public.save_address(text, text, text, text, text, text, boolean, text, uuid)
  from public, anon;
revoke execute on function public.delete_address(uuid) from public, anon;

grant execute on function public.set_main_address(uuid) to authenticated;
grant execute on function public.save_address(text, text, text, text, text, text, boolean, text, uuid)
  to authenticated;
grant execute on function public.delete_address(uuid) to authenticated;
