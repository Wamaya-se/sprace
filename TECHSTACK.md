# Sprace — Tech Stack

> **Senast uppdaterad:** 2026-04-17
> **Status:** Beslutad

---

## Översikt

Sprace är en marketplace-plattform som kopplar ihop influencers/UGC-kreatörer med företag och marknadsförare. Stacken är vald för att vara modern, typsäker, skalbar och snabb att utveckla med.

---

## Frontend

| Teknologi           | Version | Syfte                                                                           |
| ------------------- | ------- | ------------------------------------------------------------------------------- |
| **Next.js**         | 16.2    | React-ramverk med App Router, SSR, SSG, streaming                               |
| **React**           | 19.x    | UI-bibliotek                                                                    |
| **TypeScript**      | 5.x     | Typsäkerhet end-to-end                                                          |
| **Tailwind CSS**    | 4.2     | Utility-first styling, matchar vårt designsystem                                |
| **Shadcn/UI**       | 4.1     | Komponentbibliotek — **alla UI-primitiver**. Varianter anpassade till DESIGN.md |
| **Base UI**         | 1.3     | Tillgängliga headless-primitiver (ersätter Radix där Shadcn använder Base)      |
| **React Hook Form** | 7.72    | Formulärhantering (zero dependencies)                                           |
| **Zod**             | 4.3     | Schemavalidering — delad mellan frontend & backend                              |
| **next-intl**       | 4.8     | Internationalisering — URL-baserad routing, Server Components-stöd              |
| **next-themes**     | 0.4     | Ljust/mörkt läge via CSS-klass                                                  |

> **State management:** RSC + Server Actions + URL query params. Ingen klient-state-lib (Zustand/Redux/TanStack Query) används — läggs tillbaka vid faktiskt behov.
> **Animationer:** Tailwind `transition-[transform,opacity]` + CSS keyframes. Ingen animationsrunt.

### Frontend-principer

- **Server Components som default** — `'use client'` bara när det behövs (event listeners, browser APIs, lokal state)
- **App Router** — layouter, loading states, error boundaries, parallel routes
- **Shadcn/UI som komponentbas** — Alla knappar, inputs, kort, labels, separators, avatarer etc. använder Shadcn-komponenter från `@/components/ui/`. Varianterna är anpassade till DESIGN.md. Lägg aldrig till raw HTML (`<button>`, `<input>` etc.) när en Shadcn-komponent finns. Behöver du ett nytt utseende: lägg till en variant i komponentfilen, overridea inte via `className`.
- **Typografi-alias** — Använd `font-heading` (Epilogue) och `font-sans` (Manrope). Aldrig den verbosa arbitrary font-syntaxen.
- **Mobile-first responsive** — designa för mobil, skala uppåt
- **Streaming & Suspense** — progressiv rendering av influencer-profiler och sökresultat
- **Image Optimization** — Next.js `<Image>` med lazy loading, responsive sizing, WebP

---

## SEO — Hög prioritet

SEO är en kärnprioritet. Sprace är en marketplace — organisk trafik via sökmotorer är avgörande för tillväxt.

### Principer

- **Metadata på alla sidor** — Varje route ska ha unik `title`, `description` och `og:image` via Next.js `generateMetadata`
- **Dynamiska meta-taggar** — Kreatörprofiler, tjänster och kategorier genererar metadata från databasinnehåll
- **Strukturerad data (JSON-LD)** — `Service`, `Person`, `Organization`, `BreadcrumbList` schema.org-markup på relevanta sidor
- **Sitemap & robots.txt** — Automatisk generering via Next.js `sitemap.ts` och `robots.ts`
- **Canonical URLs** — Undvik duplicerat innehåll, särskilt viktigt med flerspråksstöd (`hreflang`)
- **Open Graph & Twitter Cards** — Alla publika sidor ska ha förhandsvisning för sociala medier
- **Core Web Vitals** — LCP < 2.5s, INP < 200ms, CLS < 0.1. Mät via Vercel Analytics
- **Semantisk HTML** — Korrekt heading-hierarki (en h1 per sida), landmarks, sectioning

### SEO + i18n

- `hreflang`-taggar genereras automatiskt för alla språkversioner
- Lokaliserade URL-slugs för tjänster och kategorier (t.ex. `/en/services/ugc-content` vs `/sv/tjanster/ugc-innehall`)
- Metadata (title, description) hämtas från översättningsfiler, aldrig hårdkodat

