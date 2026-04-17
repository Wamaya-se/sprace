-- ============================================================
-- Sprace — Initial database schema
-- ============================================================

-- Custom types
create type public.user_role as enum ('creator', 'business', 'admin');
create type public.media_type as enum ('image', 'video');

-- ============================================================
-- PROFILES — extends auth.users, created via trigger
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'creator',
  full_name text,
  avatar_url text,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ============================================================
-- CREATORS — one-to-one with profiles where role = 'creator'
-- ============================================================
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null,
  bio text,
  portfolio_url text,
  instagram_handle text,
  tiktok_handle text,
  youtube_handle text,
  followers_count integer default 0,
  hourly_rate numeric(10,2),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creators enable row level security;

-- ============================================================
-- CREATOR_SPECIALTIES — many-to-many via junction table
-- ============================================================
create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.specialties enable row level security;

create table public.creator_specialties (
  creator_id uuid not null references public.creators(id) on delete cascade,
  specialty_id uuid not null references public.specialties(id) on delete cascade,
  primary key (creator_id, specialty_id)
);

alter table public.creator_specialties enable row level security;

-- ============================================================
-- SERVICES — offerings by a creator
-- ============================================================
create table public.services (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  delivery_days integer not null default 7,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services enable row level security;

-- ============================================================
-- SERVICE_MEDIA — images/videos attached to services
-- ============================================================
create table public.service_media (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  media_url text not null,
  media_type public.media_type not null default 'image',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.service_media enable row level security;

-- ============================================================
-- BUSINESSES — one-to-one with profiles where role = 'business'
-- ============================================================
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  company_name text not null,
  org_number text,
  website text,
  industry text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_creators_profile_id on public.creators(profile_id);
create index idx_creators_is_published on public.creators(is_published) where is_published = true;
create index idx_services_creator_id on public.services(creator_id);
create index idx_service_media_service_id on public.service_media(service_id);
create index idx_businesses_profile_id on public.businesses(profile_id);
create index idx_creator_specialties_creator on public.creator_specialties(creator_id);
create index idx_creator_specialties_specialty on public.creator_specialties(specialty_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_creators_updated_at
  before update on public.creators
  for each row execute function public.update_updated_at();

create trigger set_services_updated_at
  before update on public.services
  for each row execute function public.update_updated_at();

create trigger set_businesses_updated_at
  before update on public.businesses
  for each row execute function public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- PROFILES
create policy "Users can view any profile"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins have full access to profiles"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- CREATORS
create policy "Anyone can view published creators"
  on public.creators for select
  using (is_published = true);

create policy "Creators can view own unpublished profile"
  on public.creators for select
  using (profile_id = auth.uid());

create policy "Creators can insert own creator profile"
  on public.creators for insert
  with check (profile_id = auth.uid());

create policy "Creators can update own creator profile"
  on public.creators for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Creators can delete own creator profile"
  on public.creators for delete
  using (profile_id = auth.uid());

create policy "Admins have full access to creators"
  on public.creators for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- SPECIALTIES (public read, admin write)
create policy "Anyone can view specialties"
  on public.specialties for select
  using (true);

create policy "Admins can manage specialties"
  on public.specialties for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- CREATOR_SPECIALTIES
create policy "Anyone can view creator specialties"
  on public.creator_specialties for select
  using (true);

create policy "Creators can manage own specialties"
  on public.creator_specialties for all
  using (
    exists (
      select 1 from public.creators
      where id = creator_id and profile_id = auth.uid()
    )
  );

create policy "Admins can manage all creator specialties"
  on public.creator_specialties for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- SERVICES
create policy "Anyone can view active services"
  on public.services for select
  using (is_active = true);

create policy "Creators can view own inactive services"
  on public.services for select
  using (
    exists (
      select 1 from public.creators
      where id = creator_id and profile_id = auth.uid()
    )
  );

create policy "Creators can manage own services"
  on public.services for insert
  with check (
    exists (
      select 1 from public.creators
      where id = creator_id and profile_id = auth.uid()
    )
  );

create policy "Creators can update own services"
  on public.services for update
  using (
    exists (
      select 1 from public.creators
      where id = creator_id and profile_id = auth.uid()
    )
  );

create policy "Creators can delete own services"
  on public.services for delete
  using (
    exists (
      select 1 from public.creators
      where id = creator_id and profile_id = auth.uid()
    )
  );

create policy "Admins have full access to services"
  on public.services for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- SERVICE_MEDIA
create policy "Anyone can view service media"
  on public.service_media for select
  using (true);

create policy "Creators can manage own service media"
  on public.service_media for all
  using (
    exists (
      select 1 from public.services s
      join public.creators c on c.id = s.creator_id
      where s.id = service_id and c.profile_id = auth.uid()
    )
  );

create policy "Admins have full access to service media"
  on public.service_media for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- BUSINESSES
create policy "Businesses can view own profile"
  on public.businesses for select
  using (profile_id = auth.uid());

create policy "Businesses can insert own profile"
  on public.businesses for insert
  with check (profile_id = auth.uid());

create policy "Businesses can update own profile"
  on public.businesses for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Admins have full access to businesses"
  on public.businesses for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800, -- 50MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
);

-- Storage policies
create policy "Anyone can view media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Authenticated users can upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
  );

create policy "Users can update own media"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own media"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- SEED: Default specialties
-- ============================================================
insert into public.specialties (name, slug) values
  ('Fashion & Lifestyle', 'fashion-lifestyle'),
  ('Beauty & Skincare', 'beauty-skincare'),
  ('Food & Health', 'food-health'),
  ('Tech & Gaming', 'tech-gaming'),
  ('Travel & Adventure', 'travel-adventure'),
  ('Fitness & Sports', 'fitness-sports'),
  ('Home & Interior', 'home-interior'),
  ('Finance & Business', 'finance-business'),
  ('Music & Entertainment', 'music-entertainment'),
  ('Parenting & Family', 'parenting-family');
