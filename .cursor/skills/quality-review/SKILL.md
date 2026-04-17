---
name: quality-review
description: >-
  Post-development quality checklist. Run after completing a feature, page, or
  significant refactor. Catches security, a11y, SEO, i18n, and code quality
  issues before they accumulate.
---

# Quality Review — Sprace

## When to invoke

After completing any feature, page, component, or significant code change. This is the final gate before considering work "done".

## Checklist

Work through each section. For every item, check the files you just touched. Fix issues before moving on.

---

### 1. Security

- [ ] **Auth guard**: Every protected route is behind middleware AND layout-level `getUser()` check (not `getSession()`).
- [ ] **Input validation**: All Server Actions validate input with Zod before processing. Never trust `FormData` with `as string` alone.
- [ ] **UUID validation**: Every ID parameter (from FormData or function args) is validated with `z.string().uuid()` before use in queries. This includes entity IDs, relation IDs (e.g. `keepMediaIds`), and foreign keys. Never pass unvalidated IDs to `.eq()`, `.in()`, or `.insert()`.
- [ ] **No `as` casts on FormData**: `formData.get()` returns `FormDataEntryValue | null` — always extract via Zod parse, never `as string`.
- [ ] **Safe error messages**: Server Actions never return raw `error.message` to the client. Map to generic user-facing strings, log details server-side.
- [ ] **ActionResult pattern**: All Server Actions return `ActionResult<T>` from `@/types/actions`. No ad-hoc return shapes.
- [ ] **No open redirects**: Any URL from user input (query params, form data) is validated against an allowlist before redirecting.
- [ ] **OAuth redirectTo**: Points to the app's own callback URL (not Supabase's `/auth/v1/callback`).
- [ ] **Env vars**: No non-null assertions (`!`) on env vars — use `src/lib/env.ts` getters. No secrets in `NEXT_PUBLIC_` vars.

### 2. Accessibility (WCAG 2.1 AA)

- [ ] **One `h1` per page**: Visible on ALL viewport sizes (not hidden behind a breakpoint).
- [ ] **Heading hierarchy**: No skips (h1 → h2 → h3, never h1 → h4). Dashboard/admin pages: the layout header renders `h1`, page content starts at `h2`.
- [ ] **Landmarks**: `<main>`, `<nav>`, `<header>`, `<footer>` used correctly. Every page has a `<main>`.
- [ ] **Skip link**: Root layout has a "Skip to main content" link as first focusable element.
- [ ] **Form errors**: Error containers have `role="alert"` or `aria-live="polite"`. Invalid fields have `aria-invalid` and `aria-describedby`.
- [ ] **Keyboard**: All interactive elements reachable via Tab. Modals/drawers trap focus, close on Escape, restore focus on close.
- [ ] **aria-expanded**: Toggle buttons (hamburger menus, accordions) use `aria-expanded`.
- [ ] **Hidden content**: Off-screen drawers/menus use `inert` or `aria-hidden="true"` when closed so they're not in the tab order.
- [ ] **Decorative SVGs**: `aria-hidden="true"` on icons that are next to text labels.
- [ ] **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables transforms, pulse, and long transitions.
- [ ] **Color contrast**: All text meets 4.5:1 for normal text, 3:1 for large text. Pay attention to `text-foreground/XX` opacity variants — they must meet contrast in BOTH light and dark themes. Use `text-muted-foreground` for secondary text instead of low opacity values.
- [ ] **Links**: No `href="#"` as sole destination. Use a real route or `<button>` with handler.

### 3. SEO

- [ ] **Metadata**: Every `page.tsx` exports `generateMetadata` (or `metadata`) with unique `title` and `description` sourced from locale files.
- [ ] **Open Graph + Twitter Cards**: Public pages include `openGraph` and `twitter` in metadata.
- [ ] **JSON-LD**: Public-facing pages (home, creator profiles, services) include structured data.
- [ ] **Semantic HTML**: One `h1`, logical heading hierarchy, correct landmarks.
- [ ] **Images**: All `<Image>` components have meaningful `alt` text. Decorative images use `alt=""`.
- [ ] **`sitemap.ts` + `robots.ts`**: Exist in `src/app/` and are kept up to date as routes are added.

