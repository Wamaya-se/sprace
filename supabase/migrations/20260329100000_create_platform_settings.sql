-- ============================================================
-- Sprace — Platform settings (key-value store)
-- Admins can configure platform-wide settings from the UI.
-- ============================================================

create table public.platform_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

-- Anyone can read settings (needed for footer, SEO, etc.)
create policy "Anyone can read platform settings"
  on public.platform_settings for select
  using (true);

-- Only admins can modify settings
create policy "Admins can manage platform settings"
  on public.platform_settings for all
  using (public.is_admin());

-- Auto-update updated_at
create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.update_updated_at();

-- Seed default settings
insert into public.platform_settings (key, value) values
  ('platform_name', 'Sprace'),
  ('contact_email', ''),
  ('active_locales', 'en'),
  ('support_url', ''),
  ('terms_url', ''),
  ('privacy_url', '');
