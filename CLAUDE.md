# CLAUDE.md — Project Rules

## Required Reading

At session start, read these documents:

- **`ROADMAP.md`** — Project status, current sprint, what's done and what's next. **Update after completing work.**
- **`TECHSTACK.md`** — Decided tech stack, versions, architecture. Never deviate without user approval.
- **`brand_assets/DESIGN.md`** — Design system. All UI must follow these tokens.

## Token Efficiency

- Keep responses concise. No unnecessary repetition of what was just done.
- When reading project docs, read only the sections you need — not entire files unless necessary.
- ROADMAP.md: read at session start, update at session end. Don't re-read mid-session unless context is unclear.
- Prefer compact diffs over rewriting entire files.
- Don't add verbose comments to code — the code should be self-documenting.
- Skills: invoke only the relevant skill for the current task, not all of them.

## Skills (`.cursor/skills/`)

Before writing code, invoke the relevant skill:

- **`frontend-design`** — Before any UI work. Loads design tokens, surface hierarchy, typography, and component rules from DESIGN.md.
- **`supabase-patterns`** — Before any database, auth, storage, or Edge Function work. Contains client setup, RLS patterns, and query conventions.
- **`component-scaffold`** — Before creating new components. Defines file naming, folder structure, TypeScript patterns, and templates.
- **`i18n-patterns`** — Before writing any user-facing text. All strings must go through next-intl, never hardcoded in JSX.
- **`error-handling`** — Before building any page or flow that fetches data or handles user input. Defines error boundaries, loading/empty states, and the `ActionResult` pattern.
- **`api-patterns`** — Before writing Server Actions, Route Handlers, or data-fetching logic. Covers auth guards, validation, security, caching, and revalidation.
- **`quality-review`** — **Mandatory** after every completed sprint, feature, page, or significant refactor. Checklist covering security, a11y, SEO, i18n, and code quality. See "Definition of Done" below.

## Definition of Done

A sprint, feature, page, or significant refactor is **not done** until every item below is true. This is non-negotiable:

1. `quality-review` skill has been run end-to-end against the files touched in this sprint.
2. Every ❌ from the checklist is fixed (or explicitly surfaced as a blocker for user decision).
3. `npm run typecheck`, `npm run lint`, and `npm run test:run` all pass.
4. `ROADMAP.md` is updated with completed work and any rules/skills changes from section 7 (Lessons learned).

Marking work as "complete" without running the quality review is a process failure. If you notice mid-sprint that a checkpoint was skipped, stop and run it before continuing.

## Reference Images

- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Test Accounts

- Stored outside the repo at `~/.cursor/projects/Users-macbookpro-Desktop-projects-sprace/TEST_ACCOUNTS.md`.
- Read that file when you need credentials to test as Admin, Creator, or Business roles.
- **Never commit credentials** to repo files.

## Local Server

- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `npm run dev` (Next.js dev server at `http://localhost:3000`)
- If the server is already running, do not start a second instance.

## Screenshot Workflow

- Use the browser MCP tool to navigate to `http://localhost:3000` and take screenshots.
- When comparing against a reference, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults

- **Next.js App Router** with TypeScript — follow the structure in `TECHSTACK.md`
- **Tailwind CSS v4** — via `@tailwindcss/postcss`, not CDN (CDN only for standalone prototypes)
- **Shadcn/UI for all UI primitives** — Button, Input, Card, Label, Avatar, Separator, Textarea, Progress, Badge, Switch, AlertDialog, Skeleton etc. Never raw HTML for these. After installing a new Shadcn component (`npx shadcn@latest add <name>`), immediately customize it in `src/components/ui/` to match DESIGN.md before using it — reference `input.tsx` for the established pattern (surface-dim bg, ghost border, tertiary focus glow, theme-aware tokens — never `text-white`/`bg-black`). **Caution:** Shadcn install may overwrite existing customized components — always verify with `git diff` after install and restore any reverted customizations.
- **Typography:** Use `font-heading` (Epilogue) and `font-sans` (Manrope) — never the verbose arbitrary font syntax.
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive
- Server Components by default — only add `'use client'` when required

## Security Standards

