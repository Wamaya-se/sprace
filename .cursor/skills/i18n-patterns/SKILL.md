---
name: i18n-patterns
description: >-
  Enforces internationalization patterns using next-intl. Ensures all
  user-facing strings go through the translation system, never hardcoded.
  Use when creating or editing any component that renders text.
---

# i18n Patterns — Sprace

## Golden rule

**Never hardcode user-facing strings in JSX.** Every visible text must come from `messages/{locale}.json` via `next-intl`.

## How to use translations

### Server Components (default)

```tsx
import { getTranslations } from 'next-intl/server'

export default async function HeroSection() {
	const t = await getTranslations('hero')

	return (
		<>
			<h1>{t('title')}</h1>
			<p>{t('subtitle')}</p>
		</>
	)
}
```

### Client Components

Client components use `useTranslations` (not `getTranslations`). They receive messages from the `NextIntlClientProvider` in root layout — already configured.

```tsx
'use client'

import { useTranslations } from 'next-intl'

export function LoginForm() {
	const t = useTranslations('auth')

	return <Button>{t('loginTitle')}</Button>
}
```

### With variables

In the JSON file:

```json
{ "followers": "{count} followers" }
```

In the component:

```tsx
<span>{t('followers', { count: creator.followersCount })}</span>
```

### With rich text (bold, links)

In the JSON file:

```json
{ "terms": "By signing up you agree to our <link>terms</link>" }
```

In the component:

```tsx
<p>
	{t.rich('terms', {
		link: (chunks) => <a href="/terms">{chunks}</a>,
	})}
</p>
```

## Message file structure

All messages live in `messages/{locale}.json`. Structure by feature:

```
messages/
├── en.json    (English — default & fallback)
└── sv.json    (Swedish — added when needed)
```

### Namespace convention

Group keys by page or feature, not by component:

```json
{
	"common": {}, // Shared: nav, buttons, footer, brand name
	"nav": {}, // Navigation links
	"hero": {}, // Landing page hero
	"creators": {}, // Creator listing/profiles
	"howItWorks": {}, // How-it-works section
	"cta": {}, // Call-to-action sections
	"auth": {}, // Login, register, password reset
	"dashboard": {}, // Dashboard pages
	"footer": {}, // Footer content
	"metadata": {} // Page titles and descriptions for SEO
}
```

### Key naming

- **camelCase** for all keys: `loginTitle`, not `login_title` or `login-title`
- **Descriptive**: `emailPlaceholder`, not `placeholder1`
- **Action verbs for buttons**: `createAccount`, `findCreators`, `logIn`

## Adding a new string

1. Add the key to `messages/en.json` in the correct namespace
2. Use `t('key')` in the component
3. If a Swedish file exists, add the translation to `messages/sv.json` too

## Validation error messages and aria-labels

Client-side validation errors **and `aria-label` values** shown to or read by users must use `useTranslations()`:

```tsx
// CORRECT
const t = useTranslations('services')
if (!name.trim()) errors.name = t('nameRequired')
<button aria-label={t('removeImage')}>...</button>

// WRONG — hardcoded English strings
if (!name.trim()) errors.name = 'Name is required.'
<button aria-label="Remove image">...</button>
```

Server-side Zod schema messages (from `z.string().min(1)`) are NOT shown directly to users. The Server Action catches validation failures and returns a safe `ActionResult` error. These internal Zod messages can remain in English.

## What NOT to translate

- Brand names (`Sprace`)
- Technical identifiers
- User-generated content (creator bios, service descriptions) — displayed in original language
- Numbers and dates — use `next-intl` formatters instead:

```tsx
const format = useFormatter()
format.number(1234.5, { style: 'currency', currency: 'SEK' })
format.dateTime(new Date(), { dateStyle: 'medium' })
```

## SEO + i18n (critical)

Every public page must have localized metadata. Never hardcode SEO strings.

### Localized metadata via `generateMetadata`

```tsx
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
	const t = await getTranslations('creators')

	return {
		title: t('meta.title'),
		description: t('meta.description'),
		openGraph: {
			title: t('meta.title'),
			description: t('meta.description'),
		},
	}
}
```

