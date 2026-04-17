-- ============================================================
-- Sprace — Update handle_new_user() trigger
-- Reads role from user metadata and creates the corresponding
-- creators or businesses row atomically at signup.
-- ============================================================

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

  return new;
end;
$$;
