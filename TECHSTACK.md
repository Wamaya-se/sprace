# Sprace — Tech Stack

> **Senast uppdaterad:** 2026-03-27
> **Status:** Beslutad

---

## Översikt

Sprace är en marketplace-plattform som kopplar ihop influencers/UGC-kreatörer med företag och marknadsförare. Stacken är vald för att vara modern, typsäker, skalbar och snabb att utveckla med.

---

## Frontend

| Teknologi | Version | Syfte |
|-----------|---------|-------|
| **Next.js** | 16.2 | React-ramverk med App Router, SSR, SSG, streaming |
| **React** | 19.x | UI-bibliotek |
| **TypeScript** | 5.x | Typsäkerhet end-to-end |
| **Tailwind CSS** | 4.2 | Utility-first styling, matchar vårt designsystem |
| **Shadcn/UI** | 4.1 | Komponentbibliotek (kopieras in, inte dependency) |
| **Radix UI** | unified `radix-ui` | Tillgängliga primitiver (via Shadcn) |
| **Motion** (f.d. Framer Motion) | 12.38 | Animationer — transform + opacity, spring-easing |
| **Zustand** | 5.0 | Lättviktig global state management |
| **TanStack Query** | 5.95 | Server state, caching, datasynkronisering |
| **React Hook Form** | 7.72 | Formulärhantering (zero dependencies) |
| **Zod** | 4.3 | Schemavalidering — delad mellan frontend & backend |

### Frontend-principer

- **Server Components som default** — `'use client'` bara när det behövs (event listeners, browser APIs, lokal state)
- **App Router** — layouter, loading states, error boundaries, parallel routes
- **Mobile-first responsive** — designa för mobil, skala uppåt
- **Streaming & Suspense** — progressiv rendering av influencer-profiler och sökresultat
- **Image Optimization** — Next.js `<Image>` med lazy loading, responsive sizing, WebP

---

## Backend

| Teknologi | Version | Syfte |
|-----------|---------|-------|
| **Supabase** | Senaste (cloud-hosted) | Backend-as-a-Service: databas, auth, storage, realtime |
| **PostgreSQL** | 15+ (via Supabase) | Relationsdatabas |
| **Supabase Auth** | Inbyggd | Autentisering: OAuth, magic links, JWT |
| **Supabase Storage** | Inbyggd | Fil-/medialagring med CDN |
| **Supabase Realtime** | Inbyggd | Realtidsuppdateringar, notifikationer |
| **Supabase Edge Functions** | Deno runtime | Serverless affärslogik |
| **Supabase CLI** | 2.81 | Lokal utveckling, migrationer, typgenerering |

### Backend-principer

- **Row Level Security (RLS)** — säkerhet på databasnivå, alla queries filtreras per användare/roll
- **Typgenerering** — `supabase gen types` för att generera TypeScript-typer direkt från databasschema
- **Edge Functions** — för logik som inte kan köras client-side (betalningar, webhooks, externa API-anrop)
- **Connection pooling** — PgBouncer inbyggd i Supabase för hantering av många samtidiga anslutningar

---

## Betalningar

| Teknologi | Version | Syfte |
|-----------|---------|-------|
| **Stripe** | 21.0 (Node SDK) | Betalningar, prenumerationer, Connect (utbetalningar till influencers) |

### Stripe-principer

- **Stripe Connect** — för marketplace-flöden där företag betalar och influencers tar emot
- **Webhooks** — hanteras via Supabase Edge Functions
- **Stripe Elements** — inbäddade betalningsformulär i frontend

---

## Media & Video

| Teknologi | Syfte |
|-----------|-------|
| **Supabase Storage** | Primär lagring för bilder och kortare videos |
| **Cloudflare R2** | Kostnadseffektiv objektlagring vid skala (ingen egress-kostnad) |
| **Mux** *(framtida)* | Video-streaming, transkodning, thumbnail-generering vid behov |

---

## Deployment & Infrastruktur

| Teknologi | Syfte |
|-----------|-------|
| **Vercel** | Hosting för Next.js — edge network, preview deploys, analytics |
| **Supabase Cloud** | Managed databas, auth, storage, edge functions |
| **GitHub** | Versionskontroll, CI/CD via GitHub Actions |

---

## Utvecklingsverktyg

| Verktyg | Syfte |
|---------|-------|
| **ESLint** | Linting med Next.js-konfiguration |
| **Prettier** | Kodformatering |
| **Husky + lint-staged** | Pre-commit hooks |
| **TypeScript strict mode** | Maximal typsäkerhet |

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
│   │   └── shared/           # Delade applikationskomponenter
│   ├── lib/
│   │   ├── supabase/         # Supabase-klient, helpers
│   │   ├── stripe/           # Stripe-integration
│   │   └── utils.ts          # Utility-funktioner
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # Zustand stores
│   ├── types/                # TypeScript-typer & interfaces
│   └── validators/           # Zod-scheman
├── supabase/
│   ├── migrations/           # SQL-migrationer
│   ├── functions/            # Edge Functions
│   └── seed.sql              # Testdata
├── public/                   # Statiska filer
├── brand_assets/             # Logotyper, designfiler
├── TECHSTACK.md              # (denna fil)
├── CLAUDE.md                 # AI-instruktioner för projektet
└── brand_assets/DESIGN.md    # Designsystem
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
