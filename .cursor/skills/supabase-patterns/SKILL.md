---
name: supabase-patterns
description: >-
  Provides patterns for Supabase integration in Sprace: client setup,
  Row Level Security policies, Edge Functions, type generation, and storage.
  Use when writing database queries, auth logic, RLS policies, or Edge Functions.
---

# Supabase Patterns — Sprace

## Client setup

### Server-side (Server Components, Route Handlers, Server Actions)

The server client is wrapped with `React.cache()` for automatic per-request deduplication. Multiple `await createClient()` calls in the same request return the same instance.

Uses `src/lib/env.ts` for validated env access — never `process.env.VAR!`.

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'

export async function createClient() {
	const cookieStore = await cookies()

	return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll()
			},
			setAll(cookiesToSet) {
				try {
					cookiesToSet.forEach(({ name, value, options }) =>
						cookieStore.set(name, value, options),
					)
				} catch {
					// setAll called from Server Component — safe to ignore
				}
			},
		},
	})
}
```

### Client-side (components with `'use client'`)

Must use inline `process.env.NEXT_PUBLIC_*!` — the Next.js bundler replaces these at build time. Dynamic access via `env.ts` getters does NOT work client-side.

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
	return createBrowserClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	)
}
```

### Realtime subscriptions

Use `useSupabase()` hook for a stable singleton client in React components. Subscribe to `postgres_changes` for live updates. RLS policies automatically filter events per user.

```typescript
import { useSupabase } from '@/hooks/use-supabase'

// In a hook or component:
const supabase = useSupabase()
const channel = supabase
	.channel('my-channel')
	.on(
		'postgres_changes',
		{
			event: 'INSERT',
			schema: 'public',
			table: 'messages',
			filter: `conversation_id=eq.${id}`,
		},
		(payload) => {
			/* handle */
		},
	)
	.subscribe()

// Cleanup:
return () => supabase.removeChannel(channel)
```

Tables must have `replica identity full` and be added to `supabase_realtime` publication via migration.

### Middleware (auth session refresh + role-based routing)

Middleware can't use `src/lib/env.ts` (Edge Runtime), so validate env vars at the top. Role-based routing reads from `user.app_metadata.role` (set at registration, synced to the JWT) — no DB query needed:

```typescript
const {
	data: { user },
} = await supabase.auth.getUser()
const role = (user?.app_metadata?.role as string) ?? 'creator'
// ... redirect based on role — zero DB queries
```

## Type generation

Always generate types after schema changes:

```bash
npx supabase gen types typescript --linked > src/types/supabase.ts
```

Use the `Database` type everywhere — never use `any` for Supabase responses.

## Row Level Security (RLS)

Every table must have RLS enabled. Common patterns:

### Users can read/write their own data

```sql
create policy "Users manage own profile"
  on profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Public read, authenticated write

```sql
create policy "Anyone can view creators"
  on creators for select
  using (true);

create policy "Creators manage own listing"
  on creators for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Role-based access (admin)

Always use the `is_admin()` SECURITY DEFINER function — never inline a subquery on profiles:

```sql
-- Requires public.is_admin() function (see "RLS admin policies" section below)
create policy "Admins have full access"
  on any_table for all
  using (public.is_admin());
```

## Query optimization

### Avoid N+1 queries

Never query inside a loop. Batch with `Promise.all` + `.in()`:

```typescript
// BAD — N+1
for (const conv of conversations) {
	const { data: profile } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', conv.other_id)
		.single()
}

// GOOD — batched
const ids = conversations.map((c) => c.other_id)
const [profiles, messages] = await Promise.all([
	supabase.from('profiles').select('*').in('id', ids),
	supabase.from('messages').select('*').in('conversation_id', convIds),
])
const profileMap = new Map(profiles.data?.map((p) => [p.id, p]))
```

### Unique constraints on participant pairs

For tables with two participant columns (e.g. conversations), use LEAST/GREATEST to normalize order:

```sql
create unique index idx_conversations_dm_pair
  on public.conversations (least(participant_one, participant_two), greatest(participant_one, participant_two))
  where booking_id is null;
```

Handle unique violation (`23505`) in code by retrying the lookup.

## Queries

### Fetching with types

