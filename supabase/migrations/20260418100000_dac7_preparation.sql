-- ============================================================
-- Sprace — DAC7 preparation (Fas 7e.2)
-- ============================================================
-- EU Council Directive 2021/514 (DAC7) obliges digital platform
-- operators to collect, verify and report seller information to
-- the tax authority. This migration extends our data model so we
-- can collect the minimum data set, record verification state,
-- and give the platform-entity ("Sprace AB") its own settings row
-- instead of compile-time constants in src/components/pdf/styles.
--
-- Design decisions:
--
-- * Sensitive creator PII (personnummer, birth_date, address) lives
--   in a SEPARATE table `creator_dac7` with strict RLS (owner +
--   admin only). Keeping it on `public.profiles` is unsafe because
--   the existing "Users can view any profile" policy would expose
--   home addresses and SSNs to the whole authenticated userbase.
--
-- * `personal_number` is encrypted at the application layer
--   (AES-256-GCM) before insert and only decrypted in Server Actions
--   that explicitly need the clear value. The DB column stores
--   opaque base64 ciphertext; RLS is defence-in-depth, not the
--   primary safeguard.
--
-- * Business DAC7 fields (VAT number, address, verification state)
--   live directly on `businesses` because that table already has
--   owner-+-admin-only read policies.
--
-- * Admin reads of a subject's clear personnummer are recorded in
--   a separate `pii_access_log` audit table for accountability.
-- ============================================================

-- ---------- Enums ----------

create type public.org_number_verification_status as enum (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

-- ---------- Extend BUSINESSES with DAC7 / verification fields ----------

alter table public.businesses
  add column if not exists vat_number text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists country_code text default 'SE',
  add column if not exists org_number_verification public.org_number_verification_status
    not null default 'unverified',
  add column if not exists org_number_verified_at timestamptz,
  add column if not exists org_number_verified_by uuid references auth.users(id)
    on delete set null,
  add column if not exists org_number_verification_note text;

alter table public.businesses
  add constraint businesses_country_code_iso2_check
  check (country_code is null or country_code ~ '^[A-Z]{2}$');

-- ---------- CREATOR_DAC7 (sensitive PII, strict RLS) ----------

create table public.creator_dac7 (
  creator_id uuid primary key
    references public.creators(id) on delete cascade,
  -- AES-256-GCM ciphertext (base64). Never stored in the clear.
  personal_number_encrypted text,
  -- Last 4 digits of personnummer, stored in the clear for UI masking.
  -- Safe because four digits alone are not identifying under GDPR
  -- and they let the owner confirm "this is my number" without
  -- needing to round-trip through decryption for every page render.
  personal_number_last4 text,
  birth_date date,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country_code text default 'SE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_dac7_country_code_iso2_check
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint creator_dac7_last4_format_check
    check (personal_number_last4 is null or personal_number_last4 ~ '^\d{4}$')
);

alter table public.creator_dac7 enable row level security;

create trigger set_creator_dac7_updated_at
  before update on public.creator_dac7
  for each row execute function public.update_updated_at();

-- Owner of the linked creator can read/write their own DAC7 row.
-- Admins have full access. Nothing else can see this table.
create policy "Creator owner can view own dac7"
  on public.creator_dac7 for select
  using (
    exists (
      select 1 from public.creators
      where id = creator_id and profile_id = auth.uid()
    )
  );

create policy "Creator owner can insert own dac7"
  on public.creator_dac7 for insert
  with check (
    exists (
      select 1 from public.creators
      where id = creator_id and profile_id = auth.uid()
    )
  );

create policy "Creator owner can update own dac7"
  on public.creator_dac7 for update
  using (
    exists (
      select 1 from public.creators
      where id = creator_id and profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.creators
      where id = creator_id and profile_id = auth.uid()
    )
  );

create policy "Admins have full access to creator_dac7"
  on public.creator_dac7 for all
  using (public.is_admin());

-- ---------- PII access audit log ----------

create table public.pii_access_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  field text not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.pii_access_log enable row level security;

-- Writes go through the service-role client in Server Actions only.
-- Reads are admin-only.
create policy "Admins can view pii access log"
  on public.pii_access_log for select
  using (public.is_admin());

create index idx_pii_access_log_subject
  on public.pii_access_log (subject_id, created_at desc);
create index idx_pii_access_log_actor
  on public.pii_access_log (actor_id, created_at desc);

-- ---------- Seed platform-entity settings ----------

insert into public.platform_settings (key, value) values
  ('platform_legal_name', 'Sprace AB'),
  ('platform_org_number', ''),
  ('platform_vat_number', ''),
  ('platform_address_line1', ''),
  ('platform_address_line2', ''),
  ('platform_postal_code', ''),
  ('platform_city', 'Stockholm'),
  ('platform_country_code', 'SE'),
  ('platform_billing_email', 'billing@sprace.com'),
  ('platform_website', 'sprace.com')
on conflict (key) do nothing;
