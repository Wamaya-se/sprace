-- ============================================================
-- Sprace — handle_new_user: bake in TOS accept
-- ============================================================
-- Tar bort behovet av att frontend skriver tos_accepted_at via
-- service-role direkt efter signUp. Istället skriver triggern
-- tos_accepted_at = now() och tos_version (från raw_user_meta_data
-- eller default '1.0') atomiskt vid profilskapandet.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  user_role public.user_role;
  v_tos_version text;
begin
  user_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'creator'
  );

  v_tos_version := coalesce(
    new.raw_user_meta_data ->> 'tos_version',
    '1.0'
  );

  insert into public.profiles (
    id, email, full_name, avatar_url, role,
    tos_accepted_at, tos_version
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    user_role,
    now(),
    v_tos_version
  );

  if user_role = 'creator' then
    insert into public.creators (profile_id, display_name)
    values (
      new.id,
      coalesce(
        new.raw_user_meta_data ->> 'display_name',
        new.raw_user_meta_data ->> 'full_name',
        ''
      )
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
