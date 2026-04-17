-- ============================================================
-- Sprace — Fas 6b: Tvisthantering (Dispute Resolution)
-- ============================================================

-- ============================================================
-- 1. DISPUTE STATUS enum
-- ============================================================
create type public.dispute_status as enum (
  'open',
  'under_review',
  'resolved_refund',
  'resolved_release',
  'resolved_partial',
  'dismissed'
);

-- ============================================================
-- 2. DISPUTES table
-- ============================================================
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  opened_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) <= 2000),
  status public.dispute_status not null default 'open',
  admin_note text check (char_length(admin_note) <= 2000),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.disputes enable row level security;

create index idx_disputes_booking on public.disputes(booking_id);
create index idx_disputes_status on public.disputes(status);
create unique index idx_disputes_booking_active
  on public.disputes(booking_id)
  where status in ('open', 'under_review');

-- ============================================================
-- 3. Add 'disputed' to booking_status enum
-- ============================================================
alter type public.booking_status add value 'disputed';

-- ============================================================
-- 4. Add new notification types
-- ============================================================
alter type public.notification_type add value 'dispute_opened';
alter type public.notification_type add value 'dispute_resolved';

-- ============================================================
-- 5. Seed dispute settings in platform_settings
-- ============================================================
insert into public.platform_settings (key, value)
  values ('dispute_auto_escalate_days', '7')
  on conflict (key) do nothing;

-- ============================================================
-- 6. RLS POLICIES — disputes
-- ============================================================

create policy "Booking participants can view their disputes"
  on public.disputes for select
  using (
    opened_by = auth.uid()
    or exists (
      select 1 from public.bookings b
      where b.id = disputes.booking_id
        and (
          exists (select 1 from public.businesses biz where biz.id = b.business_id and biz.profile_id = auth.uid())
          or exists (select 1 from public.creators c where c.id = b.creator_id and c.profile_id = auth.uid())
        )
    )
  );

create policy "Booking participants can open disputes"
  on public.disputes for insert
  with check (
    opened_by = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = disputes.booking_id
        and b.status in ('in_progress', 'delivered')
        and (
          exists (select 1 from public.businesses biz where biz.id = b.business_id and biz.profile_id = auth.uid())
          or exists (select 1 from public.creators c where c.id = b.creator_id and c.profile_id = auth.uid())
        )
    )
  );

create policy "Admins have full access to disputes"
  on public.disputes for all
  using (public.is_admin());

-- ============================================================
-- 7. Updated_at trigger
-- ============================================================
create trigger set_disputes_updated_at
  before update on public.disputes
  for each row
  execute function public.update_updated_at();
