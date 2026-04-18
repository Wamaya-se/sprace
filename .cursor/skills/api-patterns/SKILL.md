---
name: api-patterns
description: >-
  Defines patterns for Server Actions, Route Handlers, and data fetching in
  Sprace. Covers validation, auth guards, error format, caching, revalidation,
  and security. Use when building any server-side data flow.
---

# API Patterns — Sprace

## Golden rule

**All server-side mutations go through Server Actions. Route Handlers are only for webhooks, external API integrations, and responses that can't be Server Actions (streaming, file downloads).**

---

## 1. Server Actions

### File convention

Place actions alongside the page that uses them:

```
src/app/(dashboard)/profile/
├── page.tsx
├── actions.ts       ← Server Actions for this page
└── loading.tsx
```

For shared actions used across multiple pages:

```
src/lib/actions/
├── auth.ts          ← Auth-related actions
├── creator.ts       ← Creator CRUD actions
└── service.ts       ← Service CRUD actions
```

### Always start with `'use server'`

```tsx
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
```

### Consistent return type

Every Server Action returns `ActionResult`:

```tsx
type ActionResult<T = void> =
	| { success: true; data: T }
	| { success: false; error: string; field?: string }
```

### Complete action template

```tsx
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { serviceSchema } from '@/validators/service'
import type { ActionResult } from '@/types/actions'

export async function createService(
	formData: FormData,
): Promise<ActionResult<{ id: string }>> {
	// 1. Auth guard — fail closed
	const supabase = await createClient()
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	// 2. Validate input — never trust client data
	const raw = Object.fromEntries(formData)
	const parsed = serviceSchema.safeParse(raw)
	if (!parsed.success) {
		return {
			success: false,
			error: 'errors.invalidInput',
			field: parsed.error.issues[0]?.path[0] as string,
		}
	}

	// 3. Authorization check — is user allowed?
	const { data: creator } = await supabase
		.from('creators')
		.select('id')
		.eq('user_id', user.id)
		.single()

	if (!creator) {
		return { success: false, error: 'errors.creatorProfileNotFound' }
	}

	// 4. Mutation
	const { data, error } = await supabase
		.from('services')
		.insert({
			...parsed.data,
			creator_id: creator.id,
		})
		.select('id')
		.single()

	if (error) {
		console.error('[createService]', error)
		return { success: false, error: 'errors.couldNotCreateService' }
	}

	// 5. Revalidate and return
	revalidatePath('/dashboard/services')
	return { success: true, data: { id: data.id } }
}
```

### Security rules for Server Actions

1. **Always authenticate** — call `supabase.auth.getUser()`, never rely on session from cookies alone
2. **Always validate** — parse all input through Zod before using it
3. **Always authorize** — check that the authenticated user has permission for the operation
4. **Never trust client data** — IDs, roles, prices must come from the server, not from hidden form fields
5. **Never expose internals** — log the real error, return a safe message
6. **Fail closed** — on any auth/permission error, redirect or deny. Never fall through.
7. **Error keys, not strings** — `ActionResult.error` must be an i18n key from the `errors` namespace (e.g. `'errors.bookingNotFound'`), not a hardcoded English string. Client components translate via `useActionError()` hook from `@/hooks/use-action-error`. Add new keys to `messages/en.json` → `errors` object.
8. **Validate foreign key ownership** — when a mutation accepts a reference ID (e.g. `serviceId` on a booking), verify the referenced row belongs to the expected owner (e.g. service belongs to selected creator and is active). FK constraints prevent invalid IDs but not wrong-owner IDs.
9. **HTML ↔ Zod alignment** — HTML input attributes (`min`, `max`, `type`) must match Zod constraints. Use `z.string().date()` for date inputs, `z.coerce.number().positive()` with `min={1}` not `min={0}`.
10. **Multi-step mutations** — when an action performs multiple inserts (booking + conversation + message), log secondary failures but return success for the primary. Design the read path to self-heal missing secondary data.
11. **Testable Zod schemas** — `'use server'` files cannot be imported in Vitest (Next.js injects `server-only`). Put reusable Zod schemas under `src/lib/validation/*.ts` and import them into both the Server Action and the test file. Keep the action file focused on orchestration (auth, rate limit, DB).

### Admin action template

Admin actions check role from `app_metadata` (JWT — no DB query) and use `createClient()` for data operations — RLS `is_admin()` policies grant full access:

```tsx
async function requireAdmin() {
	const supabase = await createClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()
	if (error || !user) {
		redirect('/login')
	}

	if (user.app_metadata?.role !== 'admin') {
		redirect('/dashboard')
	}

	return { user, supabase }
}
```

Key rules:

- **Role from JWT** — `user.app_metadata.role` is set at registration and synced on role change. No DB query for role checks.
- **One client for auth + data** — `createClient()` handles both; RLS `is_admin()` grants admin access
- **`createAdminClient()` only for Auth Admin API** — e.g. `auth.admin.deleteUser()` or `auth.admin.updateUserById()` (syncing `app_metadata.role`)
- **Self-protection** — always check `userId !== user.id` before destructive operations
- **Role change sync** — when changing a user's role, update both `profiles.role` (source of truth) and `app_metadata.role` (JWT) via `auth.admin.updateUserById()`

