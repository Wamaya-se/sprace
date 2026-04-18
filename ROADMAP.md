# Sprace — Roadmap

> Updated: 2026-04-18 (Fas 8a–e) | Format: compact, token-efficient. Update after each session.

## Completed Refactor Sprint — 2026-04-17 ✅

_Full codebase refactor targeting security, structure, performance, design-system
consistency, observability, and test coverage._

### Phase 0 — Tooling

- ESLint + Prettier + Husky + lint-staged + Vitest + GitHub Actions CI

### Phase 1 — Security hardening

- RLS mismatch fixes: new `createServiceClient` wrapper used only for intentional service-role writes (payments, notifications)
- RLS tightening: granular UPDATE policies on `messages` + `reviews`, cleaned up duplicate admin policies, hardened `businesses` admin policy
- Action-auth: ownership checks + rollback paths in `processPayoutForBooking`, `refundPayment`, `createDelivery`
- Hardening: password min-length, HTML escape in emails, email-verification enforced by middleware
- SQL injection: replaced string-interpolated `.or()` filters with `participantOrFilter` + `assertUuid` helper in `src/lib/db/filters.ts`

### Phase 2 — Structure

- `src/lib/queries/*.ts` — read-only loaders split out of `'use server'` action modules (bookings, messages, notifications, deliveries, disputes, reviews, saved-creators, payments, stripe). Action files re-export types for backward compat.
- Shared auth helpers: `requireUser`, `requireAdmin`, `getOptionalUser`, `isAdmin`, `getUserRole` (pure module in `src/lib/auth/roles.ts`)
- `logOut` centralized in `src/lib/actions/auth.ts`
- Action splits: `stripe.ts` → `stripe-connect.ts` + queries; `deliveries.ts` → `delivery-review.ts`
- `createDelivery` now has an all-or-nothing rollback for partial upload failures

### Phase 3 — Performance

- RPC `get_user_conversations_with_last_message` replaces N+1 inbox queries
- RPC `search_creators` (with `pg_trgm` GIN index on `display_name` + `bio`) replaces client-side discover filtering
- `React.cache()` on `getBooking`, `getDisputeForBooking`, `getCreator`, `getCurrentUser` (centralized in `src/lib/auth/session.ts`)
- `Promise.all` on independent fetches in booking detail + marketing pages
- `unstable_cache` + `revalidateTag` on landing stats, creator category pages, creators-for-specialty (invalidated from admin actions)

### Phase 4 — Components & file splits

- New shared primitives in `src/components/shared/`: `PageHeader`, `SectionHeader`, `EmptyState`, `FormAlert`, `Breadcrumbs`, `StatusBadge`
- Files >400 rader splittade: `profile-view.tsx` (→ `sections/*`), `creator-public-profile.tsx` (→ `creator-service-card.tsx`, `social-link.tsx`), `bookings/[id]/page.tsx` (→ `section-wrappers.tsx`), `lib/actions/stripe.ts`, `lib/actions/deliveries.ts`

### Phase 5 — Design system polish

- All `red-*` Tailwind classes → `destructive` semantic tokens
- Removed every `transition-colors` (animate transform/opacity only)
- Raw `<button>` → Shadcn `<Button>` / `<Badge render={...}>` across delivery-form, navbar, creator filters, profile steps

### Phase 5.4 — i18n hygiene

- `metadata.title.template` ("%s — Sprace") in root layout
- Hardcoded `aria-label`s (Breadcrumb / Main navigation / Instagram / TikTok / LinkedIn) moved to `messages/en.json`
- `scripts/check-orphan-i18n-keys.mjs` + `npm run i18n:check`
- Blob-URL `<img>` previews documented with inline `eslint-disable` (next/image rejects blob: URLs)

### Phase 6 — Reliability & observability

- **Rate limiting**: `src/lib/rate-limit.ts` with `auth` / `action` / `webhook` budgets, Upstash Redis, graceful fail-open when env vars missing. Wired into login, register, forgot-password. New `errors.tooManyRequests` i18n key.
- **Sentry**: `@sentry/nextjs` with client/server/edge configs, `instrumentation.ts` (`onRequestError = Sentry.captureRequestError`), `withSentryConfig` in `next.config.ts`. All gated on `NEXT_PUBLIC_SENTRY_DSN`.
- **RUM**: `WebVitalsReporter` in root layout forwards CLS/LCP/FCP/INP/TTFB to Sentry via `next/web-vitals`.
- **Webhook fail-closed**: `src/app/api/stripe/webhooks/route.ts` — idempotency row written only after successful processing, every DB error returns 500 so Stripe retries, top-level try/catch for unhandled errors.

### Phase 7 — Tests

- Pure modules extracted for testability: `src/lib/bookings/state-machine.ts`, `src/lib/auth/roles.ts`, `src/lib/validation/schemas.ts`
- 58 unit tests across 8 suites: fees, env, filters, redirects, validation, state-machine (14), schemas (15), guards (7)
- Integration + E2E tests deliberately deferred — they require dedicated test infra (Supabase test project, Stripe test keys, Playwright) and all the domain logic they would cover is already factored into pure, unit-tested modules

### New env vars (optional, graceful degradation)

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — enables rate limiting
- `NEXT_PUBLIC_SENTRY_DSN` (+ optional `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_ENVIRONMENT`) — enables error tracking + source maps

### Final verification (2026-04-17)

- `npm run typecheck` — clean
- `npm run lint` — 0 errors, 0 warnings
- `npm run test:run` — 58/58 passing
- `npm run i18n:check` — advisory script available

---

## Completed

