# Vite → Astro Migration Process

Step-by-step execution order for migrating a React + Vite SPA to Astro. Each wave builds on the previous. Follow this order to avoid dependency issues.

---

## Wave 1: Prep & Cleanup

**Goal**: Clean build environment, remove stale configs.

### Steps
1. Delete `postcss.config.cjs` (or `.mjs/.js`) — Tailwind 4 uses `@tailwindcss/vite`, not PostCSS
2. Delete `tailwind.config.*` if present — Tailwind 4 uses CSS-first config (`@theme` in CSS)
3. Verify `astro.config.mjs` has `@tailwindcss/vite` in `vite.plugins`
4. Run `pnpm dev` in the Astro project — confirm dev server starts clean
5. Run `pnpm dev` in the Vite project — confirm baseline is accessible

### Verification
```bash
cd astro-project && pnpm dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/  # 200
```

---

## Wave 2: Foundation (Types, Constants, Utils)

**Goal**: Shared code that all components depend on.

### Steps
1. Copy `types/index.ts` — no changes needed (framework-agnostic)
2. Copy `constants/data.ts` — update relative import paths for types
3. Create `lib/utils.ts` with `cn()` utility:
   ```ts
   import { type ClassValue, clsx } from 'clsx';
   import { twMerge } from 'tailwind-merge';
   export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
   ```
4. Verify: `npx astro check` — no type errors

### Key Decisions
- Types are framework-agnostic — copy as-is
- Constants may need import path updates (`../types` → `../types/index`)
- If source has a standalone `consts.ts` with brand colors, consolidate into `constants/data.ts`

---

## Wave 3: Layout Components (PARALLEL — 3 tasks)

**Goal**: Shell components that wrap every page.

### Task A: Navigation.tsx → organisms/Navigation.tsx

| Transform | From | To |
|-----------|------|-----|
| Animation import | `'framer-motion'` | `'motion/react'` |
| React import | `import React from 'react'` | Remove entirely |
| Router Link | `<Link to={...}>` | `<a href={...}>` |
| Active state | `useLocation()` | `currentPath: string` prop |
| Constants | `'../constants/data'` | `'../../constants/data'` |

Active state implementation:
```tsx
const isActive = (href: string) =>
  href === '/' ? currentPath === '/' : currentPath.startsWith(href);
```

### Task B: Footer.tsx → organisms/Footer.tsx

Same transforms minus active state (Footer has no active links). Footer may have zero hooks — keep as React per preference.

### Task C: Wire into Layout.astro

```astro
---
import Navigation from '../components/organisms/Navigation';
import Footer from '../components/organisms/Footer';
const currentPath = Astro.url.pathname;
---
<Navigation currentPath={currentPath} client:load />
<slot />
<Footer client:load />
```

### Verification
- Nav renders with correct active state on each route
- Mobile hamburger opens/closes
- Footer renders with all links

---

## Wave 3 (cont): Card & Interactive Components (PARALLEL)

### Task D: Card Molecules (AthleteCard, ServiceCard)

Standard transforms: motion import, React import removal, Link → a, type import paths.

**ServiceCard special case**: If source has a custom SVG component (e.g. HandshakeIcon), replace with the lucide-react icon if available:
```diff
- function Handshake({ className }) { return <svg>...</svg> }
+ import { Handshake } from 'lucide-react';
```

### Task E: Interactive Organisms (TestimonialSlider, ContactForm)

Standard transforms plus:
- `import React, { useState } from 'react'` → `import { useState } from 'react'`
- `React.FormEvent` → `import type { FormEvent } from 'react'`
- These MUST use `client:load` (stateful, immediate interaction expected)

---

## Wave 4: Pages (PARALLEL — up to 6 tasks)

**Goal**: Create .astro route files wrapping React page components.

### Pattern for Each Page

1. Create `src/components/pages/{Name}Page.tsx`:
   - Copy source page content
   - Apply all standard transforms (motion, Link, React import)
   - Keep inline data arrays inline (don't move to constants)
   - Export as named function component

2. Create `src/pages/{name}.astro`:
   ```astro
   ---
   import Layout from '../layouts/Layout.astro';
   import { NamePage } from '../components/pages/NamePage';
   ---
   <Layout title="Page Title - Site Name">
     <NamePage client:load />
   </Layout>
   ```

### Special Pages

**Contact page (query params)**:
```astro
---
const typeParam = Astro.url.searchParams.get('type');
const validTypes = ['athlete', 'sponsor', 'organisation'];
const initialType = validTypes.includes(typeParam) ? typeParam : 'athlete';
---
<ContactPage initialType={initialType} client:load />
```

Remove `useSearchParams()` and the corresponding `useEffect` from the React component entirely. Accept `initialType` as a prop instead.

**Pages with FAQ accordions, form reveals, download gates**:
- Keep all `useState` hooks
- Keep `AnimatePresence` for show/hide animations
- `client:load` is mandatory (interactions may be above the fold)

---

## Wave 5: QA & Verification

### Build Check
```bash
pnpm build  # Must exit 0
```

### Route Check
```bash
for p in / /services /athletes /sponsors /about /contact; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "http://localhost:4321$p"
done
# All must return 200
```

### Migration Quality Check
```bash
# Must all return 0 matches (comments don't count as imports)
grep -r "from 'react-router-dom'" src/   # 0 actual imports
grep -r "from 'framer-motion'" src/       # 0 actual imports
grep -rn "^import React from" src/        # 0 actual imports
```

### Interactive Verification (Playwright or manual)
- [ ] Mobile hamburger menu opens/closes
- [ ] Nav active state highlights correctly per route
- [ ] Contact form type selector switches conditional fields
- [ ] Contact `?type=sponsor` query param pre-selects sponsor
- [ ] FAQ accordion expands/collapses (one at a time)
- [ ] Download form reveal on button click
- [ ] Testimonial auto-rotation (6s interval)
- [ ] All internal links navigate correctly (no 404s)

---

## Dependency Matrix

```
Wave 1: Prep
  └── Wave 2: Foundation (types, constants, utils)
       └── Wave 3 (parallel):
            ├── Layout (Nav + Footer + Layout.astro)
            ├── Cards (AthleteCard + ServiceCard)
            └── Interactive (TestimonialSlider + ContactForm)
                └── Wave 4 (parallel):
                     ├── Home page
                     ├── Services page
                     ├── Athletes page
                     ├── Sponsors page
                     ├── About page
                     └── Contact page
                          └── Wave 5: QA & Verification
```

## Common Pitfalls (from real migration)

| Pitfall | How to Avoid |
|---------|-------------|
| PostCSS config breaks Tailwind 4 | Delete all postcss.config.* files |
| `import React` causes noUnusedLocals error | Remove default React import everywhere |
| Hash routing remnants (`/#/`) | Search and replace all Link `to` props |
| `useLocation` in non-nav components | Replace with prop-drilling from .astro page |
| Inline data moved to constants | Keep page-specific data inline — it's intentional |
| Custom SVG icons that now exist in lucide | Check lucide changelog for new icons |
| `client:visible` on Navigation | Always use `client:load` for nav — mobile menu needs immediate hydration |
