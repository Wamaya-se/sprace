-- ============================================================
-- Sprace — Discover-sökning: pg_trgm + search_creators RPC
-- ============================================================
-- Nuvarande discover-page drar ut alla aktiva creators via
-- `.ilike('display_name', '%q%')` och filtrerar sedan specialty/
-- market i Node-minnet. Det skalar inte. Denna migration:
--   1. Aktiverar pg_trgm och lägger ett GIN-index på
--      creators.display_name för snabb trigram-sökning.
--   2. Lägger ett GIN-index på creators.bio för trigram-sökning.
--   3. Definierar en RPC `search_creators` som gör all filtrering
--      direkt i databasen (text, specialty-slugs, market-slugs,
--      hourly_rate-range) och returnerar en flat rad per creator.
--
-- SECURITY INVOKER → RLS på creators/profiles gäller per user.
-- Funktionen är stable (ingen write) och kan därmed cacheas.
-- ============================================================

create extension if not exists pg_trgm;

create index if not exists creators_display_name_trgm_idx
  on public.creators using gin (display_name gin_trgm_ops);

create index if not exists creators_bio_trgm_idx
  on public.creators using gin (bio gin_trgm_ops);

create or replace function public.search_creators(
  p_q text default null,
  p_specialty_slugs text[] default null,
  p_market_slugs text[] default null,
  p_min_rate numeric default null,
  p_max_rate numeric default null,
  p_limit int default 48,
  p_offset int default 0
)
returns table (
  id uuid,
  profile_id uuid,
  display_name text,
  bio text,
  hourly_rate numeric,
  followers_count int,
  slug text,
  avatar_url text,
  specialties jsonb,
  markets jsonb,
  average_rating numeric,
  total_reviews bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with base as (
    select c.*
      from public.creators c
     where c.status = 'active'
       and c.slug is not null
       and (
         p_q is null
         or c.display_name ilike '%' || p_q || '%'
         or c.bio ilike '%' || p_q || '%'
       )
       and (p_min_rate is null or c.hourly_rate >= p_min_rate)
       and (p_max_rate is null or c.hourly_rate <= p_max_rate)
       and (
         p_specialty_slugs is null
         or exists (
           select 1
             from public.creator_specialties cs
             join public.specialties s on s.id = cs.specialty_id
            where cs.creator_id = c.id
              and s.slug = any(p_specialty_slugs)
         )
       )
       and (
         p_market_slugs is null
         or exists (
           select 1
             from public.creator_markets cm
             join public.markets m on m.id = cm.market_id
            where cm.creator_id = c.id
              and m.slug = any(p_market_slugs)
         )
       )
  )
  select
    b.id,
    b.profile_id,
    b.display_name,
    b.bio,
    b.hourly_rate,
    b.followers_count,
    b.slug,
    p.avatar_url,
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'slug', s.slug) order by s.name)
         from public.creator_specialties cs
         join public.specialties s on s.id = cs.specialty_id
        where cs.creator_id = b.id),
      '[]'::jsonb
    ) as specialties,
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'slug', m.slug, 'flag_emoji', m.flag_emoji) order by m.name)
         from public.creator_markets cm
         join public.markets m on m.id = cm.market_id
        where cm.creator_id = b.id),
      '[]'::jsonb
    ) as markets,
    (select avg(r.rating)::numeric(10,2)
       from public.reviews r
      where r.reviewee_id = b.profile_id) as average_rating,
    (select count(*)::bigint
       from public.reviews r
      where r.reviewee_id = b.profile_id) as total_reviews
    from base b
    left join public.profiles p on p.id = b.profile_id
   order by b.created_at desc
   limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.search_creators(text, text[], text[], numeric, numeric, int, int) from public;
grant execute on function public.search_creators(text, text[], text[], numeric, numeric, int, int) to anon, authenticated;
