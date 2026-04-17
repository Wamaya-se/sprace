-- ============================================================
-- Sprace — RLS-härdning (Fas 1.2)
-- ============================================================
-- Åtgärder:
--  1. Splittar messages UPDATE i:
--        a) sender får uppdatera egen rad (innehåll/metadata)
--        b) read_at-markering via SECURITY DEFINER-RPC mark_messages_read
--     Tar bort den generösa "Participants can update messages".
--  2. Skärper reviews INSERT-check så reviewee måste vara motparten
--     i en completed booking (ej bara valfri counterparty-profil).
--  3. Rensar duplicerade admin-policies som överlappar is_admin()-
--     varianterna från 20260328090000_fix_admin_rls_recursion.sql.
--  4. Byter businesses admin-policy till is_admin()-varianten.
--
-- Not om profiles SELECT: den permissiva "Users can view any profile"
-- lämnas kvar i denna pass. Skärpning kräver deep-embed-refactor av
-- creators/profiles-joins på flera listningssidor och flyttas till
-- en separat pass (se ROADMAP / RLS hardening task).
-- ============================================================

-- ---------- 1. messages UPDATE split ----------
drop policy if exists "Participants can update messages" on public.messages;

create policy "Sender can update own messages"
  on public.messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

create or replace function public.mark_messages_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id
      and (c.participant_one = v_user or c.participant_two = v_user)
  ) then
    raise exception 'not a participant';
  end if;

  update public.messages
     set read_at = now()
   where conversation_id = p_conversation_id
     and sender_id <> v_user
     and read_at is null;
end;
$$;

revoke all on function public.mark_messages_read(uuid) from public;
grant execute on function public.mark_messages_read(uuid) to authenticated;

-- ---------- 2. reviews INSERT-check ----------
-- Reviewee måste vara motparten i en completed booking, inte bara
-- "någon med en profil". Reviewer får heller inte granska sig själv.
drop policy if exists "Participants can create reviews" on public.reviews;

create policy "Participants can create reviews"
  on public.reviews for insert
  with check (
    reviewer_id = auth.uid()
    and reviewee_id <> auth.uid()
    and exists (
      select 1
        from public.bookings b
        left join public.businesses biz on biz.id = b.business_id
        left join public.creators  cr  on cr.id  = b.creator_id
       where b.id = reviews.booking_id
         and b.status = 'completed'
         and (
           (biz.profile_id = auth.uid() and cr.profile_id = reviews.reviewee_id)
           or
           (cr.profile_id = auth.uid() and biz.profile_id = reviews.reviewee_id)
         )
    )
  );

-- ---------- 3. Rensa duplicerade admin-policies ----------
-- "Admins have full access to ..." skapades i initial_schema med
-- rekursiv profiles-lookup och ersattes funktionellt av is_admin()-
-- varianterna i 20260328090000_fix_admin_rls_recursion.sql.
drop policy if exists "Admins have full access to creators" on public.creators;
drop policy if exists "Admins have full access to services" on public.services;
drop policy if exists "Admins have full access to service media" on public.service_media;

-- ---------- 4. businesses admin-policy ----------
drop policy if exists "Admins have full access to businesses" on public.businesses;
create policy "Admins can manage all businesses"
  on public.businesses for all
  using (public.is_admin());
