---
name: component-scaffold
description: >-
  Scaffolds new React components following Sprace project conventions.
  Use when creating new components, pages, or layouts to ensure consistent
  file structure, naming, and TypeScript patterns.
---

# Component Scaffold — Sprace

## File naming

- **kebab-case** for all files and directories: `creator-card.tsx`, `use-auth.ts`
- **PascalCase** for component exports: `export function CreatorCard()`

## Where to place files

| Type | Path | Example |
|------|------|---------|
| Shadcn/UI primitives | `src/components/ui/` | `button.tsx` |
| Shared app components | `src/components/shared/` | `creator-card.tsx` |
| Feature-specific | `src/components/{feature}/` | `src/components/dashboard/stats-panel.tsx` |
| Pages | `src/app/{route-group}/` | `src/app/(dashboard)/creators/page.tsx` |
| Hooks | `src/hooks/` | `use-creators.ts` |
| Zustand stores | `src/stores/` | `creator-store.ts` |
| Zod validators | `src/validators/` | `creator.ts` |
| TypeScript types | `src/types/` | `creator.ts` |

## Component template

### Server Component (default)

```tsx
import type { ComponentProps } from '@/types/{feature}'

interface CreatorCardProps {
  creator: ComponentProps['creator']
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <div className="bg-surface-container-high rounded-xl p-6">
      <h3 className="font-epilogue text-2xl tracking-tight text-white">
        {creator.displayName}
      </h3>
      <p className="font-manrope text-base leading-relaxed text-white/70">
        {creator.bio}
      </p>
    </div>
  )
}
```

### Client Component (only when needed)

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'motion/react'

interface LikeButtonProps {
  creatorId: string
  initialCount: number
}

export function LikeButton({ creatorId, initialCount }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount)

  function handleClick() {
    setCount((prev) => prev + 1)
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="rounded-full bg-gradient-to-br from-primary to-primary-container px-6 py-2 font-manrope text-sm font-medium text-on-primary"
    >
      {count}
    </motion.button>
  )
}
```

## When to use `'use client'`

Only add the directive when the component needs:
- `useState`, `useReducer`, `useEffect`, `useRef`
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `document`, `localStorage`)
- Motion/animation libraries
- Third-party client-only libraries

If uncertain, start as Server Component. Move to client only when you hit a build error.

## Props pattern

Always define props as an `interface` above the component:

```tsx
interface Props {
  title: string
  description?: string
  isActive: boolean
  onAction: (id: string) => void
  children: React.ReactNode
}
```

Rules:
- Prefix booleans with `is`, `has`, `can`, `should`
- Prefix event handlers with `on` in props, `handle` in implementation
- Use `children: React.ReactNode` for composition
- Make optional props explicit with `?`

## Hook template

```tsx
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCreators(filters?: CreatorFilters) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['creators', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('is_published', true)

      if (error) throw error
      return data
    },
  })
}
```

## Zod validator template

```tsx
import { z } from 'zod'

export const creatorProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  services: z.array(z.object({
    name: z.string(),
    price: z.number().positive(),
    description: z.string().max(200),
  })).min(1),
})

export type CreatorProfile = z.infer<typeof creatorProfileSchema>
```

## Zustand store template

```tsx
import { create } from 'zustand'

interface FilterState {
  category: string | null
  priceRange: [number, number]
  setCategory: (category: string | null) => void
  setPriceRange: (range: [number, number]) => void
  reset: () => void
}

const initialState = {
  category: null,
  priceRange: [0, 10000] as [number, number],
}

export const useFilterStore = create<FilterState>()((set) => ({
  ...initialState,
  setCategory: (category) => set({ category }),
  setPriceRange: (priceRange) => set({ priceRange }),
  reset: () => set(initialState),
}))
```

## Checklist before finishing a component

- [ ] TypeScript interface defined for all props
- [ ] Using design system tokens (not default Tailwind colors)
- [ ] Epilogue for headings, Manrope for body text
- [ ] Interactive elements have hover, focus-visible, and active states
- [ ] Server Component unless client features are required
- [ ] File is kebab-case, export is PascalCase