### Redirect pattern

Use `redirect()` for navigation after successful mutations. It throws internally (Next.js convention), so call it outside try/catch:

```tsx
// CORRECT — redirect is called after the try/catch logic
if (!error) {
	redirect('/dashboard')
}

// WRONG — redirect throw is caught by catch block
try {
	redirect('/dashboard')
} catch (e) {
	// This catches the redirect!
}
```

### Role-aware login redirect

After successful authentication, read the role from `app_metadata` (already in the auth response — no DB query needed) and redirect to the correct area:

```tsx
const role = authData.user.app_metadata?.role as string | undefined
redirect(role === 'admin' ? '/admin' : '/dashboard')
```

Same pattern in the OAuth callback route:

```tsx
const {
	data: { user },
} = await supabase.auth.getUser()
const role = user?.app_metadata?.role as string | undefined
const destination = role === 'admin' ? '/admin' : '/dashboard'
```

---

## 2. Route Handlers

### When to use

- Webhooks (Stripe, Supabase, third-party services)
- External API integrations that need specific HTTP methods/headers
- File downloads or streaming responses
- Cron jobs triggered by external services

### File convention

```
src/app/api/
├── webhooks/
│   └── stripe/route.ts
├── auth/
│   └── callback/route.ts
└── export/
    └── creators/route.ts
```

### Webhook template (Stripe example)

```tsx
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
	const body = await request.text()
	const headersList = await headers()
	const signature = headersList.get('stripe-signature')

	if (!signature) {
		return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
	}

	let event: Stripe.Event

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET!,
		)
	} catch (err) {
		console.error('[stripe-webhook] Invalid signature', err)
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
	}

	switch (event.type) {
		case 'checkout.session.completed':
			// Handle payment success
			break
		case 'customer.subscription.deleted':
			// Handle cancellation
			break
		default:
			console.log(`[stripe-webhook] Unhandled event: ${event.type}`)
	}

	return NextResponse.json({ received: true })
}
```

### Security rules for Route Handlers

1. **Verify signatures** on all webhooks — never trust the payload without verification
2. **Use service role** only when needed (admin operations from webhooks)
3. **Rate limiting** — consider Vercel's built-in or implement custom for sensitive endpoints
4. **No sensitive data in URLs** — use POST bodies or headers
5. **Return minimal responses** — webhooks only need `{ received: true }`

---

## 3. Data fetching (reads)

### Server Components — direct queries (preferred)

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function CreatorsPage() {
	const supabase = await createClient()

	const { data: creators, error } = await supabase
		.from('creators')
		.select(
			'id, display_name, avatar_url, specialties:creator_specialties(specialty:specialties(name, slug))',
		)
		.eq('status', 'active')
		.order('created_at', { ascending: false })
		.limit(20)

	if (error) {
		throw new Error('Failed to load creators')
	}

	if (!creators.length) {
		return <EmptyState title="No creators yet" />
	}

	return <CreatorGrid creators={creators} />
}
```

### Client Components — TanStack Query

For data that needs client-side reactivity (filters, pagination, realtime updates):

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCreators(filters: CreatorFilters) {
	const supabase = createClient()

	return useQuery({
		queryKey: ['creators', filters],
		queryFn: async () => {
			let query = supabase
				.from('creators')
				.select('id, display_name, avatar_url')
				.eq('status', 'active')

			if (filters.specialty) {
				query = query.contains('specialties', [filters.specialty])
			}

			const { data, error } = await query
				.order('created_at', { ascending: false })
				.range(filters.offset, filters.offset + filters.limit - 1)

			if (error) throw error
			return data
		},
		staleTime: 60_000,
	})
}
```

### `revalidatePath` / `revalidateTag` — render-safe rule

**Next.js 16 forbids `revalidatePath` and `revalidateTag` during Server Component rendering.** They may only be called inside Server Actions (form handlers) or Route Handlers — never in functions called during `page.tsx` / `layout.tsx` rendering.

If a function is called both during render (data fetching) _and_ from a form action, split it:

- **Getter** (e.g. `getMessages`) — pure data fetch, no revalidation. Safe to call from Server Components.
- **Mutation** (e.g. `sendMessage`) — writes data, calls `revalidatePath` at the end. Only invoked from `action={}` / `useTransition` / form `onSubmit`.

Fire-and-forget side effects (like `markAsRead`) that run during page load must **not** call `revalidatePath`. The page is already rendering fresh data.

### `unstable_cache` + cookie-less Supabase client (Next.js 16 hard rule)

Next.js 16 forbids reading dynamic sources (including `cookies()`) inside any function wrapped by `unstable_cache()`. The regular `createClient()` from `@/lib/supabase/server` binds to the request cookie store and therefore **crashes the build** when called inside a cached scope.

For public, non-personalised reads that need long-lived caching (marketing pages, taxonomy, platform settings), use `createPublicClient()` from `@/lib/supabase/public`:

