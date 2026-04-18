-- ============================================================
-- Sprace — Fas 9: Campaign Management
-- ============================================================
-- Business can publish open campaigns on the public /campaigns page.
-- Creators apply with a pitch + proposed price (plus optional
-- pre-booking chat). Business accepts an application, which creates
-- an individual booking (awaiting_payment) that follows the existing
-- escrow lifecycle per booking.
-- ============================================================

-- ============================================================
-- 1. Enums
-- ============================================================
create type public.campaign_status as enum (
  'draft',
  'open',
  'closed',
  'completed',
  'cancelled'
);

create type public.application_status as enum (
  'pending',
  'shortlisted',
  'accepted',
  'declined',
  'withdrawn'
);

-- ============================================================
-- 2. CAMPAIGNS table
-- ============================================================
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 200),
  description text not null check (char_length(description) between 20 and 10000),
  budget_per_creator numeric(10,2) check (budget_per_creator is null or budget_per_creator > 0),
  total_budget numeric(10,2) check (total_budget is null or total_budget > 0),
  deadline date,
  status public.campaign_status not null default 'draft',
  slug text not null unique,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_published_when_open check (
    (status = 'draft' and published_at is null)
    or (status <> 'draft' and published_at is not null)
  ),
  constraint campaigns_closed_when_terminal check (
    (status in ('closed', 'completed', 'cancelled') and closed_at is not null)
    or (status in ('draft', 'open') and closed_at is null)
  )
);

alter table public.campaigns enable row level security;

create index idx_campaigns_business on public.campaigns(business_id);
create index idx_campaigns_status on public.campaigns(status);
create index idx_campaigns_published_at on public.campaigns(published_at desc nulls last);
create index idx_campaigns_slug on public.campaigns(slug);

create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.update_updated_at();

-- ============================================================
-- 3. Junction tables for targeting filters
-- ============================================================
create table public.campaign_specialties (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  specialty_id uuid not null references public.specialties(id) on delete cascade,
  primary key (campaign_id, specialty_id)
);

alter table public.campaign_specialties enable row level security;

create index idx_campaign_specialties_specialty
  on public.campaign_specialties(specialty_id);

create table public.campaign_markets (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  primary key (campaign_id, market_id)
);

alter table public.campaign_markets enable row level security;

create index idx_campaign_markets_market
  on public.campaign_markets(market_id);

-- ============================================================
-- 4. CAMPAIGN_APPLICATIONS table
-- ============================================================
create table public.campaign_applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  pitch text not null check (char_length(pitch) between 20 and 2000),
  proposed_price numeric(10,2) check (proposed_price is null or proposed_price > 0),
  status public.application_status not null default 'pending',
  booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_applications_unique_per_creator
    unique (campaign_id, creator_id),
  constraint campaign_applications_booking_only_when_accepted check (
    (status = 'accepted' and booking_id is not null)
    or (status <> 'accepted')
  )
);

alter table public.campaign_applications enable row level security;

create index idx_campaign_applications_campaign
  on public.campaign_applications(campaign_id);
create index idx_campaign_applications_creator
  on public.campaign_applications(creator_id);
create index idx_campaign_applications_status
  on public.campaign_applications(status);

create trigger set_campaign_applications_updated_at
  before update on public.campaign_applications
  for each row execute function public.update_updated_at();

-- ============================================================
-- 5. Additive columns on existing tables
-- ============================================================
alter table public.bookings
  add column campaign_id uuid references public.campaigns(id) on delete set null;

create index idx_bookings_campaign on public.bookings(campaign_id)
  where campaign_id is not null;

alter table public.conversations
  add column application_id uuid references public.campaign_applications(id)
    on delete cascade;

-- One conversation per application (pre-booking chat)
create unique index idx_conversations_application
  on public.conversations(application_id)
  where application_id is not null;

-- ============================================================
-- 6. Notification type enum additions
-- ============================================================
alter type public.notification_type add value 'campaign_new_application';
alter type public.notification_type add value 'campaign_application_shortlisted';
alter type public.notification_type add value 'campaign_application_accepted';
alter type public.notification_type add value 'campaign_application_declined';
alter type public.notification_type add value 'campaign_closed';

