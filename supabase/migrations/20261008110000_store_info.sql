-- Phase 9: store identity shown to the public (footer, legal pages).
--
-- The e-commerce decree (Decreto 7.962/2013, art. 2) asks for the seller's
-- name, CPF or CNPJ, address and contact on the site. settings stays
-- admin-only; store_info() hands out exactly those public fields (never IE,
-- tax regime, printer or the shipping origin).

alter table public.settings
  add column cpf_vendedor text check (cpf_vendedor ~ '^\d{11}$'),
  add column endereco_empresa text check (length(endereco_empresa) <= 300),
  add column email_contato text
    check (email_contato = lower(email_contato) and email_contato like '%_@_%'),
  add column whatsapp text check (whatsapp ~ '^\d{12,13}$'),
  add column horario_atendimento text check (length(horario_atendimento) <= 120);

create function public.store_info()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'vendedor', s.razao_social,
    -- CNPJ when there is one; the seller's CPF only until then.
    'cnpj', s.cnpj,
    'cpf', case when s.cnpj is null then s.cpf_vendedor end,
    'endereco', s.endereco_empresa,
    'email', s.email_contato,
    'whatsapp', s.whatsapp,
    'horario', s.horario_atendimento
  )
  from public.settings s
  where s.id;
$$;

revoke execute on function public.store_info() from public;
grant execute on function public.store_info() to anon, authenticated, service_role;