- **Env validation:** Use `src/lib/env.ts` getters — never `process.env.VAR!` with non-null assertions. Exception: `src/lib/supabase/client.ts` must use inline `process.env.NEXT_PUBLIC_*!` because Next.js bundler requires static string access for client-side env replacement.
- **Lazy SDK initialization:** Server-only SDK clients (Stripe, Resend, etc.) must use lazy singletons (`getStripe()`, `getResend()`) — never instantiate at module scope. Eager initialization crashes if env vars are missing.
- **Zod validation:** All Server Actions validate input with Zod before processing. Never trust `FormData` with `as string` alone. **Never `as string` on `formData.get()`** — always Zod-parse (`FormDataEntryValue` could be `File`). **All ID params must pass `z.string().uuid()`** before use in `.eq()`, `.in()`, or `.insert()` queries.
- **ActionResult pattern:** All Server Actions return `ActionResult<T>` from `@/types/actions`. No ad-hoc return shapes. Error strings must be i18n keys from the `errors` namespace (e.g. `'errors.bookingNotFound'`), never hardcoded English. Client components translate via `useActionError()` hook from `@/hooks/use-action-error`.
- **Safe error messages:** Never return raw Supabase/DB error messages to client. Log server-side, return generic user-facing strings.
- **File uploads:** Send files as FormData to Server Actions. Validate size + MIME type server-side, upload to Supabase Storage via server client. Storage path: `{user.id}/{purpose}.{ext}`. Never expose Storage credentials to the client.
- **Open redirect prevention:** Validate redirect URLs against an allowlist. Never redirect to user-supplied URLs without validation.
- **OAuth redirectTo:** Must point to the app's own callback URL (`${env.siteUrl}/auth/callback`), not Supabase's `/auth/v1/callback`.
- **Role-based routing:** Always read role from `user.app_metadata.role` (JWT) — never DB queries in middleware, login redirects, or layout guards. Role is set at registration by `handle_new_user()` trigger and synced on role change via `auth.admin.updateUserById()`.
- **Admin reads/writes:** Use the regular `createClient()` (anon key) everywhere — RLS `is_admin()` policies grant full access to admin users. Only use `createAdminClient()` (service-role) for Supabase Auth Admin API calls (`auth.admin.deleteUser()`, `auth.admin.updateUserById()` for role sync). Never import `createAdminClient` in `'use client'` files.
- **Role change sync:** When changing a user's role, update both `profiles.role` (DB source of truth) and `app_metadata.role` (JWT). They must stay in sync.
- **RLS admin policies:** Always use `public.is_admin()` SECURITY DEFINER function. Never inline `select from profiles` subqueries in RLS policies on the `profiles` table — this causes infinite recursion in PostgreSQL.
- **Foreign key ownership validation:** When a mutation accepts a reference ID (e.g. `serviceId`, `bookingId`), verify the referenced row belongs to the expected owner before insert/update. Don't rely on FK constraints alone.
- **HTML ↔ Zod alignment:** HTML input attributes (`min`, `max`, `type`, `pattern`) must match Zod schema constraints exactly. Use `z.string().date()` for date inputs.
- **Multi-step mutations:** When a Server Action performs multiple inserts, log failures for secondary steps but still return success for the primary. Design the read path to self-heal (e.g. create missing conversations on view).
- **Rate limiting:** Auth-sensitive Server Actions (login, register, forgot-password) must call `checkRateLimit('auth', ...)` from `@/lib/rate-limit` with an IP-scoped identifier. Return `errors.tooManyRequests` on rejection. Fail-open locally when Upstash env vars are absent.
- **Webhook fail-closed:** Route handlers for external webhooks (Stripe, etc.) must record idempotency _after_ successful processing, return HTTP 500 on any DB write failure so the sender retries, and wrap the switch in a top-level try/catch.

## Engineering Standards

- **Confirm before coding.** Only start writing code when you are 95% confident that you and the user agree on what to build and the best approach. If there is any ambiguity — about requirements, architecture, trade-offs, or scope — stop and clarify first. It is always cheaper to discuss than to rewrite.
- **`revalidatePath`/`revalidateTag` only in mutations:** Never call during Server Component rendering (`page.tsx`, `layout.tsx`). Only in Server Actions (form handlers) or Route Handlers. Fire-and-forget side effects called during render (e.g. `markAsRead`) must not revalidate.
- **Error boundaries required:** `error.tsx` must exist at root (`src/app/error.tsx`) and at each route group level (`(dashboard)/error.tsx`, `(admin)/error.tsx`). Use `useTranslations('common')` for error text.
- **Avoid N+1 queries:** Never query inside a loop. Batch with `Promise.all` + `.in()` and join results with `Map`. For multi-table aggregates (e.g. inbox with last message + unread count), prefer a `SECURITY INVOKER` RPC over multiple round-trips.
- **No string-interpolated PostgREST subqueries:** Never embed SQL subqueries in `.or()` or `.filter()` strings. Use `participantOrFilter` + `assertUuid` from `@/lib/db/filters`. Fetch related IDs first, then filter with `.eq()`/`.in()`.
- **Unique constraints on pair-based data:** For tables with participant pairs, use a LEAST/GREATEST unique index. Handle `23505` (unique violation) gracefully.
- **Read/write separation:** Read-only query functions live in `src/lib/queries/*.ts` (with `import 'server-only'`). Server Actions in `src/lib/actions/*.ts` are for mutations. Actions may re-export types from queries for client-component compatibility, and may re-export a thin wrapper when a client component needs to call a read.
- **Pure helpers are testable:** Never put pure logic (state machines, Zod schemas, role checks) behind `'use server'` or `'server-only'`. Extract to `src/lib/<domain>/*.ts` and re-import from actions. Tests must be able to run without Supabase/Next runtime.
- **`React.cache()` on dataloaders:** Wrap request-scoped reads (`getBooking`, `getCurrentUser`, etc.) with `cache()` from React so multiple callers within one request dedupe to a single query.
- **`unstable_cache` + `revalidateTag` on public routes:** Public marketing pages must cache expensive reads with a stable cache key + tag. Mutations that affect those reads must call `revalidateTag('tag', 'max')` (Next 16 requires the profile argument).
- **Auth guards before logic:** Every Server Action starts with `requireUser()` / `requireAdmin()` from `@/lib/auth/guards`. Never manually call `supabase.auth.getUser()` inside individual actions — the guards dedupe per-request and enforce the redirect semantics.

