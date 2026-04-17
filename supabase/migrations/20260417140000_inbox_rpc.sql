-- ============================================================
-- Sprace — inbox-RPC: get_user_conversations_with_last_message
-- ============================================================
-- Ersätter fan-out-scan i getConversations (3 round-trips:
-- profiles, messages fullt drag, unread count) med en enda RPC
-- som returnerar conversations + last_message + unread_count +
-- other_participant i ett DB-anrop.
--
-- SECURITY INVOKER så att RLS på conversations/messages/profiles
-- fortsätter gälla per kallande user. Vi filtrerar dessutom
-- explicit på auth.uid() för att undvika att RPC:n används för
-- att räkna ut något om andras konversationer.
-- ============================================================

create or replace function public.get_user_conversations_with_last_message()
returns table (
  id uuid,
  booking_id uuid,
  last_message_at timestamptz,
  other_participant_id uuid,
  other_participant_full_name text,
  other_participant_avatar_url text,
  last_message_content text,
  last_message_sender_id uuid,
  last_message_is_system boolean,
  last_message_created_at timestamptz,
  unread_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select auth.uid() as uid
  ),
  convs as (
    select
      c.id,
      c.booking_id,
      c.last_message_at,
      case when c.participant_one = (select uid from me)
           then c.participant_two
           else c.participant_one
      end as other_participant_id
      from public.conversations c, me
     where c.participant_one = me.uid
        or c.participant_two = me.uid
  ),
  last_msg as (
    select distinct on (m.conversation_id)
      m.conversation_id,
      m.content,
      m.sender_id,
      m.is_system,
      m.created_at
      from public.messages m
     where m.conversation_id in (select id from convs)
     order by m.conversation_id, m.created_at desc
  ),
  unread as (
    select m.conversation_id, count(*)::bigint as c
      from public.messages m, me
     where m.conversation_id in (select id from convs)
       and m.sender_id <> me.uid
       and m.read_at is null
     group by m.conversation_id
  )
  select
    c.id,
    c.booking_id,
    c.last_message_at,
    p.id,
    p.full_name,
    p.avatar_url,
    lm.content,
    lm.sender_id,
    lm.is_system,
    lm.created_at,
    coalesce(u.c, 0)
    from convs c
    left join public.profiles p on p.id = c.other_participant_id
    left join last_msg lm on lm.conversation_id = c.id
    left join unread u on u.conversation_id = c.id
   order by c.last_message_at desc;
$$;

revoke all on function public.get_user_conversations_with_last_message() from public;
grant execute on function public.get_user_conversations_with_last_message() to authenticated;
