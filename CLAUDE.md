# CLAUDE.md — Project Rules

## Required Reading
Before writing any code, read and follow these project documents:
- **`TECHSTACK.md`** — Decided tech stack, versions, architecture, and project structure. Never deviate from the stack without user approval.
- **`brand_assets/DESIGN.md`** — Design system ("The Luminescent Editorial"). All UI must follow these tokens, typography, and principles.

## Skills (`.cursor/skills/`)
Before writing code, invoke the relevant skill:
- **`frontend-design`** — Before any UI work. Loads design tokens, surface hierarchy, typography, and component rules from DESIGN.md.
- **`supabase-patterns`** — Before any database, auth, storage, or Edge Function work. Contains client setup, RLS patterns, and query conventions.
- **`component-scaffold`** — Before creating new components. Defines file naming, folder structure, TypeScript patterns, and templates.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

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
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive
- Server Components by default — only add `'use client'` when required

## Brand Assets
- Always check the `brand_assets/` folder before designing. It contains a design.md file and other assets.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Design Guardrails
Detailed rules live in the `frontend-design` skill and `brand_assets/DESIGN.md`. Key non-negotiables:
- Never use default Tailwind palette — use design tokens only
- Never use `transition-all` — animate `transform` and `opacity` only
- Every interactive element needs hover, focus-visible, and active states

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass