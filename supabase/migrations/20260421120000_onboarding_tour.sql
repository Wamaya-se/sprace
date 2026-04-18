-- ============================================================
-- Sprace — Fas 10b: Onboarding tour
-- ============================================================
-- Stores the tour version the user last completed. The app
-- compares it against CURRENT_TOUR_VERSION (src/lib/onboarding/
-- version.ts) and shows the tour when the two differ. Null means
-- the user has never completed a tour — they will see the first
-- version. Bumping the constant re-triggers the tour for everyone,
-- no data migration needed.
-- ============================================================

alter table public.profiles
  add column if not exists tour_completed_version text
  check (
    tour_completed_version is null
    or char_length(tour_completed_version) <= 32
  );

comment on column public.profiles.tour_completed_version is
  'Last onboarding tour version the user completed or dismissed. '
  'Null if the user has not seen any tour yet. Compared against '
  'CURRENT_TOUR_VERSION in src/lib/onboarding/version.ts.';