### hreflang tags

When multiple locales are active, include `alternates` in metadata:

```tsx
export async function generateMetadata({ params }) {
	const t = await getTranslations('creators')

	return {
		title: t('meta.title'),
		alternates: {
			languages: {
				en: '/en/creators',
				sv: '/sv/kreatorer',
			},
		},
	}
}
```

### Message file structure for SEO

Every page namespace should include a `meta` section:

```json
{
	"creators": {
		"meta": {
			"title": "Find UGC Creators & Influencers — Sprace",
			"description": "Browse verified creators ready to amplify your brand."
		},
		"heading": "Featured Creators",
		"subtitle": "Discover talented creators..."
	}
}
```

## Database-driven i18n (the slug pattern)

Any system-defined content stored in the database (taxonomy, enums, categories, tags, roles, statuses — now and in the future) uses slugs as identifiers. Display text lives in locale files.

This is a **general pattern** — apply it to all new DB-driven content that needs localization, not just the examples below.

### Pattern: DB slug → locale display text

```
// Database stores the slug:
specialties: { id: 1, slug: 'fashion' }

// messages/en.json:
{ "specialties": { "fashion": "Fashion", "food-health": "Food & Health" } }

// messages/sv.json:
{ "specialties": { "fashion": "Mode", "food-health": "Mat & Hälsa" } }

// Component:
const t = useTranslations('specialties')
<span>{t(specialty.slug)}</span>
```

### When to use this pattern

- **Use slug → locale** for: Any system-defined taxonomy, categorization, tags, enums, statuses, roles, or labels stored in the database that are displayed to users. This includes anything added in future development.
- **Do NOT translate**: User-generated content (profile bios, service descriptions, messages). Display in original language.

### Current examples (not exhaustive)

| DB content                   | Slug example                          | Translated?            |
| ---------------------------- | ------------------------------------- | ---------------------- |
| Specialties                  | `fashion`, `tech`, `food-health`      | Yes — via locale files |
| Service categories           | `ugc-content`, `influencer-marketing` | Yes — via locale files |
| System enums (status, roles) | `pending`, `active`, `admin`          | Yes — for UI display   |
| Creator display names        | —                                     | No — user-generated    |
| Service descriptions         | —                                     | No — user-generated    |

### Localized URL slugs (future)

When adding multiple locales, category/service URLs should be localized:

```
/en/services/ugc-content    → messages/en.json: { "slugs": { "ugc-content": "ugc-content" } }
/sv/tjanster/ugc-innehall   → messages/sv.json: { "slugs": { "ugc-content": "ugc-innehall" } }
```

## Adding a new locale

When ready to add Swedish:

1. Create `messages/sv.json` with the same structure as `en.json`
2. Update `src/i18n/request.ts` to detect locale from URL or headers
3. Add locale routing in middleware
4. Add `hreflang` alternates in `generateMetadata`
5. Translate all DB-driven slugs (specialties, categories) in the new locale file
6. All existing `t('key')` calls will automatically use the new locale

## Server Action error messages

Server Actions return i18n keys from the `errors` namespace instead of hardcoded English:

```tsx
return { success: false, error: 'errors.bookingNotFound' }
```

Client components translate errors via the `useActionError()` hook:

```tsx
import { useActionError } from '@/hooks/use-action-error'

function MyComponent() {
	const te = useActionError()
	// ...
	const result = await someAction(formData)
	if (!result.success) {
		setError(te(result.error))
	}
}
```

New error keys go in `messages/en.json` → `errors` object. The hook strips the `errors.` prefix and translates. Unknown keys pass through as-is.

## Checklist

- [ ] No hardcoded user-facing strings in JSX
- [ ] Server Action errors use `errors.*` i18n keys, not English strings
- [ ] New strings added to `messages/en.json`
- [ ] Correct namespace used
- [ ] Variables use `{name}` syntax, not template literals
- [ ] Dates and numbers use `useFormatter()`, not `.toLocaleString()`
- [ ] Page has `generateMetadata` with localized title/description
- [ ] DB-driven display content (categories, specialties) uses slug → locale pattern
- [ ] Public pages include Open Graph meta from locale files