### 4. Internationalization (i18n)

- [ ] **No hardcoded strings**: All user-facing text uses `useTranslations()` (client) or `getTranslations()` (server) from next-intl. This includes client-side validation error messages and `aria-label` values — not just visible JSX text.
- [ ] **Messages file**: New strings added to `messages/en.json` (and other locale files).
- [ ] **Locale-aware metadata**: `generateMetadata` uses `getTranslations` for title/description.
- [ ] **`lang` attribute**: `<html lang>` matches the active locale.
- [ ] **DB content**: System-defined content uses slug in DB + display text in locale files.
- [ ] **Client components**: Any client component using `useTranslations` is wrapped by `NextIntlClientProvider` (already in root layout — verify it wasn't bypassed).

### 5. Code quality

- [ ] **Shadcn components**: All UI primitives use Shadcn from `@/components/ui/`. No raw `<button>`, `<input>`, `<div>` cards.
- [ ] **No variant overrides via className**: New looks → new variant in the component file. `className` is for layout only.
- [ ] **Typography**: `font-heading` / `font-sans` — never verbose arbitrary syntax.
- [ ] **Design tokens**: No default Tailwind colors. All colors from DESIGN.md tokens.
- [ ] **TypeScript**: No `any`, no unnecessary `as` casts, no non-null assertions on env vars.
- [ ] **ActionResult**: All Server Actions return the standard type.
- [ ] **No unused imports/deps**: Clean up after refactoring.
- [ ] **File naming**: kebab-case files, PascalCase component exports, camelCase functions.

### 6. Config & infrastructure

- [ ] **`next/image` remote patterns**: If new external image sources are used (e.g. Supabase Storage, CDN), verify their hostname is in `next.config.ts` → `images.remotePatterns`. Missing patterns cause runtime errors.
- [ ] **Server Actions body size**: If the feature uploads files via Server Actions, verify `experimental.serverActions.bodySizeLimit` in `next.config.ts` is sufficient (default is 1 MB).
- [ ] **Base UI hydration**: Any Base UI component that uses `Intl.NumberFormat` or locale-dependent formatting must set an explicit `locale` prop to prevent server/client hydration mismatch.
- [ ] **ARIA tabs**: Custom tab UIs must have proper `role="tablist"`, `role="tab"` with `id`, `aria-selected`, `aria-controls`, `tabIndex`; and `role="tabpanel"` with `id` + `aria-labelledby`.

### 7. Lessons learned

- [ ] **New patterns or pitfalls?** Did this session reveal a bug, workaround, or non-obvious solution that could recur? If yes, add a concise rule to the relevant file — only if it's genuinely reusable, not a one-off fix:
  - Security/validation pattern → `.cursorrules` + `CLAUDE.md` Security section + `api-patterns` skill
  - UI/component gotcha → `frontend-design` skill + `CLAUDE.md` Design Guardrails
  - Infra/config issue → quality-review section 6 (Config & infrastructure)
  - New Shadcn component customized → `.cursorrules` + `CLAUDE.md` component lists
- [ ] **Keep it lean.** Each rule should be 1–2 sentences. If you can't explain the lesson in two sentences, it's too specific to be a rule. Don't duplicate — check existing rules first.
- [ ] **Update ROADMAP.md** with completed work and any rules/skills changes.

---

## How to use

1. Read through each section's checkboxes
2. For any ❌, fix immediately
3. If a fix requires architectural discussion (e.g. i18n routing), note it and raise with the user
4. Section 7 (Lessons learned) — reflect on the session and update rules/skills if something new was discovered. Skip if nothing new.
