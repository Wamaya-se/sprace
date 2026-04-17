-- ============================================================
-- Sprace — Fas 6d: ToS consent tracking
-- ============================================================

alter table public.profiles
  add column tos_accepted_at timestamptz,
  add column tos_version text;
