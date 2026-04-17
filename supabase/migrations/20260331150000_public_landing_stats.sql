-- Aggregate stats for public marketing (anon cannot read bookings row-by-row; this exposes counts only).
create or replace function public.public_landing_stats()
returns table (
  active_creators bigint,
  completed_bookings bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (
      select count(*)::bigint
      from public.creators
      where status = 'active'
        and slug is not null
    ),
    (
      select count(*)::bigint
      from public.bookings
      where status = 'completed'
    );
$$;

revoke all on function public.public_landing_stats() from public;
grant execute on function public.public_landing_stats() to anon, authenticated;