- Project setup (Next.js 16.2, Tailwind 4, Supabase, Shadcn/UI)
- Design system + tokens (DESIGN.md, globals.css)
- Auth flow (login, register, middleware, session refresh, Google OAuth stub)
- Initial DB schema (profiles, creators, specialties, services, service_media, businesses, RLS, triggers)
- Landing page (hero, creators showcase, how-it-works, CTA, footer)
- Supabase CLI linked, migrations via `db push`
- i18n: next-intl setup, all strings in messages/en.json, NextIntlClientProvider, generateMetadata on all pages
- Skills: frontend-design, supabase-patterns, component-scaffold, i18n-patterns, error-handling, api-patterns, quality-review
- Project docs: TECHSTACK.md, CLAUDE.md, .cursorrules, .cursorignore
- DB migration: markets, creator_markets, creator_status enum, slug, preferred_locale
- Dashboard layout + navigation (sidebar, header, responsive, logout, sub-routes)
- Security audit fixes: open redirect prevention, OAuth redirectTo fixed, Zod validation on all Server Actions, safe error messages, env validation helper (`src/lib/env.ts`), ActionResult pattern enforced
- a11y audit fixes: skip-to-content link, main landmarks, one h1 per page, role="alert" on errors, aria-invalid + aria-describedby, sidebar inert/aria-expanded/Escape/focus-restore, prefers-reduced-motion, decorative SVG aria-hidden, no href="#", heading hierarchy, semantic nav/header/footer
- SEO fixes: generateMetadata on all pages, Open Graph on public pages, sitemap.ts, robots.ts
- Role-based routing: separate (admin) route group, middleware guards, role-aware sidebar/header
- Role-based registration: role picker → creator/business sub-routes, DB trigger reads role from metadata
- Creator onboarding wizard: 4-step form (about, specialties/markets, rates/links, photo/review), atomic server action, avatar upload to Supabase Storage, Zod validation, slug generation, status → pending_review
- New Shadcn components: Textarea, Progress, Badge (customized to design system)
- Dashboard onboarding CTA: conditional banner for creators with incomplete profiles
- Service management: full CRUD (create, edit, delete), media upload (up to 4 images), toggle active/inactive, empty state
- New Shadcn components: Switch, AlertDialog (customized to design system)
- Quality review: fixed non-null assertions, hardcoded aria-labels, dead-code condition, unnecessary `'use client'`
- Rules updated: Switch/AlertDialog in component lists, Shadcn install overwrite caution, aria-label i18n requirement
- Superadmin Panel — Steg 1: Dashboard (real-time stats, pending review queue), User management (list/search/filter, detail view, role change, suspend/activate, delete), Creator review (approve/reject queue)
- Admin data access: RLS `is_admin()` SECURITY DEFINER function + regular `createClient()` for all reads/writes/middleware; `createAdminClient()` only for Auth Admin API (`deleteUser`)
- Button `asChild` support: proper `render` prop translation for base-ui primitives
- Database types: added Relationships + Functions to `supabase.ts` for proper join/update type inference
- NativeSelect component: styled native select matching design system
- Utility consolidation: `formatDate` in `@/lib/utils`
- N+1 query fixes: admin dashboard and creators page use Supabase joins instead of per-row queries
- Rules updated: RLS admin policies (SECURITY DEFINER `is_admin()`), admin client usage, base-ui `render` prop pattern, admin action template
- JWT `app_metadata.role`: role set at registration by trigger, synced on role change via Admin API. Middleware, login, OAuth callback, and layouts read role from JWT — zero DB queries for routing
- Rules updated: JWT role pattern documented in .cursorrules, CLAUDE.md, supabase-patterns, api-patterns
- Quality review passed: security, a11y, i18n, code quality — all green, 0 TS errors, 0 lint errors
- Button `nativeButton={false}` fix: suppress Base UI warning when `asChild` renders non-button elements. Documented in rules + skills.
- Progress `locale="en"` fix: prevent hydration mismatch from server/client locale difference in `aria-valuetext`
- Server Actions body size limit: `experimental.serverActions.bodySizeLimit: '10mb'` in `next.config.ts`
- Supabase Storage hostname: added `*.supabase.co` to `next.config.ts` `images.remotePatterns`
- Profile page: conditional rendering — wizard for `draft` status, ProfileView for completed profiles (with edit mode)
- Admin content management: CRUD for specialties and markets with creator counts, tabs UI, inline add/edit forms, AlertDialog delete confirmation
- Quality review passed: security, a11y (ARIA tabs), i18n (hardcoded strings fixed), code quality — 0 TS errors, 0 lint errors
- Profile page redesign: wizard for first-time setup (draft), inline-editable sections for ongoing edits (about, specialties/markets, rates/links, photo)
- Granular profile edit actions: `updateCreatorAbout`, `updateCreatorSpecialtiesMarkets`, `updateCreatorLinks`, `updateCreatorAvatar` — each with Zod + auth
- Security hardening: services/actions.ts — added UUID validation on `serviceId` and `keepMediaIds` (was `as string` / `as string[]` without validation)
- Business profile: role-aware `/dashboard/profile` page — shows BusinessProfileView for business users, creator flow for creators
- Business profile actions: `updateBusinessInfo` (name, org number, industry), `updateBusinessContact` (website, email) — Zod validated, `requireBusiness()` auth guard
- Business onboarding CTA: dashboard overview shows "Complete your company profile" banner for businesses with incomplete profiles
- BusinessProfileView: inline-editable sections (Company info, Contact & Web) with the same SectionHeader pattern as creator ProfileView
- i18n: business profile strings added to messages/en.json
- Quality review passed: security, a11y, i18n, code quality — 0 TS errors, 0 lint errors
- Platform settings: `platform_settings` key-value table (migration), admin UI with General (name, email, locales) and Links (support, terms, privacy) sections, batch save action with Zod whitelist validation
- Steg 2 completed — Superadmin Panel done
- Public creator profile page (`/creators/[slug]`): hero section with avatar, name, specialties, stats, CTAs; About section; Services grid with cover images; Sidebar with rates, markets, social links. SEO metadata (`generateMetadata` with localized title/description), Open Graph, Twitter Cards, canonical URL, JSON-LD (Person + BreadcrumbList). Loading skeleton. Not-found state. Dynamic sitemap with all active creators. i18n strings in `creatorProfile` namespace.
- Business creator discovery (`/dashboard/discover`): search by name, filter by specialty/market/rate range via URL query params; CreatorCard component with avatar, bio, specialties, stats; CreatorFilters client component with chip toggles and rate inputs; empty state; loading skeleton. Creator detail view (`/dashboard/discover/[slug]`) reuses `CreatorPublicProfile` with compact/backLink props. DashboardHeader title-map updated for discover routes. i18n `discover` namespace.
- Saved/favorite creators: `saved_creators` table with RLS (business can manage own), Server Actions (`saveCreator`/`unsaveCreator` with Zod UUID validation + auth guard), `SaveCreatorButton` client component (heart toggle, optimistic UI), integrated into CreatorCard (icon) + CreatorPublicProfile detail view (button). Dedicated `/dashboard/saved` page with grid view, empty state, loading skeleton. Business sidebar nav updated with heart icon. i18n `savedCreators` namespace.
- Category landing pages: `/creators` index page (all categories with creator counts, JSON-LD CollectionPage + BreadcrumbList), `/creators/category/[slug]` per-specialty page (creator grid sorted by followers, SEO metadata, JSON-LD, breadcrumbs). Loading skeletons for both. Dynamic sitemap updated with category index + all specialty pages. i18n `categories` namespace.
- Bookings & Briefs system: `bookings` table (7-status enum lifecycle: pending→accepted→in_progress→delivered→completed + declined/cancelled), `conversations` table (linked to bookings or standalone DMs), `messages` table (with system messages), all with RLS policies. Server Actions: `createBooking` (Zod validated brief form → booking + conversation + system message), `updateBookingStatus` (role-aware transitions, system messages on status change), `getBookings`/`getBooking` (list + detail with joins). Business dashboard: bookings list with status filter badges, new brief form (title, description, service selection, budget, deadline), booking detail with brief content + meta cards + embedded message thread. Creator dashboard: same bookings list + detail with role-appropriate actions (accept/decline/start/deliver). Booking status actions: `BookingActions` client component with AlertDialog confirmations for destructive actions.
- Messaging system (Supabase Realtime-ready, migration-ready architecture): Server Actions: `sendMessage`, `markAsRead`, `getConversations`, `getMessages`, `startConversation`, `getUnreadCount`. Inbox page (`/dashboard/messages`) with conversation list sorted by last activity, unread badges, relative timestamps. Conversation view (`/dashboard/messages/[id]`) with message thread, date grouping, system message rendering, optimistic send. Message thread embedded in booking detail pages. Unread count badge in sidebar navigation. i18n `bookings` + `messages` namespaces.
- "Contact creator" button wired: `/dashboard/discover/[slug]` "Contact creator" CTA now links to `/dashboard/bookings/new?creatorId=...` brief form. `CreatorPublicProfile` supports injectable `contactButton` prop.
- Bookings & Messaging hardening: fixed business "request revision" bug (server role check + dedicated i18n label), i18n system messages in bookings.ts (all status-change messages via getTranslations), error feedback for BookingActions and MessageThread (optimistic rollback on failure), unique constraint on DM conversation pairs (LEAST/GREATEST index + race-condition handling), N+1 query fix in getConversations (3 batched queries instead of 3N)
- Security hardening: serviceId ownership validation in createBooking (service must belong to selected creator + be active), booking ownership validation in startConversation (both participants must match booking parties), partial failure logging in createBooking (conversation/message failures logged, read path self-heals)
- Error boundaries: `error.tsx` at root + dashboard route group level, i18n error strings in `common` namespace
- Loading skeletons: `bookings/new/loading.tsx`, `messages/[id]/loading.tsx`
- Validation alignment: budget `min={1}` matches Zod `.positive()`, deadline uses `z.string().date()`
- Rules updated: FK ownership validation, HTML↔Zod alignment, multi-step mutations, error boundaries, N+1 avoidance, LEAST/GREATEST unique constraints — documented in .cursorrules, CLAUDE.md, api-patterns, supabase-patterns, error-handling skills
- Shared `Skeleton` component (`src/components/ui/skeleton.tsx`) — reusable `animate-pulse` primitive using design tokens
- Loading skeletons: added `loading.tsx` for dashboard overview, profile, services, settings + all 5 admin pages. Full coverage: 20/29 pages now have loading.tsx (remaining 9 are lightweight auth/marketing/service-edit pages)
- Performance: `React.cache()` on `createClient()` for per-request Supabase client deduplication, Suspense fallback on discover filters
- Stripe Connect payments: escrow model (charge at accept, hold, transfer at completed, refund at cancelled), 15% platform fee, creator Express account onboarding, Stripe Checkout Sessions, webhooks for payment lifecycle
- In-app + email notifications: 14 notification types, Resend email provider, email templates, opt-out support, bell icon with unread badge in dashboard header, full notifications page
- Reviews & ratings: dual-sided (both parties review after completion), 14-day review window, star rating component, public profile reviews with average rating, discover card ratings, reviews dashboard page
- Admin payments overview: payment table with status/amount/fee/payout
- Content Delivery system (Fas 6a): `booking_deliveries` + `delivery_files` tables, `delivery_status` enum, creator file upload with drag+drop, business approve/request revision flow, revision loop with max count, delivery history with file previews, download links, system messages + notifications (`delivery_submitted`, `delivery_approved`), BookingActions simplified
- Fas 6c technical fixes: payment guard on `accepted` transition (requires captured payment), `booking_accepted` notification from webhook (to both business + creator), `stripe_onboarding_required` notification (used when creator lacks Stripe), error boundaries for `(admin)` + `(marketing)` route groups, loading skeleton for reviews page, storage INSERT policy scoped to `{userId}/` path, bucket MIME types updated for deliveries (PDF, ZIP, QuickTime)
- Dispute system (Fas 6b): `disputes` table with `dispute_status` enum (open, under_review, resolved_refund, resolved_release, resolved_partial, dismissed), `disputed` booking status, unique constraint on active disputes per booking, Server Actions (openDispute → system message + notification + booking status change, resolveDispute → admin resolution with refund/payout triggers), booking detail dispute section (open form + history), admin disputes page with filter tabs + resolve UI (AlertDialog + resolution selector + admin note), admin sidebar/header updated, `disputes` i18n namespace
- Auth & GDPR Hardening (Fas 6d): Password reset flow (forgot-password page + email + reset-password page), email verification page with resend button (register redirects to /verify-email), Google OAuth verified end-to-end, self-service account deletion (Stripe + Storage cleanup + admin delete + signOut), data export as JSON (profile, bookings, messages, reviews, notifications), ToS consent checkbox at registration (tos_accepted_at + tos_version columns), Privacy Policy page (/privacy), Terms of Service page (/terms), sitemap updated, `legal` i18n namespace
- Fas 7a complete: Landing creators from DB; social proof (`public_landing_stats()` RPC); testimonials (3 quotes, Card + Avatar); FAQ (7 Q&A, `<details>` accordion, FAQPage JSON-LD); scroll-reveal animations (IntersectionObserver + staggered delays, hero entrance keyframes, `prefers-reduced-motion` respected)
- Fas 7d complete: Sticky navbar (transparent → solid on scroll, client component), mobile hamburger → slide-in drawer (inert when closed, Escape to close, focus restore, body scroll lock), footer redesign (4-column grid: brand + social icons, platform links, company + legal links, newsletter signup form), auth layout max-width fix
- Dark/light mode: `next-themes` + ThemeProvider, CSS variable theming (`:root` light + `.dark` blocks), all `text-white` → `text-foreground`, `bg-black` → `bg-surface-dim`, hardcoded gradient hex → CSS variable tokens, ThemeToggle component (sun/moon/monitor, cycles light→dark→system) in navbar + dashboard + admin headers, light theme palette (white surfaces, dark text, adapted brand accents), i18n for theme labels, DESIGN.md + frontend-design skill updated
- Quality review (dark/light mode): NativeSelect arrow SVG theme-aware (dark/light variants), notification badge text → `text-on-brand`, star rating empty stars contrast fix (`text-muted-foreground/40`), `transition-all` → specific transitions in badge/progress, `.cursorrules` + `CLAUDE.md` updated with theme-aware color rule, quality-review skill updated for dual-theme contrast checks

