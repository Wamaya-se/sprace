-- ============================================================
-- Sprace — Markets + Creator enhancements
-- ============================================================

-- New enum: creator_status (replaces is_published boolean)
create type public.creator_status as enum ('draft', 'pending_review', 'active', 'suspended');

-- ============================================================
-- MARKETS — countries/regions a creator operates in
-- ============================================================
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  code text not null unique,
  flag_emoji text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.markets enable row level security;

-- ============================================================
-- CREATOR_MARKETS — many-to-many
-- ============================================================
create table public.creator_markets (
  creator_id uuid not null references public.creators(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  primary key (creator_id, market_id)
);

alter table public.creator_markets enable row level security;

-- ============================================================
-- CREATORS — add slug + status, migrate is_published
-- ============================================================

-- Drop policies that reference is_published BEFORE dropping the column
drop policy if exists "Anyone can view published creators" on public.creators;
drop policy if exists "Anyone can view active services" on public.services;

alter table public.creators add column slug text unique;
alter table public.creators add column status public.creator_status not null default 'draft';

-- Migrate existing data: published → active, unpublished → draft
update public.creators set status = case
  when is_published = true then 'active'::public.creator_status
  else 'draft'::public.creator_status
end;

-- Drop old index before dropping column
drop index if exists idx_creators_is_published;

alter table public.creators drop column is_published;

-- ============================================================
-- PROFILES — add preferred_locale
-- ============================================================
alter table public.profiles add column preferred_locale text not null default 'en';

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_markets_slug on public.markets(slug);
create index idx_markets_sort on public.markets(sort_order);
create index idx_creator_markets_creator on public.creator_markets(creator_id);
create index idx_creator_markets_market on public.creator_markets(market_id);
create index idx_creators_slug on public.creators(slug) where slug is not null;
create index idx_creators_status on public.creators(status) where status = 'active';

-- ============================================================
-- RLS POLICIES — markets
-- ============================================================
create policy "Anyone can view markets"
  on public.markets for select
  using (true);

create policy "Admins can manage markets"
  on public.markets for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- RLS POLICIES — creator_markets
-- ============================================================
create policy "Anyone can view creator markets"
  on public.creator_markets for select
  using (true);

create policy "Creators can manage own markets"
  on public.creator_markets for all
  using (
    exists (
      select 1 from public.creators
      where id = creator_id and profile_id = auth.uid()
    )
  );

create policy "Admins can manage all creator markets"
  on public.creator_markets for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- UPDATE RLS — creators (new status-based policies)
-- ============================================================
create policy "Anyone can view active creators"
  on public.creators for select
  using (status = 'active');

create policy "Anyone can view services of active creators"
  on public.services for select
  using (
    is_active = true
    and exists (
      select 1 from public.creators
      where id = creator_id and status = 'active'
    )
  );

-- ============================================================
-- TRIGGER — updated_at for markets (not needed, no updated_at)
-- ============================================================

-- ============================================================
-- SEED: Markets
-- ============================================================
insert into public.markets (name, slug, code, flag_emoji, sort_order) values
  ('Sweden',      'sweden',      'SE', '🇸🇪', 1),
  ('Norway',      'norway',      'NO', '🇳🇴', 2),
  ('Denmark',     'denmark',     'DK', '🇩🇰', 3),
  ('Finland',     'finland',     'FI', '🇫🇮', 4),
  ('Iceland',     'iceland',     'IS', '🇮🇸', 5),
  ('United Kingdom', 'united-kingdom', 'GB', '🇬🇧', 10),
  ('Germany',     'germany',     'DE', '🇩🇪', 11),
  ('France',      'france',      'FR', '🇫🇷', 12),
  ('Netherlands', 'netherlands', 'NL', '🇳🇱', 13),
  ('Spain',       'spain',       'ES', '🇪🇸', 14),
  ('Italy',       'italy',       'IT', '🇮🇹', 15),
  ('United States', 'united-states', 'US', '🇺🇸', 20),
  ('Canada',      'canada',      'CA', '🇨🇦', 21),
  ('Australia',   'australia',   'AU', '🇦🇺', 22),
  ('Global',      'global',      '--', '🌍', 99);
