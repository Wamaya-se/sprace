-- Fix infinite recursion in admin RLS policies on profiles
-- The "Admins have full access to profiles" policy queries profiles
-- from within a profiles RLS policy, causing infinite recursion.
--
-- Solution: Create a SECURITY DEFINER function that checks admin role
-- without going through RLS, then use it in all admin policies.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- Drop the recursive policy on profiles
drop policy if exists "Admins have full access to profiles" on public.profiles;

-- Re-create using the safe function
create policy "Admins have full access to profiles"
  on public.profiles for all
  using (public.is_admin());

-- Update all other admin policies to use the safe function
-- CREATORS
drop policy if exists "Admins can manage all creators" on public.creators;
create policy "Admins can manage all creators"
  on public.creators for all
  using (public.is_admin());

-- SERVICES
drop policy if exists "Admins can manage all services" on public.services;
create policy "Admins can manage all services"
  on public.services for all
  using (public.is_admin());

-- SERVICE_MEDIA
drop policy if exists "Admins can manage all service media" on public.service_media;
create policy "Admins can manage all service media"
  on public.service_media for all
  using (public.is_admin());

-- SPECIALTIES
drop policy if exists "Admins can manage specialties" on public.specialties;
create policy "Admins can manage specialties"
  on public.specialties for all
  using (public.is_admin());

-- MARKETS
drop policy if exists "Admins can manage markets" on public.markets;
create policy "Admins can manage markets"
  on public.markets for all
  using (public.is_admin());

-- CREATOR_SPECIALTIES
drop policy if exists "Admins can manage creator specialties" on public.creator_specialties;
create policy "Admins can manage creator specialties"
  on public.creator_specialties for all
  using (public.is_admin());

-- CREATOR_MARKETS
drop policy if exists "Admins can manage creator markets" on public.creator_markets;
create policy "Admins can manage creator markets"
  on public.creator_markets for all
  using (public.is_admin());