### SEO + Dynamiskt innehåll

- Kreatörprofiler och tjänster renderas server-side (SSR/SSG) för indexering
- Kategori-sidor fungerar som landningssidor med optimerat innehåll
- Interna länkar mellan relaterade kreatörer, tjänster och kategorier

---

## Tillgänglighet (a11y) — Hög prioritet

Sprace ska vara användbart för alla. Tillgänglighet är inte valfritt — det är ett krav.

### Principer

- **WCAG 2.1 AA** som miniminivå
- **Semantisk HTML** — Korrekt `<nav>`, `<main>`, `<article>`, `<aside>`, `<section>` med ARIA-landmarks
- **Tangentbordsnavigering** — Alla interaktiva element nåbara och användbara med tangentbord. Logisk tab-ordning.
- **Focus management** — Synlig focus-indikator på alla interaktiva element. Skip-to-content-länk.
- **Skärmläsare** — ARIA-attribut där semantisk HTML inte räcker. `aria-label`, `aria-describedby`, `aria-live` för dynamiskt innehåll.
- **Kontrast** — Minst 4.5:1 för normal text, 3:1 för stor text. Testa med verktyg.
- **Formulär** — Associerade `<label>`, tydliga felmeddelanden kopplade till fält via `aria-describedby`, visuell och textuell feedback.
- **Bilder** — Meningsfulla `alt`-attribut. Dekorativa bilder har `alt=""`.
- **Reducerad rörelse** — Respektera `prefers-reduced-motion`. Alla animationer ska kunna stängas av.
- **Responsivt** — Fungerar från 320px uppåt, inget innehåll kräver horisontell scroll.

### Verktyg & testning

- Radix UI (via Shadcn) ger tillgängliga primitiver som grund
- Testa med tangentbord, skärmläsare (VoiceOver), och automatiserade verktyg (axe-core)
- Tillgänglighetskontroll ingår i kodgranskning

---

## Backend

| Teknologi                   | Version                | Syfte                                                  |
| --------------------------- | ---------------------- | ------------------------------------------------------ |
| **Supabase**                | Senaste (cloud-hosted) | Backend-as-a-Service: databas, auth, storage, realtime |
| **PostgreSQL**              | 15+ (via Supabase)     | Relationsdatabas                                       |
| **Supabase Auth**           | Inbyggd                | Autentisering: OAuth, magic links, JWT                 |
| **Supabase Storage**        | Inbyggd                | Fil-/medialagring med CDN                              |
| **Supabase Realtime**       | Inbyggd                | Realtidsuppdateringar, notifikationer                  |
| **Supabase Edge Functions** | Deno runtime           | Serverless affärslogik                                 |
| **Supabase CLI**            | 2.81                   | Lokal utveckling, migrationer, typgenerering           |

### Backend-principer

- **Row Level Security (RLS)** — säkerhet på databasnivå, alla queries filtreras per användare/roll
- **Typgenerering** — `supabase gen types` för att generera TypeScript-typer direkt från databasschema
- **Edge Functions** — för logik som inte kan köras client-side (betalningar, webhooks, externa API-anrop)
- **Connection pooling** — PgBouncer inbyggd i Supabase för hantering av många samtidiga anslutningar

---

## Internationalisering (i18n) — Strategi

> Engelska är default. Fler språk (svenska, etc.) läggs till framöver.

### Principer

- **`next-intl`** hanterar all text-översättning, datum/valuta-formatering och plural-regler
- **URL-baserad locale-routing** — `/en/creators`, `/sv/kreatorer` (implementeras vid tillägg av fler språk)
- **Alla user-facing strings via `messages/{locale}.json`** — aldrig hårdkodade i JSX
- **Server Components-first** — `next-intl` stödjer Server Components utan extra klient-JS

### i18n + SEO (kritiskt)

- `hreflang`-taggar genereras automatiskt per sida för varje aktivt språk
- Metadata (`title`, `description`, `og:title`) hämtas från översättningsfiler
- Lokaliserade URL-slugs: tjänstekategorier, kreatörprofiler, landningssidor
- Sitemap inkluderar alla språkversioner med korrekt `hreflang`

### i18n + Dynamiskt innehåll

Sprace har både statisk UI-text och databasdrivet innehåll. Flerspråksstöd ska vara generellt och täcka allt som behöver lokaliseras — inte bara dagens funktioner utan även framtida tillägg.

