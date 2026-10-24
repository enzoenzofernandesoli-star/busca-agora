-- Security/performance audit of 24/10: foreign keys of the metrics tables
-- without a covering index (Supabase performance advisor). Deleting a
-- customer or a variant sets these to null and would scan the whole table.

create index product_events_user_idx on public.product_events (user_id) where user_id is not null;
create index product_events_variant_idx on public.product_events (variant_id) where variant_id is not null;
create index product_metrics_product_daily_product_idx on public.product_metrics_product_daily (product_id, dia);