```tsx
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'

const getCategoriesWithCounts = unstable_cache(
	async () => {
		const supabase = createPublicClient() // no cookies, no session
		const { data } = await supabase.from('specialties').select('*')
		return data ?? []
	},
	['creators-categories'],
	{ revalidate: 300, tags: ['specialties'] },
)
```

Rules:

- Every read inside `unstable_cache` must go through `createPublicClient()` — not `createClient()` / `createServiceClient()` / `createAdminClient()`.
- Only use `createPublicClient()` for data that is equally visible to every visitor (RLS anon policies must permit the reads).
- For user-scoped reads, use `createClient()` from `@/lib/supabase/server` and wrap with `React.cache()` instead — it's per-request dedup, not global caching.
- Invalidate public cache entries from mutations with `revalidateTag('tag', 'max')` (Next 16 requires the profile argument).

### Caching & revalidation strategy

| Data type         | Strategy                                       | Why                                                     |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Creator profiles  | `revalidatePath` on edit                       | Changes are infrequent, freshness on mutation is enough |
| Service listings  | `revalidatePath` on CRUD                       | Same as above                                           |
| Category/taxonomy | Long cache, manual revalidate                  | Rarely changes                                          |
| Dashboard stats   | `staleTime: 30_000` (TanStack Query)           | Near-realtime feel                                      |
| Search results    | `staleTime: 60_000` + refetch on filter change | Balance between freshness and performance               |
| User session      | No cache — always `getUser()`                  | Security-critical, never stale                          |

### Never cache auth checks

```tsx
// CORRECT — always fresh
const {
	data: { user },
} = await supabase.auth.getUser()

// WRONG — could serve stale auth state
const cachedUser = await fetchWithCache('/api/me')
```

---

## 4. Shared types

Define in `src/types/actions.ts`:

```tsx
export type ActionResult<T = void> =
	| { success: true; data: T }
	| { success: false; error: string; field?: string }
```

---

## 5. Input sanitization

### Always validate, always sanitize

```tsx
import { z } from 'zod'

export const serviceSchema = z.object({
	name: z.string().min(1).max(100).trim(),
	description: z.string().max(2000).trim(),
	price: z.coerce.number().positive().max(1_000_000),
})
```

Rules:

- `.trim()` all string inputs
- Set max lengths on every string field
- Use `z.coerce.number()` for form data (comes as strings)
- Never pass raw FormData to Supabase — always parse through Zod first
- **Never `as string` / `as string[]` on FormData values** — always run through Zod. `formData.get()` returns `FormDataEntryValue | null` (could be `File`). Extract via Zod: `z.string().uuid().safeParse(formData.get('id'))`.
- **All ID parameters must be UUID-validated** — any `id` argument (from FormData or function params) must pass `z.string().uuid()` before being used in a query. This applies to entity IDs, relation IDs (e.g. `keepMediaIds`), and foreign keys.

### File upload pattern

File uploads go through Server Actions — never upload directly from the client to Supabase Storage.

**Why:** Keeps Storage credentials on the server. The server action validates the file and controls the upload path.

**Storage path convention:** `{user.id}/{purpose}.{ext}` (e.g. `abc123/avatar.jpg`, `abc123/service-cover.webp`)

```tsx
// Client: send file in FormData
const formData = new FormData()
formData.set('avatar', file)
const result = await saveProfile(formData)

// Server Action: validate + upload
const avatarFile = formData.get('avatar') as File | null

if (avatarFile && avatarFile.size > 0) {
	if (avatarFile.size > MAX_AVATAR_SIZE) {
		return { success: false, error: 'errors.avatarTooLarge', field: 'avatar' }
	}
	if (!ALLOWED_TYPES.includes(avatarFile.type)) {
		return {
			success: false,
			error: 'errors.avatarInvalidType',
			field: 'avatar',
		}
	}

	const ext =
		avatarFile.type.split('/')[1] === 'jpeg'
			? 'jpg'
			: avatarFile.type.split('/')[1]
	const path = `${user.id}/avatar.${ext}`

	const { error } = await supabase.storage
		.from('media')
		.upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })

	if (error) {
		console.error('[saveProfile] upload', error)
		return { success: false, error: 'errors.couldNotUploadAvatar' }
	}

	const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(path)
	// Save publicUrl.publicUrl to the relevant DB column
}
```

### File upload validation constants

```tsx
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
```

---

## Checklist

- [ ] Server Action starts with auth guard (`getUser()`)
- [ ] All input validated through Zod before use — no `as string` on FormData, no unvalidated UUIDs
- [ ] Authorization checked (user has permission for this operation)
- [ ] Returns `ActionResult` — never throws to client
- [ ] Internal errors logged, safe message returned — never expose DB/auth details
- [ ] `revalidatePath`/`revalidateTag` called after mutations — **never during Server Component render**
- [ ] Webhook signatures verified
- [ ] No sensitive data in URLs
- [ ] Auth checks are never cached
- [ ] File uploads validated for size and type
- [ ] Env vars accessed via `src/lib/env.ts` — never `process.env.VAR!`
- [ ] OAuth `redirectTo` uses `${env.siteUrl}/auth/callback` — not `origin`
- [ ] Redirect validation uses allowlist (no open redirects)