## Completed Sprint — Superadmin Panel ✅

### Steg 1 — Dashboard + Användare + Granskning ✅

- [x] Admin dashboard med riktiga siffror
- [x] Användarhantering: lista/sök/filter, detaljvy
- [x] Användaråtgärder: ändra roll, suspendera/återaktivera, ta bort
- [x] Creator-granskning: kö, godkänn/avvisa

### Steg 2 — Innehåll + Inställningar ✅

- [x] Innehållshantering: CRUD specialties (kategorier) + markets (marknader), visa antal creators per post
- [x] Plattformsinställningar: `platform_settings`-tabell (key-value), admin-UI (plattformsnamn, kontakt-email, aktiva locales, support/terms/privacy URLs)

## Current Sprint — Fas 2: Discovery ✅

- [x] Public creator profile page (`/creators/[slug]`) with SEO metadata + JSON-LD
- [x] Search & filter (specialty, market, price range) — in business dashboard
- [x] Category landing pages (`/creators` index + `/creators/category/[slug]`) with SEO metadata + JSON-LD
- [x] Saved/favorite creators for businesses (`/dashboard/saved`)

## Current Sprint — Fas 3: Bookings & Messaging ✅

- [x] DB migration: booking_status enum, bookings, conversations, messages tables + RLS
- [x] TypeScript types for new tables
- [x] Booking Server Actions (create, updateStatus, list, get)
- [x] Booking pages (list with filter, new brief, detail)
- [x] Message Server Actions (send, markRead, listConversations, getMessages, startConversation, getUnreadCount)
- [x] Inbox page + conversation view
- [x] Embedded message thread in booking detail
- [x] Unread badge in sidebar nav
- [x] Sidebar + header updated for bookings + messages routes
- [x] "Contact creator" button wired to booking flow
- [x] System messages on booking lifecycle events
- [x] i18n: bookings + messages namespaces
- [x] Quality review: security (Zod on all inputs + status), a11y (heading hierarchy, aria-labels, error feedback), i18n (no hardcoded strings), code quality (NativeSelect, unique keys, locale-aware dates)