-- ============================================================
-- 7. RLS — campaigns
-- ============================================================

-- Publicly visible when published (open/closed/completed); draft and
-- cancelled are only visible to the owner/admin.
create policy "Public can view published campaigns"
  on public.campaigns for select
  using (status in ('open', 'closed', 'completed'));

create policy "Business can view own campaigns"
  on public.campaigns for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = campaigns.business_id
        and b.profile_id = auth.uid()
    )
  );

create policy "Business can create own campaigns"
  on public.campaigns for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = campaigns.business_id
        and b.profile_id = auth.uid()
    )
  );

create policy "Business can update own campaigns"
  on public.campaigns for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = campaigns.business_id
        and b.profile_id = auth.uid()
    )
  );

create policy "Business can delete own draft campaigns"
  on public.campaigns for delete
  using (
    status = 'draft'
    and exists (
      select 1 from public.businesses b
      where b.id = campaigns.business_id
        and b.profile_id = auth.uid()
    )
  );

create policy "Admins have full access to campaigns"
  on public.campaigns for all
  using (public.is_admin());

-- ============================================================
-- 8. RLS — campaign_specialties / campaign_markets
-- ============================================================

create policy "Public can view campaign specialties"
  on public.campaign_specialties for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_specialties.campaign_id
        and (
          c.status in ('open', 'closed', 'completed')
          or exists (
            select 1 from public.businesses b
            where b.id = c.business_id
              and b.profile_id = auth.uid()
          )
        )
    )
  );

create policy "Business can manage own campaign specialties"
  on public.campaign_specialties for all
  using (
    exists (
      select 1 from public.campaigns c
      join public.businesses b on b.id = c.business_id
      where c.id = campaign_specialties.campaign_id
        and b.profile_id = auth.uid()
    )
  );

create policy "Admins have full access to campaign specialties"
  on public.campaign_specialties for all
  using (public.is_admin());

create policy "Public can view campaign markets"
  on public.campaign_markets for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_markets.campaign_id
        and (
          c.status in ('open', 'closed', 'completed')
          or exists (
            select 1 from public.businesses b
            where b.id = c.business_id
              and b.profile_id = auth.uid()
          )
        )
    )
  );

create policy "Business can manage own campaign markets"
  on public.campaign_markets for all
  using (
    exists (
      select 1 from public.campaigns c
      join public.businesses b on b.id = c.business_id
      where c.id = campaign_markets.campaign_id
        and b.profile_id = auth.uid()
    )
  );

create policy "Admins have full access to campaign markets"
  on public.campaign_markets for all
  using (public.is_admin());

-- ============================================================
-- 9. RLS — campaign_applications
-- ============================================================

-- Creator can view own applications (any status)
create policy "Creator can view own applications"
  on public.campaign_applications for select
  using (
    exists (
      select 1 from public.creators c
      where c.id = campaign_applications.creator_id
        and c.profile_id = auth.uid()
    )
  );

-- Business owner of the campaign can view applications
create policy "Business can view applications on own campaigns"
  on public.campaign_applications for select
  using (
    exists (
      select 1 from public.campaigns c
      join public.businesses b on b.id = c.business_id
      where c.id = campaign_applications.campaign_id
        and b.profile_id = auth.uid()
    )
  );

-- Creator can apply (insert)
create policy "Creator can create own applications"
  on public.campaign_applications for insert
  with check (
    exists (
      select 1 from public.creators c
      where c.id = campaign_applications.creator_id
        and c.profile_id = auth.uid()
    )
  );

-- Creator can update own applications (withdraw)
create policy "Creator can update own applications"
  on public.campaign_applications for update
  using (
    exists (
      select 1 from public.creators c
      where c.id = campaign_applications.creator_id
        and c.profile_id = auth.uid()
    )
  );

-- Business can update applications on own campaigns (shortlist/accept/decline)
create policy "Business can update applications on own campaigns"
  on public.campaign_applications for update
  using (
    exists (
      select 1 from public.campaigns c
      join public.businesses b on b.id = c.business_id
      where c.id = campaign_applications.campaign_id
        and b.profile_id = auth.uid()
    )
  );

create policy "Admins have full access to campaign applications"
  on public.campaign_applications for all
  using (public.is_admin());
