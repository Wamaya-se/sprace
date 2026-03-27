---
name: supabase-patterns
description: >-
  Provides patterns for Supabase integration in Sprace: client setup,
  Row Level Security policies, Edge Functions, type generation, and storage.
  Use when writing database queries, auth logic, RLS policies, or Edge Functions.
---

# Supabase Patterns — Sprace

## Client setup

### Server-side (Server Components, Route Handlers)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Client-side (components with `'use client'`)

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Middleware (auth session refresh)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brand_assets).*)'],
}
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

### Role-based access

```sql
create policy "Admins have full access"
  on any_table for all
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
    )
  );
```

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
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Use service role for admin operations
  const { data, error } = await supabase
    .from('table')
    .select('*')

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

## Environment variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # Server-only, never expose to client
```

Never use `SUPABASE_SERVICE_ROLE_KEY` in client-side code or Server Components. It belongs only in Route Handlers and Edge Functions where admin access is needed.