```typescript
const { data, error } = await supabase
	.from('creators')
	.select('id, display_name, avatar_url, services(name, price)')
	.eq('is_published', true)
	.order('created_at', { ascending: false })
	.limit(20)

if (error) throw error
```

### Mutations with Zod validation

```typescript
import { creatorSchema } from '@/validators/creator'

const validated = creatorSchema.parse(formData)
const { error } = await supabase
	.from('creators')
	.update(validated)
	.eq('user_id', userId)

if (error) throw error
```

## Storage

### Upload pattern

```typescript
const { data, error } = await supabase.storage
	.from('media')
	.upload(`${userId}/${fileName}`, file, {
		cacheControl: '3600',
		upsert: false,
	})
```

### Get public URL

```typescript
const { data } = supabase.storage
	.from('media')
	.getPublicUrl(`${userId}/${fileName}`)
```

## Edge Functions

Place in `supabase/functions/function-name/index.ts`. Use Deno runtime.

```typescript
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async (req) => {
	const supabase = createClient(
		Deno.env.get('SUPABASE_URL')!,
		Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
	)

	// Use service role for admin operations
	const { data, error } = await supabase.from('table').select('*')

	return new Response(JSON.stringify({ data, error }), {
		headers: { 'Content-Type': 'application/json' },
	})
})
```

## Migrations

Place SQL migrations in `supabase/migrations/` with timestamp prefix:

```bash
npx supabase migration new create_profiles_table
```

Always include `alter table ... enable row level security;` in every create table migration.

## Admin client (service-role)

For operations where RLS cannot grant access (Supabase Auth Admin API, middleware):

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'

export function createAdminClient() {
	return createSupabaseClient<Database>(
		env.supabaseUrl,
		env.supabaseServiceRoleKey,
		{ auth: { autoRefreshToken: false, persistSession: false } },
	)
}
```

### When to use `createAdminClient()` vs `createClient()`

| Scenario                                                                           | Client                | Why                                                   |
| ---------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------- |
| Admin Server Component reads                                                       | `createClient()`      | RLS `is_admin()` policy grants full access to admins  |
| Admin layout role check                                                            | `app_metadata.role`   | JWT field — no DB/client needed                       |
| Middleware role-based routing                                                      | `app_metadata.role`   | JWT field — zero DB queries in middleware             |
| Admin Server Action mutations                                                      | `createClient()`      | RLS `is_admin()` policy grants write access to admins |
| Supabase Auth Admin API (`auth.admin.deleteUser()`, `auth.admin.updateUserById()`) | `createAdminClient()` | Auth Admin API requires service-role key              |

**Rules:**

- **Default to `createClient()`.** The `is_admin()` RLS policies handle admin access for all table operations.
- **Role checks for routing use `user.app_metadata.role`** — set at registration by the `handle_new_user()` trigger, synced on role change via `auth.admin.updateUserById()`.
- **Only use `createAdminClient()` for Supabase Auth Admin API calls** (e.g. deleting users, syncing `app_metadata.role` on role change).
- Never import `createAdminClient` in client-side code or `'use client'` components.
- Always authenticate via `createClient()` + `getUser()` first — never skip the auth check.

## RLS admin policies — avoid infinite recursion

Never write admin RLS policies that query `profiles` from within a policy on `profiles` — this causes infinite recursion:

```sql
-- BAD — infinite recursion on profiles table
create policy "Admins have full access to profiles"
  on public.profiles for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- GOOD — use a SECURITY DEFINER function that bypasses RLS
create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
$$;

create policy "Admins have full access to profiles"
  on public.profiles for all
  using (public.is_admin());
```

Use `public.is_admin()` in ALL admin RLS policies — never inline the subquery.

**RLS policy scope**: Make update/delete policies as narrow as the actual use case. If only one role updates a table, restrict the policy to that role — don't grant both participants access. If a Server Action deletes rows on failure (cleanup), ensure a matching RLS delete policy exists.

## Environment variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=     # Server-only, never expose to client
```

Access env vars via `src/lib/env.ts` — never use `process.env.VAR!` with non-null assertions. The env helper throws a clear error if a required variable is missing.

Never use `SUPABASE_SERVICE_ROLE_KEY` in client-side code. It belongs only in:

- `src/lib/supabase/admin.ts` (`createAdminClient`) — used for Auth Admin API calls
- Route Handlers for webhooks
- Edge Functions