**Grundregel:** Om en text visas för användaren och inte är user-generated content, ska den gå genom i18n-systemet.

**Nuvarande och framtida exempel:**

| Innehållstyp                                                                           | Strategi                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **UI-text** (knappar, rubriker, labels, felmeddelanden)                                | Alltid via `messages/{locale}.json`                                |
| **Databasdriven taxonomi** (kategorier, specialiteter, taggar, statusar, roller, etc.) | Slug i DB → display-text i locale-fil                              |
| **SEO-metadata per sida/kategori**                                                     | `generateMetadata` hämtar lokaliserad title/description            |
| **Systemmeddelanden** (notifikationer, bekräftelser, e-post)                           | Lokaliserade mallar, val baserat på användarens `preferred_locale` |
| **User-generated content** (profilbeskrivningar, tjänstetexter)                        | Visas på originalspråk — översätts EJ automatiskt                  |

> **Obs:** Tabellen ovan är exempel, inte en uttömmande lista. Allt nytt innehåll som utvecklas framöver ska följa samma mönster: systemtext via locale-filer, taxonomi via slug-mönstret, UGC på originalspråk.

### Konvention: Databasdriven i18n (slug-mönstret)

Återanvändbart mönster för all taxonomi och systemdata som behöver flerspråksstöd:

```
// Databasen lagrar slug/identifierare:
specialties: { id: 1, slug: 'fashion' }

// Översättningsfilerna lagrar display-text:
// messages/en.json: { "specialties": { "fashion": "Fashion" } }
// messages/sv.json: { "specialties": { "fashion": "Mode" } }

// Komponenten kopplar ihop:
const t = useTranslations('specialties')
<span>{t(specialty.slug)}</span>
```

Samma mönster används för alla framtida typer av kategorisering, taggar, roller och statusar.

---

## Betalningar

| Teknologi  | Version         | Syfte                                                                  |
| ---------- | --------------- | ---------------------------------------------------------------------- |
| **Stripe** | 21.0 (Node SDK) | Betalningar, prenumerationer, Connect (utbetalningar till influencers) |

### Stripe-principer

- **Stripe Connect** — för marketplace-flöden där företag betalar och influencers tar emot
- **Webhooks** — hanteras via Supabase Edge Functions
- **Stripe Elements** — inbäddade betalningsformulär i frontend

---

## Media & Video

| Teknologi            | Syfte                                                           |
| -------------------- | --------------------------------------------------------------- |
| **Supabase Storage** | Primär lagring för bilder och kortare videos                    |
| **Cloudflare R2**    | Kostnadseffektiv objektlagring vid skala (ingen egress-kostnad) |
| **Mux** _(framtida)_ | Video-streaming, transkodning, thumbnail-generering vid behov   |

---

## Deployment & Infrastruktur

| Teknologi          | Syfte                                                          |
| ------------------ | -------------------------------------------------------------- |
| **Vercel**         | Hosting för Next.js — edge network, preview deploys, analytics |
| **Supabase Cloud** | Managed databas, auth, storage, edge functions                 |
| **GitHub**         | Versionskontroll, CI/CD via GitHub Actions                     |

---

## Observability & reliability

| Teknologi                     | Syfte                                                                                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sentry** (`@sentry/nextjs`) | Error tracking (client/server/edge), performance tracing, Session Replay på errors, Web Vitals (RUM) — gated på `NEXT_PUBLIC_SENTRY_DSN`                                   |
| **Upstash Ratelimit + Redis** | IP-scoped rate limiting på auth-actions (login/register/forgot-password). Budgetar: `auth` 10/60s, `action` 60/60s, `webhook` 300/60s. Fail-open utan env vars (lokal dev) |
| **Webhook idempotency**       | `stripe_webhook_events`-tabell; idempotens skrivs efter lyckad bearbetning, 500 på DB-fel så Stripe retry:ar (fail-closed)                                                 |

## Utvecklingsverktyg

| Verktyg                    | Syfte                                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| **ESLint**                 | Linting med Next.js-konfiguration                                      |
| **Prettier**               | Kodformatering (tabs, single quotes, no semi, 80-char, trailing comma) |
| **Husky + lint-staged**    | Pre-commit: prettier + eslint --fix på ändrade filer                   |
| **Vitest**                 | Enhets-/integrationstester                                             |
| **GitHub Actions**         | CI: format-check, lint, typecheck, test, build på PR                   |
| **TypeScript strict mode** | Maximal typsäkerhet                                                    |

