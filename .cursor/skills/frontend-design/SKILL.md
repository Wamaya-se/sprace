---
name: frontend-design
description: >-
  Enforces the Sprace design system when building UI. Loads color tokens,
  typography rules, surface hierarchy, and component patterns from DESIGN.md.
  Use before writing any frontend component, page, or layout.
---

# Frontend Design — Sprace

## When to invoke

Every time you create or edit a `.tsx` file that renders UI.

## Step 1 — Load the design system

Read `brand_assets/DESIGN.md` and internalize:

| Token group | Key values |
|-------------|------------|
| **Surfaces** | `#0e0e0e` → `#131313` → `#1a1a1a` → `#20201f` → `#262626` |
| **Primary** | `#ff8aa3` (primary), `#ff7294` (primary_container), `#630026` (on_primary) |
| **Secondary** | `#5a2a9c` (secondary_container), `#dec6ff` (on_secondary_container) |
| **Tertiary** | `#81ecff` (focus glow) |
| **Outline** | `#484847` at 20% opacity (Ghost Border) |
| **Fonts** | Epilogue (display/headlines), Manrope (body/labels) |
| **Radii** | `xl` = 0.75rem (containers), `md` = 0.375rem (internal) |

## Step 2 — Check brand assets

Read the `brand_assets/` folder. Use real logos and assets — never placeholder where a real file exists.

## Step 3 — Apply Tailwind config

Map design tokens to Tailwind CSS v4 custom properties in `globals.css`:

```css
@theme {
  --color-surface: #0e0e0e;
  --color-surface-dim: #0e0e0e;
  --color-surface-container-low: #131313;
  --color-surface-container: #1a1a1a;
  --color-surface-container-high: #20201f;
  --color-surface-container-highest: #262626;
  --color-primary: #ff8aa3;
  --color-primary-container: #ff7294;
  --color-on-primary: #630026;
  --color-secondary-container: #5a2a9c;
  --color-on-secondary-container: #dec6ff;
  --color-tertiary: #81ecff;
  --color-outline-variant: #484847;
}
```

## Step 4 — Build with these rules

### Surfaces
- Depth via background color shifts, never borders
- Nesting rule: child must be one surface tier higher than parent
- Glass elements: `backdrop-blur-[24px]` + surface at 70% opacity

### Typography
- Epilogue for all headings, tight letter-spacing (`-0.03em`)
- Manrope for body, generous line-height (`1.7`)
- Maintain large size jumps between heading and body (3.5rem → 1rem)

### Shadows
- Never flat grey shadows
- Ambient only: `40px` blur, `6%` opacity, tinted with surface color

### Borders
- Never `1px solid` to define sections
- Ghost Border for inputs only: `outline_variant` at 20% opacity
- Focus state: border jumps to 100% opacity in `tertiary` (#81ecff)

### Buttons
- Primary: gradient `primary → primary_container` at 135°, `rounded-full`, text `on_primary`
- Secondary: `surface_container_highest` bg, `primary` text
- Action chips: `secondary_container` bg, `on_secondary_container` text

### Spacing
- No divider lines — use spacing tokens instead
- `1rem` between list items, `2.75rem` between major sections
- White space is a luxury — use it generously

### Animation
- Only animate `transform` and `opacity`
- Never `transition-all`
- Use spring-style easing via Motion (framer-motion)

## Step 5 — Verify

After building:

1. Take a screenshot via the browser MCP tool at `http://localhost:3000`
2. Compare against reference image (if provided) or the design system
3. Check: correct surface colors, font pairing, no default Tailwind colors, no hard borders
4. Fix any mismatches
5. Repeat at least once more
