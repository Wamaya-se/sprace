-- ============================================================
-- Enable Supabase Realtime on messages, notifications, conversations
-- Replica identity FULL required for RLS-filtered Realtime
-- ============================================================

alter table public.messages replica identity full;
alter table public.notifications replica identity full;
alter table public.conversations replica identity full;

-- Add tables to supabase_realtime publication
-- (Supabase uses this publication to broadcast changes)
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.conversations;
