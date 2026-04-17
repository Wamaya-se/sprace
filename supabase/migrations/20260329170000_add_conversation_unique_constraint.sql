-- Prevent duplicate DM conversations (booking_id IS NULL) between the same pair.
-- Uses LEAST/GREATEST to normalize participant order so (A,B) and (B,A) are treated as the same pair.
create unique index idx_conversations_dm_pair
  on public.conversations (
    least(participant_one, participant_two),
    greatest(participant_one, participant_two)
  )
  where booking_id is null;
