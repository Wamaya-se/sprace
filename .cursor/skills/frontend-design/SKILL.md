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

| Token group   | Dark theme                                                           | Light theme                                                          |
| ------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Surfaces**  | `#0e0e0e` → `#131313` → `#1a1a1a` → `#20201f` → `#262626`            | `#fafafa` → `#f5f5f5` → `#f0f0f0` → `#e8e8e8` → `#e0e0e0`            |
| **Primary**   | `#ff8aa3` (brand), `#ff7294` (brand_container), `#630026` (on_brand) | `#e0577a` (brand), `#d94070` (brand_container), `#ffffff` (on_brand) |
| **Secondary** | `#5a2a9c` (secondary_container), `#dec6ff` (on_secondary_container)  | `#ede9fe` (secondary_container), `#5b21b6` (on_secondary_container)  |
| **Tertiary**  | `#81ecff` (focus glow)                                               | `#0891b2` (focus glow)                                               |
| **Outline**   | `#484847` at 20% opacity (Ghost Border)                              | `#d1d5db` (Ghost Border)                                             |
| **Gradients** | `#2a0a1a` → `#0a0a2a`                                                | `#fce4ec` → `#ede9fe`                                                |
| **Fonts**     | Epilogue = `font-heading`, Manrope = `font-sans`                     | Same                                                                 |
| **Radii**     | `xl` = 0.75rem (containers), `md` = 0.375rem (internal)              | Same                                                                 |

**Theme-aware classes:** Always use `text-foreground` (not `text-white`), `bg-surface-dim` (not `bg-black`), `text-muted-foreground` (not `text-white/50`). All tokens resolve to the correct values via CSS variables in `:root` (light) and `.dark` (dark) blocks.

## Step 2 — Check brand assets

Read the `brand_assets/` folder. Use real logos and assets — never placeholder where a real file exists.

## Step 3 — Use Shadcn/UI components

**All UI must be built with Shadcn/UI components.** Never write raw `<button>`, `<input>`, `<div>` cards, or similar when a Shadcn component exists.

### Available components and their Sprace variants

| Component     | Import                         | Key variants                                                                                                                                                                                                                                          |
| ------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`      | `@/components/ui/button`       | `brand` (default), `secondary`, `ghost`, `chip`, `outline`, `destructive`, `link`                                                                                                                                                                     |
| `Input`       | `@/components/ui/input`        | Single style: `bg-surface-dim`, ghost border, tertiary focus glow                                                                                                                                                                                     |
| `Label`       | `@/components/ui/label`        | Single style: `text-foreground/70`, `font-sans`                                                                                                                                                                                                       |
| `Card`        | `@/components/ui/card`         | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`                                                                                                                                                                     |
| `Avatar`      | `@/components/ui/avatar`       | `Avatar`, `AvatarImage`, `AvatarFallback` — sizes: `sm`, `default`, `lg`                                                                                                                                                                              |
| `Textarea`    | `@/components/ui/textarea`     | Single style: black bg, ghost border, tertiary focus glow (matches Input)                                                                                                                                                                             |
| `Progress`    | `@/components/ui/progress`     | Brand gradient indicator, `surface-container-highest` track                                                                                                                                                                                           |
| `Badge`       | `@/components/ui/badge`        | `default` (brand/15), `secondary`, `outline`, `chip` (interactive toggle), `chipActive` (selected toggle)                                                                                                                                             |
| `Switch`      | `@/components/ui/switch`       | Brand-colored when checked, `surface-container-highest` unchecked, tertiary focus ring                                                                                                                                                                |
| `AlertDialog` | `@/components/ui/alert-dialog` | `surface-container-high` bg, blur overlay. Subcomponents: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel` |
| `Separator`   | `@/components/ui/separator`    | Uses `outline-variant/20` — the design system's ghost border                                                                                                                                                                                          |

### Rules

- **Never override variant styles via `className`.** If a button needs a different look, add a new variant to `button.tsx` — don't pile classes on top.
- **Minor layout adjustments are OK** via `className`: width (`w-full`), margin (`mt-2`), etc.
- **Need a new Shadcn component?** Install it via `npx shadcn@latest add <name>`, then **immediately** customize it in `src/components/ui/` to match the design system before using it. The default Shadcn styles do NOT match our design system. Reference `input.tsx` for the established pattern: `bg-surface-dim`, ghost border (`border-outline-variant/20`), tertiary focus glow (`focus-visible:border-tertiary focus-visible:ring-2 focus-visible:ring-tertiary/20`), `font-sans text-sm text-foreground`, design token colors only. **Never use `text-white`, `bg-black`, or hardcoded hex** — always use theme-aware tokens. **Caution:** Shadcn install may silently overwrite existing customized components (e.g. `button.tsx`) — always run `git diff` after install to verify, and restore any reverted customizations.
- **Never use raw HTML** for buttons, inputs, cards, labels, avatars, textareas, badges, or dividers.
- **`asChild` → `render` prop:** Our Shadcn components use `@base-ui/react` primitives, not Radix. Base-UI uses `render` prop instead of `asChild` for element composition. When building compound trigger components (e.g. `AlertDialogTrigger` wrapping a `Button`), use the `render` prop to pass the child element — never nest `<button>` inside `<button>`. See `alert-dialog.tsx` for the pattern.
- **`nativeButton={false}` for non-button renders:** When `Button` is used with `asChild` to render a non-`<button>` element (e.g. `<Link>`), Base UI requires `nativeButton={false}` to suppress the "expected a native `<button>`" console warning. This is already set in the `asChild` branch of `button.tsx` — preserve it when editing.

### Typography shorthand

Use the Tailwind font aliases configured in `globals.css`:

| Role     | Class          | Maps to  |
| -------- | -------------- | -------- |
| Headings | `font-heading` | Epilogue |
| Body/UI  | `font-sans`    | Manrope  |

Never use the verbose arbitrary font syntax — always use the short aliases above.

## Step 4 — Design system rules

### Surfaces

- Depth via background color shifts, never borders
- Nesting rule: child must be one surface tier higher than parent
- Glass elements: `backdrop-blur-[24px]` + surface at 70% opacity

### Typography

- `font-heading` for all headings, tight letter-spacing (`tracking-[-0.03em]`)
- `font-sans` for body, generous line-height (`leading-[1.7]`)
- Maintain large size jumps between heading and body (3.5rem → 1rem)

### Shadows

- Never flat grey shadows
- Ambient only: `40px` blur, `6%` opacity, tinted with surface color

### Borders

- Never `1px solid` to define sections
- Ghost Border for inputs only: `outline_variant` at 20% opacity
- Focus state: border jumps to 100% opacity in `tertiary` (#81ecff)

### Spacing

- No divider lines — use spacing or `<Separator />` component
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
3. Check: correct surface colors, font pairing, no default Tailwind colors, no hard borders, Shadcn components used
4. Fix any mismatches
5. Repeat at least once more
