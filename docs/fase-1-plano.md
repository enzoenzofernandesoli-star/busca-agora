# Fase 1 — Banco: plano (aprovado em 06/10: testes no Supabase local via Docker; estoque reservado na criação do pedido)

Branch `fase-1-banco`, criada a partir de `fase-0-fundacao` (a main ainda não tem o app).

## Arquivos

```
supabase/migrations/
  20261006130000_types_and_helpers.sql     enums, is_admin(), updated_at
  20261006130100_tables.sql                as 18 tabelas, índices, chaves únicas
  20261006130200_rls.sql                   RLS + políticas + grants de coluna + view pública
  20261006130300_functions.sql             trigger de profile, número do pedido, estoque, status
  20261006130400_seed_categories.sql       Eletrônicos e Cosméticos (migration, para ir à produção)
lib/db/types.ts                            gerado: supabase gen types typescript
tests/db/*.test.ts                         Vitest contra o Supabase local (npm run test:db)
vitest.db.config.mts
```

Seed das categorias vai em migration (não em `seed.sql`), porque `seed.sql` só roda no banco local e a loja precisa delas em produção.

## Tipos (enums)

```sql
create type public.user_role      as enum ('customer', 'admin');
create type public.order_status   as enum ('pending_payment','paid','invoiced','label_ready',
                                           'printed','shipped','delivered','canceled','refunded');
create type public.payment_method as enum ('pix', 'boleto', 'card');
create type public.job_type       as enum ('notify','invoice','label','print','email');
create type public.job_status     as enum ('pending','running','done','failed');
```

## Tabelas (resumo)

Todas com `id uuid default gen_random_uuid()` (exceto `profiles.id` = `auth.users.id`), `created_at`/`updated_at timestamptz` em UTC. Dinheiro sempre `integer` com `check (x >= 0)`.

| Tabela | Detalhes que importam |
| --- | --- |
| `profiles` | `role user_role not null default 'customer'`, `cpf` com check de 11 dígitos |
| `addresses` | `uf char(2)`, `cep` 8 dígitos; índice único parcial: 1 `principal` por usuário |
| `categories` | `slug unique`, `cor`, `icone`, `ordem`, `ativa` |
| `brands` | `slug unique` |
| `products` | `slug unique`, `ncm` 8 dígitos, `cfop`, `origem smallint 0..8`, `ativo`, `destaque` |
| `product_variants` | `sku unique`, `preco_cents`, `preco_de_cents`, `custo_cents`, `estoque integer check (estoque >= 0)`, peso e medidas |
| `product_images` | `ordem`, `alt` |
| `carts` | `user_id` OU `session_id` (check: exatamente um), únicos |
| `cart_items` | `quantidade > 0`, único `(cart_id, variant_id)` |
| `orders` | `numero text unique` (BA-000001), `status order_status`, centavos, `endereco jsonb`, `estoque_baixado_em timestamptz` (ver estoque) |
| `order_items` | cópias de nome, sku, ncm, preço |
| `payments` | `mp_payment_id text unique`, `raw jsonb` |
| `invoices` | `order_id unique` |
| `shipments` | `order_id unique` |
| `jobs` | `tipo job_type`, `status job_status`, `tentativas`, `ultimo_erro`, `run_at`; `unique (tipo, order_id)` |
| `order_events` | `evento`, `detalhe jsonb` |
| `webhook_logs` | `unique (origem, external_id)` |
| `settings` | linha única (`id boolean primary key default true check (id)`) |

Coluna extra fora da seção 6: `orders.estoque_baixado_em`. Serve para a baixa de estoque ser idempotente (regra 4): o mesmo webhook duas vezes não baixa duas vezes.

## RLS e políticas

Princípio: o servidor usa a service role, que ignora RLS. Por isso "só servidor escreve" = **não existe política de escrita** para `anon`/`authenticated`. RLS liga em todas as 18 tabelas; tabela sem política = ninguém de fora acessa.

`(select auth.uid())` em vez de `auth.uid()`: o Postgres avalia uma vez por consulta, não por linha.

```sql
-- Helper. security definer para ler profiles sem cair na RLS de profiles (evita recursão).
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke execute on function public.is_admin() from public, anon;

-- liga RLS em todas
alter table public.profiles         enable row level security;
-- ... (as 18)

-- profiles: dono lê e edita o seu; admin lê todos. Ninguém muda o próprio role.
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (nome, cpf, telefone, terms_accepted_at) on public.profiles to authenticated;
-- insert do profile só pelo trigger (security definer)

-- addresses: dono faz tudo
create policy addresses_owner on public.addresses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- catálogo: leitura pública, escrita admin
create policy categories_read on public.categories for select to anon, authenticated
  using (ativa or (select public.is_admin()));
create policy categories_admin on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy brands_read on public.brands for select to anon, authenticated using (true);
create policy brands_admin on public.brands for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy products_read on public.products for select to anon, authenticated
  using (ativo or (select public.is_admin()));
create policy products_admin on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy product_images_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.id = product_id and (p.ativo or (select public.is_admin()))));
create policy product_images_admin on public.product_images for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- product_variants: custo_cents fora do navegador.
-- RLS é por linha, não por coluna: o corte da coluna é feito com grant de coluna.
revoke select on public.product_variants from anon, authenticated;
grant select (id, product_id, sku, nome, preco_cents, preco_de_cents, estoque, peso_g,
              altura_cm, largura_cm, comprimento_cm, ean, created_at, updated_at)
  on public.product_variants to anon, authenticated;
create policy variants_read on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.ativo));
create policy variants_admin on public.product_variants for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create view public.product_variants_public with (security_invoker = on) as
  select id, product_id, sku, nome, preco_cents, preco_de_cents, estoque, peso_g,
         altura_cm, largura_cm, comprimento_cm, ean
  from public.product_variants;
grant select on public.product_variants_public to anon, authenticated;

-- carrinho: dono (logado). Carrinho de visitante (session_id) só pelo servidor,
-- porque o banco não tem como provar de quem é um session_id.
create policy carts_owner on public.carts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy cart_items_owner on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c
                 where c.id = cart_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.carts c
                      where c.id = cart_id and c.user_id = (select auth.uid())));

-- pedidos e filhos: dono lê, admin lê, ninguém de fora escreve
create policy orders_read on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy order_items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));
create policy invoices_read on public.invoices for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));
create policy shipments_read on public.shipments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));
create policy order_events_read on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));

-- só servidor e admin
create policy payments_admin_read on public.payments for select to authenticated
  using ((select public.is_admin()));
create policy jobs_admin_read on public.jobs for select to authenticated
  using ((select public.is_admin()));
create policy settings_admin on public.settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- webhook_logs: RLS ligado e nenhuma política = só service role.
```

