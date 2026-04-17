-- ============================================================
-- Sprace — Bookings, Conversations & Messaging
-- ============================================================

-- Booking status lifecycle
create type public.booking_status as enum (
  'pending',
  'accepted',
  'in_progress',
  'delivered',
  'completed',
  'declined',
  'cancelled'
);

-- ============================================================
-- BOOKINGS — collaboration request from business to creator
-- ============================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  creator_id uuid not null references public.creators(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  status public.booking_status not null default 'pending',
  title text not null,
  description text not null,
  budget numeric(10,2),
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create index idx_bookings_business on public.bookings(business_id);
create index idx_bookings_creator on public.bookings(creator_id);
create index idx_bookings_status on public.bookings(status);

create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute function public.update_updated_at();

-- ============================================================
-- CONVERSATIONS — container for booking threads and DMs
-- ============================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  participant_one uuid not null references public.profiles(id) on delete cascade,
  participant_two uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

create unique index idx_conversations_booking on public.conversations(booking_id) where booking_id is not null;
create index idx_conversations_participant_one on public.conversations(participant_one);
create index idx_conversations_participant_two on public.conversations(participant_two);
create index idx_conversations_last_message on public.conversations(last_message_at desc);

-- ============================================================
-- MESSAGES — individual messages in a conversation
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_system boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_messages_unread on public.messages(conversation_id, sender_id) where read_at is null;

-- ============================================================
-- RLS POLICIES — Bookings
-- ============================================================

-- Business can view own bookings
create policy "Business can view own bookings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.businesses
      where id = bookings.business_id and profile_id = auth.uid()
    )
  );

-- Creator can view bookings addressed to them
create policy "Creator can view own bookings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.creators
      where id = bookings.creator_id and profile_id = auth.uid()
    )
  );

-- Business can create bookings
create policy "Business can create bookings"
  on public.bookings for insert
  with check (
    exists (
      select 1 from public.businesses
      where id = bookings.business_id and profile_id = auth.uid()
    )
  );

-- Business can update own bookings (cancel, complete, revision)
create policy "Business can update own bookings"
  on public.bookings for update
  using (
    exists (
      select 1 from public.businesses
      where id = bookings.business_id and profile_id = auth.uid()
    )
  );

-- Creator can update bookings addressed to them (accept, decline, start, deliver)
create policy "Creator can update own bookings"
  on public.bookings for update
  using (
    exists (
      select 1 from public.creators
      where id = bookings.creator_id and profile_id = auth.uid()
    )
  );

-- Admins have full access
create policy "Admins have full access to bookings"
  on public.bookings for all
  using (public.is_admin());

-- ============================================================
-- RLS POLICIES — Conversations
-- ============================================================

-- Participants can view their conversations
create policy "Participants can view conversations"
  on public.conversations for select
  using (
    auth.uid() = participant_one or auth.uid() = participant_two
  );

-- Participants can create conversations
create policy "Participants can create conversations"
  on public.conversations for insert
  with check (
    auth.uid() = participant_one or auth.uid() = participant_two
  );

-- Participants can update conversations (last_message_at)
create policy "Participants can update conversations"
  on public.conversations for update
  using (
    auth.uid() = participant_one or auth.uid() = participant_two
  );

-- Admins have full access
create policy "Admins have full access to conversations"
  on public.conversations for all
  using (public.is_admin());

-- ============================================================
-- RLS POLICIES — Messages
-- ============================================================

-- Participants can view messages in their conversations
create policy "Participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

-- Participants can send messages to their conversations
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

-- Participants can update messages (mark as read)
create policy "Participants can update messages"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

-- Admins have full access
create policy "Admins have full access to messages"
  on public.messages for all
  using (public.is_admin());