## Current Sprint — Fas 4: Betalningar, Notifikationer & Reviews ✅

- [x] DB migration: payments, notifications, reviews tables + payment_status/notification_type enums + booking_status `awaiting_payment` + creators stripe fields + profiles email_notifications
- [x] TypeScript types updated for all new tables/enums/columns
- [x] Stripe setup: `stripe` npm, env vars in `env.ts`, `stripe.ts` server-only client with `getPlatformFeePercent()` + `calculateFees()`
- [x] Creator Stripe Connect onboarding: `createStripeConnectAccount`, `getStripeOnboardingLink`, `/api/stripe/connect-return` route, `StripeConnectBanner` on dashboard overview
- [x] Checkout flow: `createCheckoutSession` action (Stripe Checkout Session with escrow metadata), `/api/stripe/webhooks` route handler (checkout.session.completed → payment captured + booking accepted, checkout.session.expired → revert, account.updated → auto-complete onboarding)
- [x] Booking lifecycle updated: creator "accept" → `awaiting_payment` → business pays via Stripe → webhook sets `accepted`. Status transitions + role permissions updated in `statusTransitions` + `roleAllowedTransitions`
- [x] Payout on completed: `processPayoutForBooking` (Stripe Transfer to creator Connect account), auto-triggered on booking `completed` status
- [x] Refund on cancelled: `refundPayment` (Stripe Refund on payment intent), auto-triggered on booking `cancelled` after payment
- [x] Payment UI: `PaymentCard` in booking detail (status, amount, creator payout, pay-now button), `BookingActions` updated for `awaiting_payment`
- [x] Notification infrastructure: `createNotification()` service (DB insert + optional email), Resend email helper (`sendEmail`, `buildNotificationEmail`), email templates with Sprace branding, opt-out via `profiles.email_notifications`
- [x] Notification triggers: integrated into `createBooking`, `updateBookingStatus` (all transitions), `sendMessage`, webhook (payment received), `createReview`. 14 notification types covering full lifecycle.
- [x] Notification UI: bell icon in dashboard header with unread count badge, `/dashboard/notifications` page with `NotificationList` (mark-as-read, mark-all-read, relative timestamps, click-to-navigate), loading skeleton
- [x] Notification actions: `getNotifications`, `markNotificationRead`, `markAllNotificationsRead`
- [x] Reviews system: `createReview` action (validates completed booking + participant + no duplicate), `getBookingReviews`, `getCreatorReviews`, `getUserReviews`
- [x] Star rating component: `StarRating` — interactive + readonly, configurable size, keyboard accessible
- [x] Review UI in booking detail: `ReviewSection` with review form (star rating + comment), 14-day window, existing review display
- [x] Reviews on public profiles: average rating + review list on `/creators/[slug]`, star rating on `CreatorCard` in discover
- [x] Reviews dashboard page: `/dashboard/reviews` with received + given reviews
- [x] Admin payments page: `/admin/payments` with full payment table (booking, amount, fee, payout, status, date)
- [x] Admin sidebar updated with payments nav item
- [x] Platform fee configurable: `platform_settings.platform_fee_percent` (default 15%), seeded in migration
- [x] i18n: `stripe`, `payments`, `notifications`, `reviews` namespaces + metadata keys + admin keys
- [x] Quality review: security (Zod on all IDs, no `as string`, safe errors, `server-only` on server libs), a11y (heading hierarchy, role="alert", aria-labels via i18n), code quality (0 TS errors, 0 lint errors)

## Fas 4 Quality & Hardening ✅

- [x] Quality review: 14 fixes (webhook hardcoded strings, connect-return auth, non-null assertions, missing auth guard on getPaymentForBooking, hardcoded "Status" label, awaiting_payment filter tab, cancel button mismatch, StripeConnectBanner hasAccount, payment success feedback, star rating aria i18n, review form aria-invalid, email template i18n, payout_sent notification, review timestamps)
- [x] Settings page: notification preferences (email toggle), Stripe account status, recent payouts list
- [x] Pagination: cursor-based "load more" on notifications, server-side page navigation on admin payments
- [x] Notification debounce: 5-minute cooldown on `new_message` notifications to prevent flood
- [x] Webhook idempotency: `stripe_webhook_events` table with PK dedup on `event.id`
- [x] Creator "Waiting for payment" banner: contextual status banners on booking detail for both roles
- [x] Checkout expired notification: business notified when Stripe session expires
- [x] Creator cancellation: added `cancelled` to creator role transitions (was UI-only before)
- [x] Admin SEK amounts i18n'd via `amountFormatted` key

