-- ============================================================
-- Sprace — Fas 10a: Audit log + admin broadcasts
-- ============================================================
-- 1. `admin_audit_log` — immutable trail of admin actions
--    (role changes, suspensions, deletions, verifications,
--    dispute resolutions, broadcasts). Append-only by design.
-- 2. `admin_broadcasts` — platform-wide announcements composed
--    by admins and fanned out to notifications per audience.
-- 3. New `notification_type = 'admin_broadcast'`.
-- ============================================================

-- ============================================================
-- 1. Audit log
-- ============================================================
create type public.audit_action as enum (
  'user.role_changed',
  'user.deleted',
  'user.suspended',
  'user.unsuspended',
  'creator.status_changed',
  'business.org_verified',
  'dispute.resolved',
  'report.resolved',
  'report.dismissed',
  'report.reviewing',
  'broadcast.sent',
  'platform_settings.updated'
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action public.audit_action not null,
  target_type text check (target_type is null or char_length(target_type) <= 64),
  target_id uuid,
  -- Structured context (before/after, notes, amounts, etc.). JSONB keeps
  -- the shape flexible across action types without a wide column list.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create index idx_audit_log_created_at
  on public.admin_audit_log(created_at desc);
create index idx_audit_log_actor
  on public.admin_audit_log(actor_id, created_at desc);
create index idx_audit_log_action
  on public.admin_audit_log(action, created_at desc);
create index idx_audit_log_target
  on public.admin_audit_log(target_type, target_id, created_at desc);

-- Only admins can read the audit log. Writes are gated by
-- server-side code using the service-role client + authorization
-- checks in the helper. We do NOT grant INSERT via RLS because
-- we want the trail to be append-only and unreachable from
-- client code or compromised anon/authed sessions.
create policy "Admins read audit log"
  on public.admin_audit_log for select
  using (public.is_admin());

-- Explicitly deny mutations from authenticated/anon roles.
-- Service-role bypasses RLS and is used for inserts.
create policy "No direct mutations on audit log"
  on public.admin_audit_log for all
  using (false)
  with check (false);

-- ============================================================
-- 2. Admin broadcasts
-- ============================================================
create type public.broadcast_audience as enum (
  'all',
  'creators',
  'businesses'
);

create type public.broadcast_status as enum (
  'draft',
  'sent'
);

create table public.admin_broadcasts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  body text not null check (char_length(body) between 10 and 4000),
  audience public.broadcast_audience not null default 'all',
  link text check (link is null or char_length(link) <= 500),
  status public.broadcast_status not null default 'draft',
  sent_at timestamptz,
  recipients_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broadcasts_sent_fields_consistent check (
    (status = 'sent' and sent_at is not null)
    or (status = 'draft' and sent_at is null)
  )
);

alter table public.admin_broadcasts enable row level security;

create index idx_broadcasts_status
  on public.admin_broadcasts(status, created_at desc);
create index idx_broadcasts_author
  on public.admin_broadcasts(author_id, created_at desc);

create trigger set_broadcasts_updated_at
  before update on public.admin_broadcasts
  for each row execute function public.update_updated_at();

create policy "Admins read broadcasts"
  on public.admin_broadcasts for select
  using (public.is_admin());

create policy "Admins manage broadcasts"
  on public.admin_broadcasts for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 3. Extend notification_type with admin_broadcast
-- ============================================================
alter type public.notification_type add value if not exists 'admin_broadcast';
