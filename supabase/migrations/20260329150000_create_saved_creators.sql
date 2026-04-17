-- ============================================================
-- Sprace — Saved/Favorite creators for businesses
-- ============================================================

create table public.saved_creators (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (business_profile_id, creator_id)
);

alter table public.saved_creators enable row level security;

create index idx_saved_creators_business on public.saved_creators(business_profile_id);
create index idx_saved_creators_creator on public.saved_creators(creator_id);

-- RLS: businesses can manage their own saved creators
create policy "Businesses can view own saved creators"
  on public.saved_creators for select
  using (business_profile_id = auth.uid());

create policy "Businesses can save creators"
  on public.saved_creators for insert
  with check (business_profile_id = auth.uid());

create policy "Businesses can unsave creators"
  on public.saved_creators for delete
  using (business_profile_id = auth.uid());

-- Admins can view all saved creators (analytics)
create policy "Admins have full access to saved creators"
  on public.saved_creators for all
  using (public.is_admin());