## Fas 5: Realtime ✅

- [x] Migration: `replica identity full` + `supabase_realtime` publication on messages, notifications, conversations
- [x] `useSupabase` hook — singleton browser client for subscriptions
- [x] `useRealtimeMessages` — live incoming messages in conversation view (deduplicates, skips own messages)
- [x] `useRealtimeNotifications` — live unread count on bell icon (increments on INSERT, decrements on read UPDATE)
- [x] `useRealtimeUnreadMessages` — live unread message count in sidebar badge
- [x] `useRealtimeConversations` — auto-refresh inbox when conversations update
- [x] `RealtimeInbox` wrapper component on messages page
- [x] MessageThread uses Realtime — incoming messages appear instantly without refresh
- [x] DashboardHeader bell badge updates live
- [x] Sidebar unread messages badge updates live
- [x] All Realtime subscriptions clean up on unmount

## Fas 6: Content Delivery + Tvisthantering ✅

_Kärnan i plattformens värde — utan detta finns inget att "leverera"._

### 6a. Leveransflöde ✅

- [x] `booking_deliveries` + `delivery_files` tabeller (version, filer, kommentar, status, revision_comment)
- [x] `delivery_status` enum (submitted, approved, revision_requested)
- [x] `revision_count` + `max_revisions` kolumner på bookings
- [x] `default_max_revisions` i platform_settings (default 3)
- [x] RLS: participants can view, creator can submit, business can update (approve/revision)
- [x] Server Actions: `createDelivery` (file upload + status transition), `approveDelivery` (→ completed + payout), `requestRevision` (→ in_progress + revision_count++), `getDeliveries`
- [x] Creator delivery form: file upload (drag+drop, multi-file, image preview), comment, size/type validation
- [x] Business review UI: approve (AlertDialog confirmation → payout), request revision (comment required, max check)
- [x] Delivery history: version list with file previews, revision notes, status badges
- [x] File grid: image previews, video player, download links (approved or creator-owned)
- [x] System messages: delivery submitted, delivery approved, revision requested
- [x] Notifikationer: `delivery_submitted`, `delivery_approved` (nya enum-värden) + reuses `revision_requested`
- [x] BookingActions updated: removed "Mark Delivered" and "Complete/Request Revision" (handled by delivery system)
- [x] i18n: `deliveries` namespace, `bookings` system messages, `notifications` keys
- [x] bodySizeLimit increased to 100mb for file uploads
- [x] Quality review: security (Zod on all IDs, file validation, auth guards), a11y (role="alert", aria-invalid, aria-describedby, keyboard file drop zone), i18n (all strings via translations)

### 6b. Tvisthantering (Dispute Resolution) ✅

- [x] `disputes` tabell med `dispute_status` enum, unique constraint på aktiva tvister per bokning
- [x] `disputed` booking status tillagd i enum + statusTransitions + Zod
- [x] Server Actions: `openDispute` (validering, RLS, system message, notifikation), `resolveDispute` (admin-only, triggers refund/payout), `getDisputes`, `getDisputeForBooking`
- [x] Booking detail: DisputeSection (öppna tvist-formulär + visa historik + admin note)
- [x] Admin: `/admin/disputes` med filterflikar (all/open/resolved), resolve UI (resolution selector + admin note + AlertDialog), loading skeleton
- [x] Admin sidebar + header uppdaterade med disputes nav item
- [x] Notifikationer: `dispute_opened`, `dispute_resolved` (enum-värden + i18n)
- [x] `dispute_auto_escalate_days` seedat i platform_settings (default 7 dagar)
- [x] i18n: `disputes` namespace, `bookings.statusDisputed`, `bookings.systemDisputeOpened/Resolved`, `notifications.disputeOpened/Resolved`

### 6c. Tekniska fixes ✅

- [x] Server-side guard: blockera `accepted` utan captured payment i `updateBookingStatus`
- [x] Skicka `booking_accepted`-notifikation vid lyckad betalning (webhook) — till både business + creator
- [x] `stripe_onboarding_required` implementerad: notifierar creator vid bokning om Stripe ej uppsatt
- [x] Error boundaries: `(admin)/error.tsx`, `(marketing)/error.tsx`
- [x] Loading skeleton: reviews page
- [x] Storage INSERT policy: scopad till `{userId}/` path
- [x] Bucket MIME types: lade till `video/quicktime`, `application/pdf`, `application/zip` för leveranser

## Fas 6d: Auth & GDPR Hardening ✅

_Lagkrav och grundfunktioner som måste finnas innan riktiga användare._

### Auth ✅

- [x] Lösenordsåterställning (forgot password): `/forgot-password` + `/reset-password`, Supabase `resetPasswordForEmail`, success-banner på login
- [x] E-postverifiering: `/verify-email` sida med resend-knapp, register redirectar dit
- [x] Google OAuth verifierad end-to-end (login + ny användare → default creator)

### GDPR-paket ✅

- [x] Radera eget konto (self-service): AlertDialog med DELETE-bekräftelse, Stripe Connect cleanup, Storage cleanup, admin delete
- [x] Dataexport (rätt till portabilitet): JSON-export av profil, bokningar, meddelanden, reviews, notifikationer
- [x] ToS-samtycke vid registrering: checkbox med länkar till /terms + /privacy, `tos_accepted_at` + `tos_version` i profiles
- [x] Integritetspolicy-sida (`/privacy`) med GDPR-korrekt innehåll
- [x] Användarvillkor-sida (`/terms`) med plattformsspecifikt innehåll
- [x] Cookie-consent banner: `CookieConsent`-komponent mountad i root layout. SSR-säker via `useSyncExternalStore` (ingen hydration-mismatch), versionerat localStorage-key (`sprace-cookie-consent` + CONSENT_VERSION), Escape för dismiss, autoFocus på "Got it", `role="region"` + `aria-label`, länk till `/privacy`, i18n-namespace `cookieConsent`. Essential-only budskap (inga tracking-cookies).

### Rapportering & Blockering ✅

