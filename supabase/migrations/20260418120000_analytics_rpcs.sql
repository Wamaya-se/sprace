-- ============================================================
-- Sprace — Fas 8a: Analytics RPCs
-- ============================================================
-- Aggregerade läs-RPCer för creator-, business- och admin-dashboards.
--
-- Designprinciper:
--  * SECURITY INVOKER för creator/business — RLS ger automatiskt
--    rätt data per användare.
--  * SECURITY INVOKER för admin — admins har redan full RLS-access
--    via is_admin(). Vi guardar dessutom tidigt med en explicit check
--    så att non-admins får ett tydligt fel istället för tomt resultat.
--  * p_bucket valideras mot en allowlist (ingen SQL-injection via
--    date_trunc-strängen).
--  * Intäktsserier är gap-fyllda via generate_series så klienten
--    slipper logik för tomma buckets.
--
-- Datumkonventioner:
--  * Creator-intäkter: payments.transferred_at, status = 'transferred'
--  * Business-spend:   payments.captured_at, status in ('captured','transferred')
--  * Slutförda bok.:   bookings.updated_at, status = 'completed'
--  * Övriga skapelse-tidsstämplar: tabellens created_at
-- ============================================================

-- ============================================================
-- Hjälpare: validera p_bucket → returnerar bucket-text för date_trunc
-- ============================================================
create or replace function public._analytics_validate_bucket(p_bucket text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_bucket not in ('day', 'week', 'month', 'quarter', 'year') then
    raise exception 'invalid bucket: %', p_bucket
      using hint = 'must be one of: day, week, month, quarter, year';
  end if;
  return p_bucket;
end;
$$;

revoke all on function public._analytics_validate_bucket(text) from public;
grant execute on function public._analytics_validate_bucket(text) to authenticated;

-- ============================================================
-- 1. Creator summary
-- ============================================================
create or replace function public.get_creator_analytics_summary(
  p_start_date timestamptz,
  p_end_date   timestamptz
)
returns table (
  revenue_minor              bigint,
  payouts_count              bigint,
  bookings_count             bigint,
  completed_count            bigint,
  avg_rating                 numeric,
  review_count               bigint,
  prev_revenue_minor         bigint,
  prev_payouts_count         bigint,
  prev_bookings_count        bigint,
  prev_completed_count       bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_period_length interval;
  v_prev_start    timestamptz;
  v_prev_end      timestamptz;
  v_creator_id    uuid;
begin
  if p_end_date <= p_start_date then
    raise exception 'p_end_date must be greater than p_start_date';
  end if;

  v_period_length := p_end_date - p_start_date;
  v_prev_end      := p_start_date;
  v_prev_start    := p_start_date - v_period_length;

  select c.id into v_creator_id
    from public.creators c
   where c.profile_id = auth.uid()
   limit 1;

  if v_creator_id is null then
    return query
      select 0::bigint, 0::bigint, 0::bigint, 0::bigint, null::numeric,
             0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint;
    return;
  end if;

  return query
  with revenue as (
    select
      coalesce(sum(p.creator_payout), 0)::bigint as total,
      count(*)::bigint                            as cnt
      from public.payments p
      join public.bookings b on b.id = p.booking_id
     where b.creator_id = v_creator_id
       and p.status = 'transferred'
       and p.transferred_at >= p_start_date
       and p.transferred_at <  p_end_date
  ),
  prev_revenue as (
    select
      coalesce(sum(p.creator_payout), 0)::bigint as total,
      count(*)::bigint                            as cnt
      from public.payments p
      join public.bookings b on b.id = p.booking_id
     where b.creator_id = v_creator_id
       and p.status = 'transferred'
       and p.transferred_at >= v_prev_start
       and p.transferred_at <  v_prev_end
  ),
  bookings_curr as (
    select
      count(*)::bigint as total,
      count(*) filter (where b.status = 'completed' and b.updated_at >= p_start_date and b.updated_at < p_end_date)::bigint as completed
      from public.bookings b
     where b.creator_id = v_creator_id
       and b.created_at >= p_start_date
       and b.created_at <  p_end_date
  ),
  bookings_prev as (
    select
      count(*)::bigint as total,
      count(*) filter (where b.status = 'completed' and b.updated_at >= v_prev_start and b.updated_at < v_prev_end)::bigint as completed
      from public.bookings b
     where b.creator_id = v_creator_id
       and b.created_at >= v_prev_start
       and b.created_at <  v_prev_end
  ),
  ratings as (
    select
      avg(r.rating)::numeric  as avg_rating,
      count(*)::bigint        as cnt
      from public.reviews r
      join public.creators c on c.profile_id = r.reviewee_id
     where c.id = v_creator_id
       and r.created_at >= p_start_date
       and r.created_at <  p_end_date
  )
  select
    revenue.total,
    revenue.cnt,
    bookings_curr.total,
    bookings_curr.completed,
    ratings.avg_rating,
    ratings.cnt,
    prev_revenue.total,
    prev_revenue.cnt,
    bookings_prev.total,
    bookings_prev.completed
    from revenue, prev_revenue, bookings_curr, bookings_prev, ratings;
end;
$$;

revoke all on function public.get_creator_analytics_summary(timestamptz, timestamptz) from public;
grant execute on function public.get_creator_analytics_summary(timestamptz, timestamptz) to authenticated;

-- ============================================================
-- 2. Creator revenue timeseries (gap-filled)
-- ============================================================
create or replace function public.get_creator_revenue_timeseries(
  p_start_date timestamptz,
  p_end_date   timestamptz,
  p_bucket     text default 'day'
)
returns table (
  bucket_start    timestamptz,
  revenue_minor   bigint,
  payouts_count   bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_bucket     text;
  v_creator_id uuid;
begin
  if p_end_date <= p_start_date then
    raise exception 'p_end_date must be greater than p_start_date';
  end if;

  v_bucket := public._analytics_validate_bucket(p_bucket);

  select c.id into v_creator_id
    from public.creators c
   where c.profile_id = auth.uid()
   limit 1;

  if v_creator_id is null then
    return;
  end if;

  return query
  with buckets as (
    select date_trunc(v_bucket, gs) as bucket_start
      from generate_series(
        date_trunc(v_bucket, p_start_date),
        date_trunc(v_bucket, p_end_date - interval '1 microsecond'),
        ('1 ' || v_bucket)::interval
      ) gs
  ),
  agg as (
    select
      date_trunc(v_bucket, p.transferred_at) as bucket_start,
      sum(p.creator_payout)::bigint           as revenue_minor,
      count(*)::bigint                        as payouts_count
      from public.payments p
      join public.bookings b on b.id = p.booking_id
     where b.creator_id = v_creator_id
       and p.status = 'transferred'
       and p.transferred_at >= p_start_date
       and p.transferred_at <  p_end_date
     group by 1
  )
  select
    b.bucket_start,
    coalesce(a.revenue_minor, 0)::bigint,
    coalesce(a.payouts_count, 0)::bigint
    from buckets b
    left join agg a using (bucket_start)
   order by b.bucket_start;
end;
$$;

revoke all on function public.get_creator_revenue_timeseries(timestamptz, timestamptz, text) from public;
grant execute on function public.get_creator_revenue_timeseries(timestamptz, timestamptz, text) to authenticated;

-- ============================================================
-- 3. Creator bookings by status
-- ============================================================
create or replace function public.get_creator_bookings_by_status(
  p_start_date timestamptz,
  p_end_date   timestamptz
)
returns table (
  status public.booking_status,
  count  bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_creator_id uuid;
begin
  if p_end_date <= p_start_date then
    raise exception 'p_end_date must be greater than p_start_date';
  end if;

  select c.id into v_creator_id
    from public.creators c
   where c.profile_id = auth.uid()
   limit 1;

  if v_creator_id is null then
    return;
  end if;

  return query
    select b.status, count(*)::bigint
      from public.bookings b
     where b.creator_id = v_creator_id
       and b.created_at >= p_start_date
       and b.created_at <  p_end_date
     group by b.status
     order by count(*) desc;
end;
$$;

revoke all on function public.get_creator_bookings_by_status(timestamptz, timestamptz) from public;
grant execute on function public.get_creator_bookings_by_status(timestamptz, timestamptz) to authenticated;

-- ============================================================
-- 4. Business summary
-- ============================================================
create or replace function public.get_business_analytics_summary(
  p_start_date timestamptz,
  p_end_date   timestamptz
)
returns table (
  spending_minor             bigint,
  payments_count             bigint,
  bookings_count             bigint,
  active_bookings_count      bigint,
  completed_count            bigint,
  prev_spending_minor        bigint,
  prev_payments_count        bigint,
  prev_bookings_count        bigint,
  prev_completed_count       bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_period_length interval;
  v_prev_start    timestamptz;
  v_prev_end      timestamptz;
  v_business_id   uuid;
begin
  if p_end_date <= p_start_date then
    raise exception 'p_end_date must be greater than p_start_date';
  end if;

  v_period_length := p_end_date - p_start_date;
  v_prev_end      := p_start_date;
  v_prev_start    := p_start_date - v_period_length;

  select biz.id into v_business_id
    from public.businesses biz
   where biz.profile_id = auth.uid()
   limit 1;

  if v_business_id is null then
    return query
      select 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint,
             0::bigint, 0::bigint, 0::bigint, 0::bigint;
    return;
  end if;

  return query
  with spend_curr as (
    select
      coalesce(sum(p.amount_total), 0)::bigint as total,
      count(*)::bigint                          as cnt
      from public.payments p
      join public.bookings b on b.id = p.booking_id
     where b.business_id = v_business_id
       and p.status in ('captured', 'transferred')
       and p.captured_at >= p_start_date
       and p.captured_at <  p_end_date
  ),
  spend_prev as (
    select
      coalesce(sum(p.amount_total), 0)::bigint as total,
      count(*)::bigint                          as cnt
      from public.payments p
      join public.bookings b on b.id = p.booking_id
     where b.business_id = v_business_id
       and p.status in ('captured', 'transferred')
       and p.captured_at >= v_prev_start
       and p.captured_at <  v_prev_end
  ),
  bookings_curr as (
    select
      count(*)::bigint as total,
      count(*) filter (where b.status = 'completed' and b.updated_at >= p_start_date and b.updated_at < p_end_date)::bigint as completed
      from public.bookings b
     where b.business_id = v_business_id
       and b.created_at >= p_start_date
       and b.created_at <  p_end_date
  ),
  bookings_prev as (
    select
      count(*)::bigint as total,
      count(*) filter (where b.status = 'completed' and b.updated_at >= v_prev_start and b.updated_at < v_prev_end)::bigint as completed
      from public.bookings b
     where b.business_id = v_business_id
       and b.created_at >= v_prev_start
       and b.created_at <  v_prev_end
  ),
  active as (
    -- "Active" = currently in-flight regardless of when created.
    select count(*)::bigint as total
      from public.bookings b
     where b.business_id = v_business_id
       and b.status in ('pending', 'awaiting_payment', 'accepted', 'in_progress', 'delivered', 'disputed')
  )
  select
    spend_curr.total,
    spend_curr.cnt,
    bookings_curr.total,
    active.total,
    bookings_curr.completed,
    spend_prev.total,
    spend_prev.cnt,
    bookings_prev.total,
    bookings_prev.completed
    from spend_curr, spend_prev, bookings_curr, bookings_prev, active;
end;
$$;

revoke all on function public.get_business_analytics_summary(timestamptz, timestamptz) from public;
grant execute on function public.get_business_analytics_summary(timestamptz, timestamptz) to authenticated;

-- ============================================================
-- 5. Business spending timeseries (gap-filled)
-- ============================================================
create or replace function public.get_business_spending_timeseries(
  p_start_date timestamptz,
  p_end_date   timestamptz,
  p_bucket     text default 'day'
)
returns table (
  bucket_start    timestamptz,
  spending_minor  bigint,
  payments_count  bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_bucket      text;
  v_business_id uuid;
begin
  if p_end_date <= p_start_date then
    raise exception 'p_end_date must be greater than p_start_date';
  end if;

  v_bucket := public._analytics_validate_bucket(p_bucket);

  select biz.id into v_business_id
    from public.businesses biz
   where biz.profile_id = auth.uid()
   limit 1;

  if v_business_id is null then
    return;
  end if;

  return query
  with buckets as (
    select date_trunc(v_bucket, gs) as bucket_start
      from generate_series(
        date_trunc(v_bucket, p_start_date),
        date_trunc(v_bucket, p_end_date - interval '1 microsecond'),
        ('1 ' || v_bucket)::interval
      ) gs
  ),
  agg as (
    select
      date_trunc(v_bucket, p.captured_at) as bucket_start,
      sum(p.amount_total)::bigint          as spending_minor,
      count(*)::bigint                     as payments_count
      from public.payments p
      join public.bookings b on b.id = p.booking_id
     where b.business_id = v_business_id
       and p.status in ('captured', 'transferred')
       and p.captured_at >= p_start_date
       and p.captured_at <  p_end_date
     group by 1
  )
  select
    b.bucket_start,
    coalesce(a.spending_minor, 0)::bigint,
    coalesce(a.payments_count, 0)::bigint
    from buckets b
    left join agg a using (bucket_start)
   order by b.bucket_start;
end;
$$;

revoke all on function public.get_business_spending_timeseries(timestamptz, timestamptz, text) from public;
grant execute on function public.get_business_spending_timeseries(timestamptz, timestamptz, text) to authenticated;

-- ============================================================
-- 6. Business top creators (by spend)
-- ============================================================
create or replace function public.get_business_top_creators(
  p_start_date timestamptz,
  p_end_date   timestamptz,
  p_limit      integer default 5
)
returns table (
  creator_id      uuid,
  display_name    text,
  avatar_url      text,
  slug            text,
  spending_minor  bigint,
  bookings_count  bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_limit       integer;
begin
  if p_end_date <= p_start_date then
    raise exception 'p_end_date must be greater than p_start_date';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 5), 50));

  select biz.id into v_business_id
    from public.businesses biz
   where biz.profile_id = auth.uid()
   limit 1;

  if v_business_id is null then
    return;
  end if;

  return query
    select
      c.id,
      c.display_name,
      c.avatar_url,
      c.slug,
      coalesce(sum(p.amount_total), 0)::bigint as spending_minor,
      count(distinct b.id)::bigint              as bookings_count
      from public.bookings b
      join public.creators c on c.id = b.creator_id
      left join public.payments p
             on p.booking_id = b.id
            and p.status in ('captured', 'transferred')
            and p.captured_at >= p_start_date
            and p.captured_at <  p_end_date
     where b.business_id = v_business_id
       and b.created_at >= p_start_date
       and b.created_at <  p_end_date
     group by c.id, c.display_name, c.avatar_url, c.slug
     having count(distinct b.id) > 0
     order by spending_minor desc, bookings_count desc
     limit v_limit;
end;
$$;

revoke all on function public.get_business_top_creators(timestamptz, timestamptz, integer) from public;
grant execute on function public.get_business_top_creators(timestamptz, timestamptz, integer) to authenticated;

-- ============================================================
-- 7. Admin summary
-- ============================================================
create or replace function public.get_admin_analytics_summary(
  p_start_date timestamptz,
  p_end_date   timestamptz
)
returns table (
  gross_volume_minor          bigint,
  platform_fee_minor          bigint,
  payout_volume_minor         bigint,
  refund_volume_minor         bigint,
  payments_count              bigint,
  completed_bookings_count    bigint,
  new_users_count             bigint,
  new_creators_count          bigint,
  new_businesses_count        bigint,
  prev_gross_volume_minor     bigint,
  prev_platform_fee_minor     bigint,
  prev_completed_bookings_count bigint,
  prev_new_users_count        bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_period_length interval;
  v_prev_start    timestamptz;
  v_prev_end      timestamptz;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if p_end_date <= p_start_date then
    raise exception 'p_end_date must be greater than p_start_date';
  end if;

  v_period_length := p_end_date - p_start_date;
  v_prev_end      := p_start_date;
  v_prev_start    := p_start_date - v_period_length;

  return query
  with revenue_curr as (
    select
      coalesce(sum(p.amount_total), 0)::bigint     as gross,
      coalesce(sum(p.platform_fee), 0)::bigint     as fees,
      coalesce(sum(p.creator_payout), 0)::bigint   as payouts,
      count(*)::bigint                              as cnt
      from public.payments p
     where p.status in ('captured', 'transferred')
       and p.captured_at >= p_start_date
       and p.captured_at <  p_end_date
  ),
  revenue_prev as (
    select
      coalesce(sum(p.amount_total), 0)::bigint   as gross,
      coalesce(sum(p.platform_fee), 0)::bigint   as fees
      from public.payments p
     where p.status in ('captured', 'transferred')
       and p.captured_at >= v_prev_start
       and p.captured_at <  v_prev_end
  ),
  refunds_curr as (
    select coalesce(sum(p.amount_total), 0)::bigint as total
      from public.payments p
     where p.status = 'refunded'
       and p.refunded_at >= p_start_date
       and p.refunded_at <  p_end_date
  ),
  bookings_curr as (
    select count(*)::bigint as completed
      from public.bookings b
     where b.status = 'completed'
       and b.updated_at >= p_start_date
       and b.updated_at <  p_end_date
  ),
  bookings_prev as (
    select count(*)::bigint as completed
      from public.bookings b
     where b.status = 'completed'
       and b.updated_at >= v_prev_start
       and b.updated_at <  v_prev_end
  ),
  users_curr as (
    select
      count(*)::bigint                                            as total,
      count(*) filter (where pr.role = 'creator')::bigint         as creators,
      count(*) filter (where pr.role = 'business')::bigint        as businesses
      from public.profiles pr
     where pr.created_at >= p_start_date
       and pr.created_at <  p_end_date
  ),
  users_prev as (
    select count(*)::bigint as total
      from public.profiles pr
     where pr.created_at >= v_prev_start
       and pr.created_at <  v_prev_end
  )
  select
    revenue_curr.gross,
    revenue_curr.fees,
    revenue_curr.payouts,
    refunds_curr.total,
    revenue_curr.cnt,
    bookings_curr.completed,
    users_curr.total,
    users_curr.creators,
    users_curr.businesses,
    revenue_prev.gross,
    revenue_prev.fees,
    bookings_prev.completed,
    users_prev.total
    from revenue_curr, revenue_prev, refunds_curr,
         bookings_curr, bookings_prev,
         users_curr, users_prev;
end;
$$;

revoke all on function public.get_admin_analytics_summary(timestamptz, timestamptz) from public;
grant execute on function public.get_admin_analytics_summary(timestamptz, timestamptz) to authenticated;

-- ============================================================
-- 8. Admin revenue timeseries
-- ============================================================
create or replace function public.get_admin_revenue_timeseries(
  p_start_date timestamptz,
  p_end_date   timestamptz,
  p_bucket     text default 'day'
)
returns table (
  bucket_start         timestamptz,
  gross_volume_minor   bigint,
  platform_fee_minor   bigint,
  payout_volume_minor  bigint,
  payments_count       bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_bucket text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if p_end_date <= p_start_date then
    raise exception 'p_end_date must be greater than p_start_date';
  end if;

  v_bucket := public._analytics_validate_bucket(p_bucket);

  return query
  with buckets as (
    select date_trunc(v_bucket, gs) as bucket_start
      from generate_series(
        date_trunc(v_bucket, p_start_date),
        date_trunc(v_bucket, p_end_date - interval '1 microsecond'),
        ('1 ' || v_bucket)::interval
      ) gs
  ),
  agg as (
    select
      date_trunc(v_bucket, p.captured_at) as bucket_start,
      sum(p.amount_total)::bigint          as gross,
      sum(p.platform_fee)::bigint          as fees,
      sum(p.creator_payout)::bigint        as payouts,
      count(*)::bigint                     as cnt
      from public.payments p
     where p.status in ('captured', 'transferred')
       and p.captured_at >= p_start_date
       and p.captured_at <  p_end_date
     group by 1
  )
  select
    b.bucket_start,
    coalesce(a.gross, 0)::bigint,
    coalesce(a.fees, 0)::bigint,
    coalesce(a.payouts, 0)::bigint,
    coalesce(a.cnt, 0)::bigint
    from buckets b
    left join agg a using (bucket_start)
   order by b.bucket_start;
end;
$$;

revoke all on function public.get_admin_revenue_timeseries(timestamptz, timestamptz, text) from public;
grant execute on function public.get_admin_revenue_timeseries(timestamptz, timestamptz, text) to authenticated;

-- ============================================================
-- 9. Admin user growth timeseries
-- ============================================================
create or replace function public.get_admin_user_growth_timeseries(
  p_start_date timestamptz,
  p_end_date   timestamptz,
  p_bucket     text default 'day'
)
returns table (
  bucket_start    timestamptz,
  total_count     bigint,
  creator_count   bigint,
  business_count  bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_bucket text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if p_end_date <= p_start_date then
    raise exception 'p_end_date must be greater than p_start_date';
  end if;

  v_bucket := public._analytics_validate_bucket(p_bucket);

  return query
  with buckets as (
    select date_trunc(v_bucket, gs) as bucket_start
      from generate_series(
        date_trunc(v_bucket, p_start_date),
        date_trunc(v_bucket, p_end_date - interval '1 microsecond'),
        ('1 ' || v_bucket)::interval
      ) gs
  ),
  agg as (
    select
      date_trunc(v_bucket, pr.created_at)                  as bucket_start,
      count(*)::bigint                                      as total,
      count(*) filter (where pr.role = 'creator')::bigint   as creators,
      count(*) filter (where pr.role = 'business')::bigint  as businesses
      from public.profiles pr
     where pr.created_at >= p_start_date
       and pr.created_at <  p_end_date
     group by 1
  )
  select
    b.bucket_start,
    coalesce(a.total, 0)::bigint,
    coalesce(a.creators, 0)::bigint,
    coalesce(a.businesses, 0)::bigint
    from buckets b
    left join agg a using (bucket_start)
   order by b.bucket_start;
end;
$$;

revoke all on function public.get_admin_user_growth_timeseries(timestamptz, timestamptz, text) from public;
grant execute on function public.get_admin_user_growth_timeseries(timestamptz, timestamptz, text) to authenticated;

-- ============================================================
-- 10. Admin top categories (by booking count + GMV)
-- ============================================================
create or replace function public.get_admin_top_categories(
  p_start_date timestamptz,
  p_end_date   timestamptz,
  p_limit      integer default 10
)
returns table (
  specialty_id              uuid,
  slug                      text,
  name                      text,
  bookings_count            bigint,
  completed_bookings_count  bigint,
  gross_volume_minor        bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_limit integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if p_end_date <= p_start_date then
    raise exception 'p_end_date must be greater than p_start_date';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 10), 50));

  return query
    select
      s.id,
      s.slug,
      s.name,
      count(distinct b.id)::bigint                                                     as bookings_count,
      count(distinct b.id) filter (where b.status = 'completed')::bigint               as completed_bookings_count,
      coalesce(sum(p.amount_total) filter (where p.status in ('captured','transferred')), 0)::bigint as gross_volume_minor
      from public.bookings b
      join public.creator_specialties cs on cs.creator_id = b.creator_id
      join public.specialties s          on s.id = cs.specialty_id
      left join public.payments p        on p.booking_id = b.id
     where b.created_at >= p_start_date
       and b.created_at <  p_end_date
     group by s.id, s.slug, s.name
     having count(distinct b.id) > 0
     order by bookings_count desc, gross_volume_minor desc
     limit v_limit;
end;
$$;

revoke all on function public.get_admin_top_categories(timestamptz, timestamptz, integer) from public;
grant execute on function public.get_admin_top_categories(timestamptz, timestamptz, integer) to authenticated;
