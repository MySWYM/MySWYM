alter table public.user_access_state
  add column if not exists billing_provider text
    check (billing_provider is null or billing_provider in ('stripe', 'apple')),
  add column if not exists apple_original_transaction_id text,
  add column if not exists apple_product_id text,
  add column if not exists apple_environment text;

create unique index if not exists user_access_state_apple_original_tx_idx
  on public.user_access_state (apple_original_transaction_id)
  where apple_original_transaction_id is not null;

notify pgrst, 'reload schema';
