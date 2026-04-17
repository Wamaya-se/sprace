---
name: error-handling
description: >-
  Enforces consistent error handling, loading states, empty states, and error
  boundaries across Sprace. Use when building pages, forms, data-fetching
  components, or any flow that can fail.
---

# Error Handling — Sprace

## Golden rule

**Every data-fetching path must account for three states: loading, error, and empty.** Never render a page that silently fails or shows a blank screen.

---

## 1. Server-side errors (Server Components, Server Actions)

### Never expose internal details to the client

```tsx
// BAD — leaks DB structure
if (error) return { error: error.message }

// GOOD — safe, user-friendly
if (error) {
	console.error('[createProfile]', error)
	return { error: 'Something went wrong. Please try again.' }
}
```

### Typed result pattern for Server Actions

All Server Actions return a consistent shape:

```tsx
type ActionResult<T = void> =
	| { success: true; data: T }
	| { success: false; error: string; field?: string }
```

Example:

```tsx
'use server'

export async function updateProfile(formData: FormData): Promise<ActionResult> {
	const supabase = await createClient()

	const parsed = profileSchema.safeParse(Object.fromEntries(formData))
	if (!parsed.success) {
		const firstError = parsed.error.issues[0]
		return {
			success: false,
			error: firstError.message,
			field: firstError.path[0] as string,
		}
	}

	const { error } = await supabase
		.from('profiles')
		.update(parsed.data)
		.eq('user_id', userId)

	if (error) {
		console.error('[updateProfile]', error)
		return { success: false, error: 'Could not update profile.' }
	}

	revalidatePath('/dashboard/profile')
	return { success: true, data: undefined }
}
```

### Sensitive operations — fail closed

For auth, payments, and role checks: deny access on any error, never fail open.

```tsx
const {
	data: { user },
	error,
} = await supabase.auth.getUser()
if (error || !user) {
	redirect('/login')
}
```

---

## 2. Client-side error handling

### Form submissions

Use the `ActionResult` type returned from Server Actions:

```tsx
'use client'

const [error, setError] = useState<string | null>(null)
const [fieldError, setFieldError] = useState<string | null>(null)

async function handleSubmit(formData: FormData) {
	setError(null)
	setFieldError(null)

	const result = await updateProfile(formData)

	if (!result.success) {
		if (result.field) {
			setFieldError(result.field)
		}
		setError(result.error)
	}
}
```

### TanStack Query errors

```tsx
const { data, error, isLoading } = useCreators(filters)

if (isLoading) return <CreatorListSkeleton />
if (error)
	return <ErrorState message="Could not load creators." onRetry={refetch} />
if (!data?.length) return <EmptyState message="No creators found." />
```

### Retry strategy

- Network errors: allow retry (show retry button)
- Validation errors: do NOT retry — show field-level feedback
- Auth errors: redirect to login
- Rate limit errors: show cooldown message

---

## 3. Error boundaries (React)

### Global error boundary

**Already implemented** at `src/app/error.tsx` and `src/app/(dashboard)/error.tsx`. Uses `useTranslations('common')` with keys `errorTitle`, `errorDescription`, `tryAgain`.

Pattern (copy for new route groups):

```tsx
'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function RouteGroupError({ error, reset }: ErrorPageProps) {
	const t = useTranslations('common')

	useEffect(() => {
		console.error('[RouteGroupError]', error)
	}, [error])

	return (
		<main
			id="main-content"
			className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6"
		>
			<h1 className="font-heading text-2xl font-bold tracking-[-0.03em] text-white">
				{t('errorTitle')}
			</h1>
			<p className="max-w-md text-center font-sans text-sm leading-[1.7] text-white/50">
				{t('errorDescription')}
			</p>
			<Button onClick={reset}>{t('tryAgain')}</Button>
		</main>
	)
}
```

### Route-group error boundaries

Add `error.tsx` in route groups that need specialized handling:

```
src/app/(dashboard)/error.tsx     — dashboard-specific errors
src/app/(auth)/error.tsx          — auth-specific errors
src/app/(marketing)/error.tsx     — marketing page errors
```

### Not Found

Add `not-found.tsx` at root and per route group:

```tsx
export default function NotFound() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
			<h1 className="font-heading text-4xl font-bold tracking-[-0.03em] text-white">
				404
			</h1>
			<p className="font-sans text-sm text-white/50">
				This page doesn't exist.
			</p>
		</div>
	)
}
```

---

## 4. Loading states

### Skeleton components over spinners

Never show a blank page while loading. Use skeletons that reflect the expected layout:

```tsx
export function CreatorCardSkeleton() {
	return (
		<div className="animate-pulse rounded-xl bg-surface-container-high p-6">
			<div className="h-48 rounded-lg bg-surface-container-highest" />
			<div className="mt-4 h-5 w-2/3 rounded bg-surface-container-highest" />
			<div className="mt-2 h-4 w-1/3 rounded bg-surface-container-highest" />
		</div>
	)
}
```

### Next.js `loading.tsx` convention

Place `loading.tsx` alongside `page.tsx` for automatic Suspense wrapping:

```
src/app/(dashboard)/creators/loading.tsx
src/app/(dashboard)/creators/page.tsx
```

### Button loading states

Disable the button and show feedback during async operations:

```tsx
<Button disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
```

Rules:

- Always disable during submission to prevent double-clicks
- Change label to indicate progress
- Never remove the button from the DOM during loading

---

## 5. Empty states

When a query returns zero results, show a helpful empty state — never a blank area.

```tsx
interface EmptyStateProps {
	title: string
	description?: string
	action?: {
		label: string
		href: string
	}
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
			<h3 className="font-heading text-lg font-bold tracking-[-0.03em] text-white">
				{title}
			</h3>
			{description && (
				<p className="max-w-sm font-sans text-sm leading-[1.7] text-white/50">
					{description}
				</p>
			)}
			{action && (
				<a href={action.href} className="...">
					{action.label}
				</a>
			)}
		</div>
	)
}
```

---

## 6. Toast notifications (for non-blocking feedback)

Use for transient success/error messages that don't need to block the UI:

- Success: "Profile updated" — auto-dismiss after 3s
- Error: "Could not save changes" — persists until dismissed
- Never use toasts for critical errors — use inline error states instead

Implementation: use Shadcn `toast` (Sonner) when we install it.

---

## Checklist

- [ ] Server Actions return `ActionResult` — never throw to the client
- [ ] Internal errors logged with `console.error('[context]', error)`, not exposed to user
- [ ] Auth/payment failures: fail closed (redirect or deny)
- [ ] Every data-fetching component handles loading, error, and empty states
- [ ] `error.tsx` exists at root level and in key route groups
- [ ] `not-found.tsx` exists at root level
- [ ] `loading.tsx` with skeletons for pages with async data
- [ ] Buttons disabled during async operations
- [ ] Validation errors show field-level feedback, not just generic messages
- [ ] User-facing error/loading text uses `next-intl` translations, not hardcoded strings
- [ ] Form error containers have `role="alert"` and inputs have `aria-invalid` when errored
- [ ] Env vars accessed via `src/lib/env.ts` — never `process.env.VAR!`