- [x] Rapportera profil/innehåll (flagging → admin moderation-kö): `reports`-tabell (`report_target_type`, `report_category`, `report_status` enums) med RLS, `createReport` Server Action (Zod + rate-limit + duplicate-guard), delad `ReportDialog`-komponent på kreatörsprofil (`/creators/[slug]`) och booking-detalj. `reports` i18n-namespace.
- [x] Blockera användare (dölj från discover/kategori/landing): `user_blocks`-tabell med unikt blocker/blocked-par + RLS, `blockUser`/`unblockUser` Server Actions, `BlockCreatorButton` på kreatörsprofil. `search_creators` RPC tar `p_blocked_profile_ids` och filtrerar `profiles.is_suspended = false`. Discover-sidan, kategori-sidan och landing top-creators filtrerar via `getBlockedProfileIds()` + `profile.is_suspended = false`. Blockerad användare kan fortfarande nå kreatörens publika profil (med unblock-knapp).
- [x] Admin moderation-dashboard: `/admin/reports` med filter-tabs (all/pending/reviewing/resolved/dismissed), detalj-kort per rapport, `ReportActions` (start review/resolve/dismiss + suspendera användare). Sidebar-länk, `loading.tsx` skeleton. `moderation` i18n-namespace.
- [x] Suspendering: `profiles.is_suspended/suspended_at/suspended_by/suspension_reason`, `suspendUser`/`unsuspendUser` Server Actions (admin-only, kan inte suspendera admin eller sig själv) som samtidigt sätter `creators.status = 'suspended'` och signerar ut användaren via `auth.admin.signOut`. Notifieringar: `report_resolved` + `account_suspended`. `SuspensionActions` på admin user-detalj. Ny `/suspended` sida + dashboard-layout-guard som redirectar suspenderade användare.
- [x] Pure schema-modul: `src/lib/validation/moderation.ts` (createReportSchema, resolveReportSchema, suspendUserSchema) så schemas är importerbara i både Server Actions och tester. Unit-tester i `tests/unit/moderation-schemas.test.ts` (15 tester).

## Fas 7: Publik frontend (marknadsföringssidor)

_Konvertera besökare till användare — separata flows för kreatörer och företag._

### 7a. Landing page förbättringar

- [x] Riktiga kreatörer istället för mockdata (hämta top-rated från DB)
- [x] Social proof-sektion: antal kreatörer, genomförda bokningar, företagslogotyper (textordmärken + migration `public_landing_stats`)
- [x] Testimonial/success story-sektion (hårdkodade i18n, 3 citat med avatar-initialer, Shadcn Card + Avatar)
- [~] Prissättnings-/avgiftssektion — ej behövd, avgiftsinfo i FAQ istället
- [x] FAQ-sektion (7 frågor/svar, native `<details>` accordion, FAQPage JSON-LD)
- [x] Animationer/mikrointeraktioner: `ScrollReveal` (IntersectionObserver + CSS fade-up), staggered grid items, hero entrance keyframes, `prefers-reduced-motion` respekteras

### 7b. Målgruppsanpassade sidor ✅

- [x] `/for-creators` — Hero, 6 benefits, 5-step flow, earnings ranges, testimonials, CTA. Full SEO (metadata + OG + canonical).
- [x] `/for-businesses` — Hero, social proof, 6 benefits, 5-step flow, value stats (3 days / 100 % / 15 %), CTA. Full SEO.
- [x] `/how-it-works` — Dual-column side-by-side flows (creator + business, 5 steps each), "Built-in protections" grid (escrow, verified creators, disputes, GDPR), CTA. Full SEO.
- [x] `/pricing` — Transparent pricing cards (creators + businesses), interactive ROI calculator (`PricingCalculator` client component reading live `platform_fee_percent` from `platform_settings`, slider 500–100 000 SEK, breakdown into business total / platform fee / creator payout), comparison table (Sprace vs. direct booking), pricing-specific FAQ (5 Q&A), CTA. Full SEO.
- [x] `FAQSection` refactored to accept optional `heading` / `subheading` / `items` / `headingId` props — reused on landing (default landing FAQ) and pricing (custom pricing FAQ)
- [x] Navbar updated: 5-link nav (`/creators`, `/for-creators`, `/for-businesses`, `/how-it-works`, `/pricing`), breakpoint bumped from `md` to `lg` to avoid crowding
- [x] Footer platform section updated with new target pages
- [x] `sitemap.ts` updated with all 4 new marketing routes (priority 0.7–0.8)
- [x] i18n: `forCreators`, `forBusinesses`, `howItWorksPage`, `pricing` namespaces + metadata entries + 3 new `nav` + 2 new `footer` keys
- [x] Quality review: raw `<p>` pills replaced with `Badge` component (how-it-works dual-column + pricing plan cards), `HowTo` JSON-LD added to `/how-it-works`, `FAQPage` JSON-LD added to `/pricing`
- [x] Process hardening: "Definition of Done" added to `.cursorrules` + `CLAUDE.md` making `quality-review` mandatory before a sprint can be marked complete; `quality-review` skill header updated to reflect non-negotiable status
- [x] Verified: `npm run typecheck` clean, `npm run lint` 0/0, `npm run test:run` 58/58 passing

### 7c. Trust & SEO-sidor ✅

- [x] `/about` — Mission, värderingar, berättelse, stats, CTA. Full SEO (metadata + OG + canonical) + Organization + BreadcrumbList JSON-LD.
- [x] `/contact` — Kontaktformulär (namn, email, ämne-enum, meddelande + honeypot), Zod-validerad Server Action `submitContactForm`, rate-limitad (`auth`-budget, IP+email), skickar till `platform_settings.platform_billing_email` via Resend, i18n fel-keys. Kontakt-sidebar (email, adress från `platform_settings`, svarstider). Organization + ContactPage + BreadcrumbList JSON-LD.
- [x] `/terms` + `/privacy` — redan klara (Fas 6d); Organization JSON-LD tillagt.
- [x] Blogg (`/blog` + `/blog/[slug]`) — filsystem-baserad, markdown med frontmatter via `gray-matter` + `marked` (`content/blog/*.md`). `getAllBlogPosts()` / `getBlogPost()` i `src/lib/blog/posts.ts`, `renderMarkdown()` i `render.ts`. Index: kort-grid med cover, taggar, datum, läsminuter. Detalj: artikel med `.prose-sprace` typografi (custom CSS i globals.css), breadcrumb, CTA. `generateStaticParams` från filnamn. Starter-inlägg `welcome-to-sprace.md`. Loading skeleton.
- [x] JSON-LD på alla publika sidor via ny shared `JsonLd`-komponent (`src/components/shared/json-ld.tsx`) + `getOrganizationJsonLd()` i `src/lib/seo/organization.ts` (läser legal-entity från `platform_settings`, inkl. Organization `@id`, address, sameAs, contactPoint, orgnummer/VAT som PropertyValue). Wired into home, about, contact, blog, blog-post, for-creators, for-businesses, how-it-works, pricing, creators (index + category + profile), terms, privacy.
- [x] Sitemap uppdaterad: `/about`, `/contact`, `/blog` + alla blogginlägg via `getAllBlogPosts()`.
- [x] Footer: lade till `/blog`-länk i company-sektionen.
- [x] i18n: `about`, `contactPage`, `blog` namespaces + metadata-keys (aboutTitle/Description, contactTitle/Description, blogTitle/Description) + `footer.blog` + `errors.contactEmailFailed`.
- [x] Verified: `npm run typecheck` clean, `npm run lint` 0/0, `npm run test:run` 86/86 passing.