## SEO — High Priority

Every page must have proper metadata via `generateMetadata` using `getTranslations`. Public pages must include:

- Unique `title` + `description` from translation files
- Open Graph + Twitter Card meta tags
- JSON-LD structured data where applicable (`Service`, `Person`, `BreadcrumbList`)
- Semantic HTML: one `h1` per page, logical heading hierarchy, landmarks
- `hreflang` tags for all active locales
- `sitemap.ts` + `robots.ts` must exist in `src/app/` and be updated as routes are added

## Accessibility (a11y) — High Priority

- WCAG 2.1 AA as minimum. Every component must be keyboard-navigable and screen-reader friendly.
- Semantic HTML first, ARIA only when semantics are insufficient.
- **Skip-to-content link** in root layout (already implemented).
- **`<main id="main-content">`** on every route group layout.
- **One visible h1 per page** on all viewport sizes. Dashboard/admin pages: the layout header (`DashboardHeader`/`AdminHeader`) renders the `h1` — page content starts at `h2`.
- All interactive elements: visible focus indicator, hover/active states.
- Forms: associated `<label>`, error messages with `role="alert"`, invalid fields with `aria-invalid` and `aria-describedby`.
- Mobile drawers/sidebars: `inert` when closed, `aria-expanded` on toggle, close on Escape, restore focus.
- Decorative SVGs: `aria-hidden="true"` on icons next to text labels.
- Images: meaningful `alt` text, decorative images use `alt=""`.
- Respect `prefers-reduced-motion` (global CSS rule already implemented).
- No `href="#"` as sole destination — use a real route or `<button>`.

## i18n — All Strings via next-intl

- **No hardcoded user-facing strings in JSX or JS logic.** All text via `useTranslations()` (client) or `getTranslations()` (server) from next-intl. This includes client-side validation error messages and `aria-label` values — never hardcode user-facing strings anywhere.
- **`NextIntlClientProvider`** wraps children in root layout — already set up.
- **Messages file:** All strings in `messages/en.json`, organized by namespace.
- **Metadata:** `generateMetadata` uses `getTranslations` for title/description on every page. Root layout defines `metadata.title.template` ("%s — Sprace") so child pages only need to supply the page-specific title.
- **`lang` attribute:** `<html lang>` set dynamically from `getLocale()`.
- **DB content:** System-defined content uses slug in DB + display text in locale files.
- **Orphan keys:** Run `npm run i18n:check` periodically to surface potentially-unused translation keys. Heuristic only — dynamic lookups produce false positives, so review before deleting.

## Brand Assets

- Always check the `brand_assets/` folder before designing. It contains a design.md file and other assets.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Design Guardrails

Detailed rules live in the `frontend-design` skill and `brand_assets/DESIGN.md`. Key non-negotiables:

- **Shadcn/UI first** — All buttons, inputs, cards, labels, separators, avatars etc. must use Shadcn components from `@/components/ui/`. Never write raw `<button>` or `<input>` when a Shadcn component exists.
- **Don't override variant styles** — If a component needs a new look, add a variant to the Shadcn component file. `className` is only for layout (width, margin).
- **Button `asChild` + Base UI:** Our Button wraps `@base-ui/react`. When `asChild` renders a non-`<button>` (e.g. `<Link>`), `nativeButton={false}` is required to suppress the "expected a native `<button>`" warning. Already handled in `button.tsx` — preserve it when editing.
- Never use default Tailwind palette — use design tokens only
- **Theme-aware colors only**: `text-foreground` (not `text-white`), `bg-surface-dim` (not `bg-black`), `text-muted-foreground` (not `text-white/50`). All colors resolve via CSS variables for dark/light mode. `next-themes` with `ThemeProvider` in root layout.
- Never use `transition-all` — animate `transform` and `opacity` only
- Every interactive element needs hover, focus-visible, and active states
- Use `font-heading` / `font-sans` — never the verbose arbitrary font syntax

## Engineering Standards

- **No workarounds.** Solve problems the correct way according to best practices. If a proper solution isn't immediately clear, stop and discuss the options — don't patch around the issue just to make it work. Workarounds accumulate tech debt and mask root causes.
- **Understand before fixing.** Diagnose the root cause of a problem before writing code. A fix that doesn't address the root cause is a workaround.
- **If stuck, say so.** If the correct approach is unclear or blocked, surface it to the user rather than inventing a shortcut. We decide together how to proceed.

## Hard Rules

- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
