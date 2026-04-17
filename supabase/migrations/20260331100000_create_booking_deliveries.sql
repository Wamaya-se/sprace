-- ============================================================
-- Sprace — Fas 6a: Content Delivery (leveransflöde)
-- ============================================================

-- ============================================================
-- 1. DELIVERY STATUS enum
-- ============================================================
create type public.delivery_status as enum (
  'submitted',
  'approved',
  'revision_requested'
);

-- ============================================================
-- 2. BOOKING DELIVERIES table
-- ============================================================
create table public.booking_deliveries (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  version integer not null default 1,
  comment text check (char_length(comment) <= 2000),
  revision_comment text check (char_length(revision_comment) <= 2000),
  status public.delivery_status not null default 'submitted',
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.booking_deliveries enable row level security;

create index idx_deliveries_booking on public.booking_deliveries(booking_id, version desc);
create index idx_deliveries_status on public.booking_deliveries(status);

-- ============================================================
-- 3. DELIVERY FILES table
-- ============================================================
create table public.delivery_files (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.booking_deliveries(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.delivery_files enable row level security;

create index idx_delivery_files_delivery on public.delivery_files(delivery_id, sort_order);

-- ============================================================
-- 4. Add max_revisions + revision_count to bookings
-- ============================================================
alter table public.bookings
  add column revision_count integer not null default 0,
  add column max_revisions integer not null default 3;

-- ============================================================
-- 5. Add new notification types
-- ============================================================
alter type public.notification_type add value 'delivery_submitted';
alter type public.notification_type add value 'delivery_approved';

-- ============================================================
-- 6. Seed default max_revisions in platform_settings
-- ============================================================
insert into public.platform_settings (key, value)
  values ('default_max_revisions', '3')
  on conflict (key) do nothing;

-- ============================================================
-- 7. RLS POLICIES — booking_deliveries
-- ============================================================

create policy "Booking participants can view deliveries"
  on public.booking_deliveries for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_deliveries.booking_id
        and (
          exists (select 1 from public.businesses biz where biz.id = b.business_id and biz.profile_id = auth.uid())
          or exists (select 1 from public.creators c where c.id = b.creator_id and c.profile_id = auth.uid())
        )
    )
  );

create policy "Creator can submit deliveries"
  on public.booking_deliveries for insert
  with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from public.bookings b
      join public.creators c on c.id = b.creator_id
      where b.id = booking_deliveries.booking_id
        and c.profile_id = auth.uid()
        and b.status = 'in_progress'
    )
  );

create policy "Business can review deliveries"
  on public.booking_deliveries for update
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_deliveries.booking_id
        and exists (select 1 from public.businesses biz where biz.id = b.business_id and biz.profile_id = auth.uid())
    )
  );

create policy "Creator can delete own unreviewed deliveries"
  on public.booking_deliveries for delete
  using (
    submitted_by = auth.uid()
    and status = 'submitted'
    and reviewed_by is null
  );

create policy "Admins have full access to deliveries"
  on public.booking_deliveries for all
  using (public.is_admin());

-- ============================================================
-- 8. RLS POLICIES — delivery_files
-- ============================================================

create policy "Booking participants can view delivery files"
  on public.delivery_files for select
  using (
    exists (
      select 1 from public.booking_deliveries d
      join public.bookings b on b.id = d.booking_id
      where d.id = delivery_files.delivery_id
        and (
          exists (select 1 from public.businesses biz where biz.id = b.business_id and biz.profile_id = auth.uid())
          or exists (select 1 from public.creators c where c.id = b.creator_id and c.profile_id = auth.uid())
        )
    )
  );

create policy "Creator can add delivery files"
  on public.delivery_files for insert
  with check (
    exists (
      select 1 from public.booking_deliveries d
      join public.bookings b on b.id = d.booking_id
      join public.creators c on c.id = b.creator_id
      where d.id = delivery_files.delivery_id
        and c.profile_id = auth.uid()
    )
  );

create policy "Admins have full access to delivery files"
  on public.delivery_files for all
  using (public.is_admin());