### 7d. Navigation & UX

- [x] Sticky navbar med scroll-effekt (transparent → solid bg, client component)
- [x] Mobilmeny (hamburger → slide-in drawer, inert/Escape/focus-restore/body-scroll-lock)
- [x] Footer med sitemap-länkar (platform, company, legal), sociala medier (Instagram/TikTok/LinkedIn), nyhetsbrev-signup
- [x] Cookie-consent banner (se Fas 6d)

## Fas 7e: Fakturering & Skatteunderlag

_Lagkrav för svensk marknadsplats som hanterar betalningar._

### Fas 7e.1 (klar)

- [x] Automatiska kvitton till businesses: PDF via `@react-pdf/renderer`, e-post med bifogad PDF direkt efter `checkout.session.completed`. Sekventiella nummer `SPR-R-<år>-<seq>` via `assign_receipt_number` (SECURITY DEFINER, idempotent). On-demand nedladdning via `/api/receipts/[paymentId]` med ägar-/admin-auth.
- [x] Utbetalningsspecifikationer till creators: PDF + e-post efter lyckad Stripe-transfer i `processPayoutForBooking`. Numrering `SPR-P-<år>-<seq>`. Nedladdning via `/api/payout-statements/[paymentId]`.
- [x] Sammanställning per kvartal/år: `/dashboard/earnings` (creator) och `/dashboard/spending` (business) med kvartals-/års-aggregering + CSV-export via `/api/earnings/csv` och `/api/spending/csv` (RFC 4180, BOM, SEK-belopp i major units).
- [x] Admin: export av betalningsdata via `/api/admin/payments/csv` med alla bokföringsrelevanta kolumner (Stripe IDs, org.nummer, nummer).

### Fas 7e.2 (klar)

- [x] DAC7-förberedelse: separat `creator_dac7`-tabell för känslig PII (personnummer AES-256-GCM-krypterat, födelsedatum, adress) + DAC7-fält på `businesses` (VAT, adress, land); formulär i dashboard med obligatorisk status innan checkout/payout.
- [x] Business-verifiering: regex + Luhn-kontroll för svenska org.nummer i `src/lib/validation/se-identifiers.ts` + manuellt admin-verifieringssteg i `/admin/users/[id]` (extern API senare).
- [x] Platform-entitetens egna fält (`Sprace AB` org.nr, adress, VAT) i `platform_settings` (seedade rader `platform_legal_name`, `platform_org_number`, …) istället för konstanter i `src/components/pdf/styles.ts`; PDF-komponenter tar nu entiteten som prop via `getPdfPlatformParty()`.
- [x] `pii_access_log`-tabell + RLS för revisionsspår när admin tittar på personnummer.

## Fas 8: Analytics & Insights

_Ger användarna data som ökar retention._

### 8a. DB-lager ✅

- [x] Migration `20260418120000_analytics_rpcs.sql` med 10 RPCer + en intern bucket-validator
  - Creator: `get_creator_analytics_summary`, `get_creator_revenue_timeseries`, `get_creator_bookings_by_status`
  - Business: `get_business_analytics_summary`, `get_business_spending_timeseries`, `get_business_top_creators`
  - Admin: `get_admin_analytics_summary`, `get_admin_revenue_timeseries`, `get_admin_user_growth_timeseries`, `get_admin_top_categories`
- [x] Säkerhet: alla `SECURITY INVOKER` (creator/business filtreras automatiskt av RLS, admin har explicit `if not public.is_admin() then raise 'forbidden'` överst). Bucket-parameter valideras mot allowlist (day/week/month/quarter/year) — ingen SQL-injection.
- [x] Timeseries-RPCer är gap-fyllda via `generate_series` + `left join` så klienten slipper logik för tomma buckets.
- [x] Föregående period uträknad i alla summary-RPCer för trendpilar (matchad längd, `[start − (end−start), start)`).
- [x] TypeScript types tillagda manuellt i `src/types/supabase.ts` (CLI `gen types` saknar privilege på Supabase-projektet — manuell sync dokumenterad nedan).
- [x] Server-side query-helpers i `src/lib/queries/analytics.ts` (alla wrapped i `React.cache()` för per-request dedup) med exporterade typer för konsumenter.
- [x] Pure helpers i `src/lib/analytics/range.ts`: `resolveAnalyticsRange()` (vecka/månad/kvartal/år/30d/90d/12m → range + default bucket), `trendDelta()` (returnerar `null` när previous=0 så UI kan visa "—" istället för "+∞").
- [x] Unit-tester: `tests/unit/analytics-range.test.ts` (15 tester) — 116/116 totalt grön.
- [x] Verifierat: `npm run typecheck` clean, `npm run lint` 0/0, `npm run test:run` 116/116.

### 8b. Creator dashboard ✅

- [x] Ny sida `/dashboard/analytics` (Server Component) med role-guard (creator → creator-gren).
- [x] 4 KPI-kort med trendpilar: Revenue, New bookings, Completed, Avg rating (reviews-count som sekundärtext).
- [x] `RevenueChart` (area chart, Recharts) med tom-state, k/M-suffix på Y-axel, bucket-aware X-axel.
- [x] `BookingsStatusChart` (bar chart) — översätter status-enum via `analytics.bookingStatus.*`.
- [x] Sidebar + header-item "Analytics" för creator.

### 8c. Business dashboard ✅

- [x] Samma sida `/dashboard/analytics` grenar på `app_metadata.role === 'business'` (en URL, två vyer — sparar sidebar-item).
- [x] 4 KPI-kort: Spending, New bookings, Active bookings (utan trend — nu-tillstånd), Completed.
- [x] Spending-chart återanvänder `RevenueChart` med business-översättningar (`kpiSpending`, `spendingChartTitle`).
- [x] `TopCreatorsTable` (Server Component) — avatar + länk till `dashboard/discover/[slug]`, SEK-format och plural-aware booking-label.
- [x] Sidebar + header-item "Analytics" för business.

### 8d. Admin dashboard ✅

