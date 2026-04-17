-- ============================================================
-- Sprace — Fas 4: Payments, Notifications & Reviews
-- ============================================================

-- ============================================================
-- 1. Extend booking_status enum with 'awaiting_payment'
-- ============================================================
alter type public.booking_status add value 'awaiting_payment' before 'accepted';

-- ============================================================
-- 2. Add Stripe fields to creators
-- ============================================================
alter table public.creators
  add column stripe_account_id text,
  add column stripe_onboarding_complete boolean not null default false;

-- ============================================================
-- 3. Add email notification opt-out to profiles
-- ============================================================
alter table public.profiles
  add column email_notifications boolean not null default true;

-- ============================================================
-- 4. PAYMENT STATUS enum
-- ============================================================
create type public.payment_status as enum (
  'pending',
  'captured',
  'transferred',
  'refunded',
  'failed'
);

-- ============================================================
-- 5. PAYMENTS table
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  amount_total integer not null,
  platform_fee integer not null,
  creator_payout integer not null,
  currency text not null default 'sek',
  status public.payment_status not null default 'pending',
  stripe_transfer_id text,
  captured_at timestamptz,
  transferred_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create unique index idx_payments_booking on public.payments(booking_id);
create index idx_payments_status on public.payments(status);

create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.update_updated_at();

-- ============================================================
-- 6. NOTIFICATION TYPE enum
-- ============================================================
create type public.notification_type as enum (
  'booking_created',
  'booking_accepted',
  'booking_declined',
  'awaiting_payment',
  'payment_received',
  'work_started',
  'deliverables_submitted',
  'revision_requested',
  'booking_completed',
  'booking_cancelled',
  'review_received',
  'new_message',
  'payout_sent',
  'stripe_onboarding_required'
);

-- ============================================================
-- 7. NOTIFICATIONS table
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_notifications_unread on public.notifications(user_id) where read_at is null;

-- ============================================================
-- 8. REVIEWS table
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create unique index idx_reviews_booking_reviewer on public.reviews(booking_id, reviewer_id);
create index idx_reviews_reviewee on public.reviews(reviewee_id, created_at desc);

-- ============================================================
-- 9. RLS POLICIES — Payments
-- ============================================================

create policy "Business can view own payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.bookings b
      join public.businesses biz on biz.id = b.business_id
      where b.id = payments.booking_id and biz.profile_id = auth.uid()
    )
  );

create policy "Creator can view own payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.bookings b
      join public.creators c on c.id = b.creator_id
      where b.id = payments.booking_id and c.profile_id = auth.uid()
    )
  );

create policy "Admins have full access to payments"
  on public.payments for all
  using (public.is_admin());

-- ============================================================
-- 10. RLS POLICIES — Notifications
-- ============================================================

create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "Admins have full access to notifications"
  on public.notifications for all
  using (public.is_admin());

-- ============================================================
-- 11. RLS POLICIES — Reviews
-- ============================================================

create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Participants can create reviews"
  on public.reviews for insert
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.status = 'completed'
        and (
          exists (select 1 from public.businesses biz where biz.id = b.business_id and biz.profile_id = auth.uid())
          or exists (select 1 from public.creators c where c.id = b.creator_id and c.profile_id = auth.uid())
        )
    )
  );

create policy "Reviewers can update own reviews"
  on public.reviews for update
  using (reviewer_id = auth.uid());

create policy "Admins have full access to reviews"
  on public.reviews for all
  using (public.is_admin());

-- ============================================================
-- 12. Seed default platform fee
-- ============================================================
insert into public.platform_settings (key, value)
  values ('platform_fee_percent', '15')
  on conflict (key) do nothing;
