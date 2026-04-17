-- ============================================================
-- Sprace — Fas 6d: Rapportering & Blockering
-- ============================================================
-- Kompletterar Fas 6d (Auth & GDPR) med moderationsfunktioner:
--  1. `reports` — flagging av profiler och bokningar till admin
--  2. `user_blocks` — user-level block (döljer blockerade kreatörer
--     från discover/kategori/direkt profil)
--  3. `profiles.is_suspended` — admin-styrd avstängning av konto
--  4. Nya `notification_type` för `report_resolved` + `account_suspended`
--  5. Uppdaterad `search_creators` RPC som exkluderar blockerade
--     profiler och avstängda konton
-- ============================================================

-- ============================================================
-- 1. Enums — reports
-- ============================================================
create type public.report_target_type as enum ('profile', 'booking');

create type public.report_category as enum (
  'spam',
  'fraud',
  'harassment',
  'inappropriate',
  'other'
);

create type public.report_status as enum (
  'pending',
  'reviewing',
  'resolved',
  'dismissed'
);

-- ============================================================
-- 2. Reports table
-- ============================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.report_target_type not null,
  target_id uuid not null,
  category public.report_category not null,
  reason text not null check (char_length(reason) between 10 and 2000),
  status public.report_status not null default 'pending',
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_resolved_fields_consistent check (
    (status in ('resolved', 'dismissed')
      and resolved_at is not null and resolved_by is not null)
    or (status in ('pending', 'reviewing')
      and resolved_at is null and resolved_by is null)
  )
);

alter table public.reports enable row level security;

create index idx_reports_status on public.reports(status);
create index idx_reports_target on public.reports(target_type, target_id);
create index idx_reports_reporter on public.reports(reporter_id);
create index idx_reports_created_at on public.reports(created_at desc);

-- En reporter kan bara ha en aktiv (pending/reviewing) rapport per target
create unique index idx_reports_active_per_reporter_target
  on public.reports(reporter_id, target_type, target_id)
  where status in ('pending', 'reviewing');

create trigger set_reports_updated_at
  before update on public.reports
  for each row
  execute function public.update_updated_at();

-- ============================================================
-- 3. User blocks table
-- ============================================================
create table public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_blocks_not_self check (blocker_id <> blocked_id),
  constraint user_blocks_unique_pair unique (blocker_id, blocked_id)
);

alter table public.user_blocks enable row level security;

create index idx_user_blocks_blocker on public.user_blocks(blocker_id);
create index idx_user_blocks_blocked on public.user_blocks(blocked_id);

-- ============================================================
-- 4. Profile suspension fields
-- ============================================================
alter table public.profiles
  add column is_suspended boolean not null default false,
  add column suspended_at timestamptz,
  add column suspended_by uuid references public.profiles(id) on delete set null,
  add column suspension_reason text check (
    suspension_reason is null or char_length(suspension_reason) <= 2000
  );

create index idx_profiles_is_suspended on public.profiles(is_suspended)
  where is_suspended = true;

-- ============================================================
-- 5. Notification type enum additions
-- ============================================================
alter type public.notification_type add value 'report_resolved';
alter type public.notification_type add value 'account_suspended';

-- ============================================================
-- 6. RLS — reports
-- ============================================================

-- Reporter ser sina egna rapporter (för framtida "Mina rapporter"-sida)
create policy "Reporters can view their own reports"
  on public.reports for select
  using (reporter_id = auth.uid());

-- Autentiserade användare kan skapa rapporter (men Server Action gör
-- ytterligare valideringar: target finns, inte dubblettrapport, etc.)
create policy "Authenticated users can create reports"
  on public.reports for insert
  with check (
    reporter_id = auth.uid()
    and auth.uid() is not null
  );

-- Admin har full åtkomst
create policy "Admins have full access to reports"
  on public.reports for all
  using (public.is_admin());

-- ============================================================
-- 7. RLS — user_blocks
-- ============================================================

create policy "Users view their own blocks"
  on public.user_blocks for select
  using (blocker_id = auth.uid());

create policy "Users create their own blocks"
  on public.user_blocks for insert
  with check (
    blocker_id = auth.uid()
    and blocker_id <> blocked_id
  );

create policy "Users delete their own blocks"
  on public.user_blocks for delete
  using (blocker_id = auth.uid());

create policy "Admins have full access to user_blocks"
  on public.user_blocks for all
  using (public.is_admin());

-- ============================================================
-- 8. Uppdaterad search_creators RPC
--    Extra argument: p_blocked_profile_ids (exkluderas)
--    Utökat filter: profiles.is_suspended = false
-- ============================================================
drop function if exists public.search_creators(
  text, text[], text[], numeric, numeric, int, int
);

create or replace function public.search_creators(
  p_q text default null,
  p_specialty_slugs text[] default null,
  p_market_slugs text[] default null,
  p_min_rate numeric default null,
  p_max_rate numeric default null,
  p_limit int default 48,
  p_offset int default 0,
  p_blocked_profile_ids uuid[] default null
)
returns table (
  id uuid,
  profile_id uuid,
  display_name text,
  bio text,
  hourly_rate numeric,
  followers_count int,
  slug text,
  avatar_url text,
  specialties jsonb,
  markets jsonb,
  average_rating numeric,
  total_reviews bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with base as (
    select c.*
      from public.creators c
      join public.profiles p on p.id = c.profile_id
     where c.status = 'active'
       and c.slug is not null
       and p.is_suspended = false
       and (
         p_blocked_profile_ids is null
         or not (c.profile_id = any(p_blocked_profile_ids))
       )
       and (
         p_q is null
         or c.display_name ilike '%' || p_q || '%'
         or c.bio ilike '%' || p_q || '%'
       )
       and (p_min_rate is null or c.hourly_rate >= p_min_rate)
       and (p_max_rate is null or c.hourly_rate <= p_max_rate)
       and (
         p_specialty_slugs is null
         or exists (
           select 1
             from public.creator_specialties cs
             join public.specialties s on s.id = cs.specialty_id
            where cs.creator_id = c.id
              and s.slug = any(p_specialty_slugs)
         )
       )
       and (
         p_market_slugs is null
         or exists (
           select 1
             from public.creator_markets cm
             join public.markets m on m.id = cm.market_id
            where cm.creator_id = c.id
              and m.slug = any(p_market_slugs)
         )
       )
  )
  select
    b.id,
    b.profile_id,
    b.display_name,
    b.bio,
    b.hourly_rate,
    b.followers_count,
    b.slug,
    p.avatar_url,
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'slug', s.slug) order by s.name)
         from public.creator_specialties cs
         join public.specialties s on s.id = cs.specialty_id
        where cs.creator_id = b.id),
      '[]'::jsonb
    ) as specialties,
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'slug', m.slug, 'flag_emoji', m.flag_emoji) order by m.name)
         from public.creator_markets cm
         join public.markets m on m.id = cm.market_id
        where cm.creator_id = b.id),
      '[]'::jsonb
    ) as markets,
    (select avg(r.rating)::numeric(10,2)
       from public.reviews r
      where r.reviewee_id = b.profile_id) as average_rating,
    (select count(*)::bigint
       from public.reviews r
      where r.reviewee_id = b.profile_id) as total_reviews
    from base b
    left join public.profiles p on p.id = b.profile_id
   order by b.created_at desc
   limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.search_creators(
  text, text[], text[], numeric, numeric, int, int, uuid[]
) from public;
grant execute on function public.search_creators(
  text, text[], text[], numeric, numeric, int, int, uuid[]
) to anon, authenticated;