Admin não escreve em pedido/pagamento pelo navegador: ações do admin (cancelar, estornar, reimprimir) passam por Server Action que confere o role e usa a service role.

## Funções

```sql
-- 1. Profile no cadastro
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Número do pedido
create sequence public.order_number_seq;
-- orders.numero default: 'BA-' || lpad(nextval('public.order_number_seq')::text, 6, '0')
-- (pedido que falha no insert "queima" um número; buraco na sequência é aceitável)

-- 3. Baixa de estoque: tudo ou nada, idempotente
create function public.reserve_stock(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  -- trava o pedido: dois webhooks iguais ao mesmo tempo esperam um pelo outro
  perform 1 from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if exists (select 1 from public.orders where id = p_order_id and estoque_baixado_em is not null)
    then return; end if;

  -- trava as variantes em ordem de id (evita deadlock entre pedidos)
  for r in
    select v.id, v.estoque, sum(i.quantidade)::int as qtd
    from public.order_items i join public.product_variants v on v.id = i.variant_id
    where i.order_id = p_order_id
    group by v.id, v.estoque order by v.id
    for update of v
  loop
    if r.estoque < r.qtd then
      raise exception 'insufficient_stock' using detail = r.id::text;
    end if;
    update public.product_variants set estoque = estoque - r.qtd where id = r.id;
  end loop;

  update public.orders set estoque_baixado_em = now() where id = p_order_id;
end $$;
-- (no SQL final o lock é feito antes, em subquery, porque Postgres não aceita
--  FOR UPDATE junto com GROUP BY; a lógica é esta)

-- 4. Devolução de estoque (cancelamento de Pix/boleto vencido), também idempotente
create function public.restore_stock(p_order_id uuid) returns void ...  -- espelho da anterior

-- 5. Mudança de status: só o servidor, sempre com evento
create function public.set_order_status(p_order_id uuid, p_status public.order_status,
                                        p_detalhe jsonb default '{}') returns void
language plpgsql security definer set search_path = '' as $$
declare v_old public.order_status;
begin
  select status into v_old from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_old = p_status then return; end if;               -- idempotente
  if not public.order_transition_allowed(v_old, p_status) then
    raise exception 'invalid_transition: % -> %', v_old, p_status;
  end if;
  update public.orders set status = p_status where id = p_order_id;
  insert into public.order_events (order_id, evento, detalhe)
  values (p_order_id, 'status:' || p_status,
          p_detalhe || jsonb_build_object('de', v_old, 'para', p_status));
end $$;

-- transições permitidas
-- pending_payment -> paid | canceled
-- paid -> invoiced | label_ready (NF-e desligada) | refunded   (pedido pago não "cancela": estorna)
-- invoiced -> label_ready | refunded
-- label_ready -> printed | refunded
-- printed -> shipped | refunded
-- shipped -> delivered
-- delivered -> refunded

-- as três funções de estoque/status: só service role
revoke execute on function public.reserve_stock(uuid), public.restore_stock(uuid),
  public.set_order_status(uuid, public.order_status, jsonb) from public, anon, authenticated;
grant execute on function ... to service_role;
```

## Testes (`npm run test:db`, Vitest)

Rodam contra o Supabase local (`supabase start`), nunca contra o projeto real. Criam usuários de teste com e-mail `@example.test`.

1. Cliente A não lê pedido, item, endereço, nota, envio nem eventos do cliente B (e lê os seus).
2. Anônimo: `select custo_cents from product_variants` dá erro de permissão; a view não tem a coluna; produto inativo não aparece.
3. Cliente não muda o próprio `role` nem escreve em `orders`/`payments`/`jobs`; não executa `reserve_stock` nem `set_order_status`.
4. Estoque 1, dois pedidos chamam `reserve_stock` ao mesmo tempo: um passa, o outro recebe `insufficient_stock`, estoque final 0.
5. Mesmo pedido baixado duas vezes: estoque cai uma vez só.
6. Trigger cria o profile; número do pedido sai BA-000001, BA-000002.
7. `set_order_status` grava `order_events` e recusa transição inválida.

Depois: `supabase gen types typescript --local > lib/db/types.ts`, lint, typecheck, `npm test`, `npm run test:db`, build. Aplicar no projeto remoto (`supabase db push`) só com aprovação.
