-- ============================================================
-- Sprace — Store role in auth.users app_metadata for JWT access
-- Eliminates DB queries for role-based routing in middleware.
-- Role source of truth remains profiles.role (enforced by RLS).
-- ============================================================

-- 1. Update handle_new_user() to also set app_metadata.role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  user_role public.user_role;
begin
  user_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'creator'
  );

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    user_role
  );

  if user_role = 'creator' then
    insert into public.creators (profile_id, display_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', '')
    );
  elsif user_role = 'business' then
    insert into public.businesses (profile_id, company_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'company_name', '')
    );
  end if;

  -- Set role in app_metadata so it's available in the JWT
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', user_role::text)
  where id = new.id;

  return new;
end;
$$;

-- 2. Backfill existing users who don't have role in app_metadata
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role::text)
from public.profiles p
where u.id = p.id
  and (u.raw_app_meta_data ->> 'role') is null;
