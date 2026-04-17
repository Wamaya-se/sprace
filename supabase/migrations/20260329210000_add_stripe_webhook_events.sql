-- ============================================================
-- Stripe webhook idempotency table
-- Prevents duplicate processing of webhook events
-- ============================================================

create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

create policy "Admins have full access to webhook events"
  on public.stripe_webhook_events for all
  using (public.is_admin());

create index idx_stripe_webhook_events_processed
  on public.stripe_webhook_events(processed_at);