### Scripts (package.json)

| Script                   | Syfte                                                                   |
| ------------------------ | ----------------------------------------------------------------------- |
| `npm run dev`            | Next.js dev server                                                      |
| `npm run build`          | Produktionsbygge                                                        |
| `npm run start`          | Produktions-server                                                      |
| `npm run lint`           | ESLint                                                                  |
| `npm run typecheck`      | `tsc --noEmit`                                                          |
| `npm run format`         | Prettier skriv                                                          |
| `npm run format:check`   | Prettier validera (ingen skriv)                                         |
| `npm run test`           | Vitest watch                                                            |
| `npm run test:run`       | Vitest enstaka körning (CI)                                             |
| `npm run supabase:types` | Regenerera `src/types/supabase.ts` från lokal DB                        |
| `npm run i18n:check`     | Advisory: listar potentiellt oanvända i18n-nycklar i `messages/en.json` |

---

## Projektstruktur (planerad)

```
sprace/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/           # Auth-routes (login, register)
│   │   ├── (dashboard)/      # Inloggade vyer
│   │   ├── (marketing)/      # Publika sidor (landing, om oss)
│   │   ├── api/              # API-routes
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Globala stilar + Tailwind
│   ├── components/
│   │   ├── ui/               # Shadcn/UI-komponenter
│   │   ├── shared/           # Delade applikationskomponenter
│   │   ├── dashboard/        # Dashboard-specifika
│   │   └── admin/            # Admin-specifika
│   ├── lib/
│   │   ├── supabase/         # Supabase-klient-wrappers
│   │   ├── actions/          # Domän-Server Actions (mutations)
│   │   ├── queries/          # Läs-helpers (cachade, RSC-importerade)
│   │   ├── auth/             # Guards, redirects, session-helpers
│   │   ├── validation/       # Delade Zod-scheman
│   │   ├── errors/           # Error-mapping → översättningsnycklar
│   │   ├── stripe.ts         # Stripe-klient + fee-logik
│   │   ├── email.ts          # Resend + mallar
│   │   ├── env.ts            # Validerade env-getters
│   │   └── utils.ts          # Allmänna utils
│   ├── hooks/                # Custom React hooks (klient)
│   ├── i18n/                 # next-intl request config
│   ├── types/                # TypeScript-typer (supabase.ts genererad)
│   └── middleware.ts         # Session + rolltolkning
├── tests/
│   └── unit/                 # Vitest enhetstester
├── supabase/
│   ├── migrations/           # SQL-migrationer (chronological)
│   ├── config.toml
│   └── functions/            # Edge Functions (när behov uppstår)
├── messages/                 # next-intl översättningar (en.json etc.)
├── public/                   # Statiska filer
├── brand_assets/             # Logotyper, DESIGN.md
├── .cursor/                  # Cursor rules + skills
├── .husky/                   # Pre-commit hook
├── .github/workflows/        # CI
├── .env.example              # Dokumenterade env-variabler
├── TECHSTACK.md              # (denna fil)
├── CLAUDE.md                 # AI-instruktioner för projektet
└── ROADMAP.md                # Fas-status
```

---

## Skalbarhetsstrategi

### Fas 1 — MVP

- Supabase Free/Pro hanterar databas, auth, storage
- Vercel Hobby/Pro för frontend
- Stripe Test Mode under utveckling

### Fas 2 — Tillväxt (1k–10k användare)

- Supabase Pro med connection pooling
- Cloudflare R2 för medialagring
- Redis (Upstash) för caching av sökresultat och sessioner
- Vercel Edge Functions för geo-routing

### Fas 3 — Skala (10k+ användare)

- Supabase Enterprise med read replicas
- Mux för dedikerad videohantering
- CDN-optimering för media
- Databasindexering och query-optimering
- Eventuell microservice-uppdelning av Edge Functions

---

## Versionshantering

Alla paketversioner ska hållas uppdaterade. Kör regelbundet:

```bash
# Kontrollera föråldrade paket
npm outdated

# Uppdatera med försiktighet
npx npm-check-updates -u
npm install
```

> **Regel:** Uppdatera minor/patch-versioner löpande. Major-versioner utvärderas innan uppgradering med hänsyn till breaking changes.