- [x] Ny sida `/admin/analytics` (Server Component) + `loading.tsx` skelett med 8 KPI-slots.
- [x] 8 KPI-kort: GMV, Platform fees, Creator payouts, Refunds, Completed, New users, New creators, New businesses.
- [x] `MultiAreaChart` — generisk flerseriga area chart (money | count) som driver både GMV-chart (GMV / fees / payouts) och User-growth-chart (creators vs businesses). Använder `--chart-1/3/5`-tokens.
- [x] `TopCategoriesTable` — top-10 kategorier med bokningar, completed, GMV.
- [x] Sidebar + header-item "Analytics" för admin (med stapel-ikon) placerad efter "Overview".

### 8e. Datumfilter + diagramkomponenter ✅

- [x] `RangePicker` (Client Component) — pill-knappar denna vecka/månad/kvartal/år/30d/90d/12m, driver URL search param `?range=` via `useRouter` + `useTransition`. Delas av alla tre dashboards.
- [x] `KpiCard` + `TrendBadge` — återanvändbara presentationskomponenter; trendbadge har screen-reader-hint + arrow-direction.
- [x] Recharts installerat som dep, CSS-variabel-baserad palett för dark-mode-parity.

### Verifiering (Fas 8a–e)

- [x] `npm run typecheck`, `npm run lint`, `npm run test:run` — alla gröna (116/116 tester).
- [x] Creator-vy verifierad i browser: KPI:er, revenue-chart, bookings-status-chart, range picker (ex. `?range=this_year`).
- [x] Business-vy verifierad i browser: KPI:er (0 SEK spend, 2 active), spending-chart empty state, top-creators empty state.
- [x] Admin-vy verifierad i browser: 8 KPI:er (4 new users, 1 creator, 2 businesses), user-growth-chart renderar data, GMV-chart empty state, top-categories empty state.
- [x] Quality review genomförd: landmarks + heading-hierarki (layout=h1, page=h2), role-guard både i middleware och sida, i18n 100% för nya strängar (32/32), Shadcn `Avatar`/`Card` används, SQL `security invoker` + RLS, `robots.ts` disallowar `/admin/` (var inte tidigare blockerad).
- [x] A11y: `RangePicker` är `role="group"` med `aria-pressed` + `aria-label`; `MultiAreaChart`/`RevenueChart` har `role="img"` + `aria-label` (total + periodbeskrivning); chart-färger från `--chart-1/3/5`-tokens som justeras för dark mode.

## Fas 9: Campaign Management ✅

_Multi-kreatör-bokningar under ett gemensamt brief. Open-applications-modell + pitch-plus-chat._

- [x] `campaigns` tabell (titel, beskrivning, budget_per_creator, total_budget, deadline, status, slug, specialties/markets junctions)
- [x] `campaign_applications` tabell (pitch, proposed_price, status) + notifikations-enum utökad med 5 nya typer
- [x] Additiva kolumner: `bookings.campaign_id`, `bookings.application_id`, `conversations.application_id` + RLS-policies
- [x] State machines: `campaign_status` (draft → open → closed/cancelled/completed) och `application_status` (pending → shortlisted/accepted/declined/withdrawn) i pure moduler med unit-tester
- [x] Zod-scheman för create/update/apply + slug-generator + 38 unit-tester (totalt 154 passerar)
- [x] Server actions: createCampaign, publishCampaign, closeCampaign, cancelCampaign, applyCampaign, shortlist/accept/decline/withdraw, startApplicationConversation + completeCampaignIfDone
- [x] Business dashboard: `/dashboard/campaigns` lista + `/new` + detalj med Details/Applications/Bookings-tabs + application-detalj med inbyggd chat
- [x] Creator dashboard: campaigns-browse via publika listan + applications-översikt + application-detalj med chat
- [x] Publika sidor: `/campaigns` index + `/campaigns/[slug]` med SEO-metadata, JSON-LD (JobPosting), sitemap-inkludering, apply-form för inloggade creators
- [x] Admin `/admin/campaigns` med status-filter och force-cancel-action
- [x] Sidebars (creator + admin), dashboard/admin-headers, marketing-navbar och footer uppdaterade med campaigns-länkar
- [x] i18n-namespace `campaigns` (~120 nycklar) + systemmeddelanden för alla nya notifikations-typer + metadata-keys
- [x] Quality review: typecheck ✓, lint ✓, test ✓ (154/154), i18n ✓; heading-hierarki (layout=h1, page=h2, sections=h3), RLS på alla nya tabeller, SECURITY INVOKER, Zod-validering, ActionResult-mönster, `h2 → h3`-hierarki korrigerad i detaljsidor.

## Fas 10: Polish & Production-readiness

_Allt som krävs för att skeppa till riktiga användare._

- [ ] Onboarding-guide (tooltip-tour för nya användare)
- [ ] Admin: audit log, broadcast-meddelanden
- [ ] Rate limiting: login, registration, Server Actions (app-nivå, ej bara Supabase)
- [ ] Responsiv polish-pass (alla sidor, alla breakpoints)
- [ ] Performance-pass (lazy loading, image optimization, cache headers, bundle-analys)
- [ ] Monitoring: error tracking (Sentry), uptime, Stripe webhook dashboard
- [ ] Admin JWT role-sync hardening: retry-logik vid `updateUserById`-fel

## Framtida idéer (odesignade)

- Agency support (hantera flera kreatörer under ett konto)
- AI-powered matching (rekommendera kreatörer baserat på brief)
- Automatiserade brief-mallar per kategori
- Creator portfolio-builder (publik "portfolio-sida" utanför plattformen)
- API för tredjepartsintegrationer
- Flerespråksstöd (sv, en, no, da, fi)
- MFA (tvåfaktorsautentisering)

## DB Schema Status

Tables live: profiles (incl. tos_accepted_at, tos_version), creators, specialties, creator_specialties, services, service_media, businesses, markets, creator_markets, platform_settings, saved_creators, bookings (incl. campaign_id, application_id), conversations (incl. application_id), messages, payments, notifications, reviews, stripe_webhook_events, booking_deliveries, delivery_files, disputes, reports, user_blocks, campaigns, campaign_specialties, campaign_markets, campaign_applications
Enums live: user_role, media_type, creator_status, booking_status (incl. awaiting_payment, disputed), payment_status, notification_type (incl. delivery_submitted, delivery_approved, stripe_onboarding_required, dispute_opened, dispute_resolved, campaign_new_application, campaign_application_shortlisted, campaign_application_accepted, campaign_application_declined, campaign_closed), delivery_status, dispute_status, campaign_status, application_status
Storage: `media` bucket — INSERT scoped to `{userId}/` path, MIME types include images, video (mp4/webm/quicktime), PDF, ZIP
Auth flows: email/password login, Google OAuth, password reset (forgot + reset pages), email verification (verify-email + resend), account deletion (self-service)
