---
name: vite-to-astro
description: Migrate React + Vite SPAs to Astro with file-based routing and React component islands. Covers routing, animation libraries, Tailwind upgrades, SSR patterns, and View Transitions. Use when converting any React SPA to Astro.
---

# Vite SPA → Astro Migration

Migrate React + Vite single-page applications to Astro 5 with file-based routing, React islands architecture, and server-side rendering. Preserves all React components and interactivity while gaining Astro's routing, SSR, and performance benefits.

## When to Use This Skill

- Converting a React + Vite SPA to Astro
- Converting a React Router app to Astro file-based routing
- Migrating framer-motion to motion/react
- Setting up React islands in Astro
- Upgrading Tailwind CSS 3 → 4 during migration
- Replacing client-side URL handling with Astro SSR patterns

## Architecture Pattern

```
BEFORE (SPA):
  index.html → React Router → <Page /> (client-side)

AFTER (Astro):
  page.astro → server HTML → <ReactComponent client:load /> (islands)
```

Each Astro page is a thin server-rendered wrapper. React components hydrate as interactive islands.

## Project Structure

```
src/
├── components/
│   ├── molecules/        # Cards, small interactive units
│   ├── organisms/        # Nav, Footer, forms, sliders
│   └── pages/            # Full page React components
├── constants/            # Shared data
├── layouts/
│   └── Layout.astro      # Shell: Nav + <slot /> + Footer
├── lib/
│   └── utils.ts          # cn() utility
├── pages/                # Astro file-based routes (*.astro)
├── styles/
└── types/
```

### Why components/pages/ + pages/*.astro?

When a page is heavily animated (many `motion.div` wrappers), splitting into micro-islands creates more complexity than it solves. Keep the full page as one React component with `client:load`, wrapped by a thin `.astro` file:

```astro
---
import Layout from '../layouts/Layout.astro';
import { HomePage } from '../components/pages/HomePage';
---
<Layout title="Home">
  <HomePage client:load />
</Layout>
```

Only split into islands when a page has clearly separable static and interactive sections.

## Migration Transforms

### 1. Animation Library

```diff
- import { motion, AnimatePresence } from 'framer-motion';
+ import { motion, AnimatePresence } from 'motion/react';
```

The `motion` package (v12+) is the framer-motion successor. API is identical — only the import path changes. All animation props (`initial`, `animate`, `whileInView`, `exit`, `transition`) are unchanged.

### 2. Router → Native Links

Remove react-router-dom entirely. Astro uses file-based routing with real page navigations.

```diff
- import { Link } from 'react-router-dom';
- <Link to="/services">Services</Link>
+ <a href="/services">Services</a>
```

### 3. Active Nav State

Replace `useLocation()` with a prop passed from the Astro page.

**Layout.astro:**
```astro
---
const currentPath = Astro.url.pathname;
---
<Navigation currentPath={currentPath} client:load />
```

**Navigation.tsx:**
```tsx
export default function Navigation({ currentPath }: { currentPath: string }) {
  const isActive = (href: string) =>
    href === '/' ? currentPath === '/' : currentPath.startsWith(href);
}
```

### 4. React 19 Import Cleanup

```diff
- import React, { useState, useEffect } from 'react';
+ import { useState, useEffect } from 'react';

- React.FormEvent<HTMLFormElement>
+ import type { FormEvent } from 'react';
```

React 19 with jsx-runtime doesn't need the default import. `noUnusedLocals` will error on it.

### 5. Query Parameters (SSR)

Replace client-side URL reading with server-side in `.astro` frontmatter:

```diff
- // React component
- const [searchParams] = useSearchParams();
- const type = searchParams.get('type');

+ // page.astro frontmatter
+ const type = Astro.url.searchParams.get('type');
+ // Pass as prop to React component
```

Benefits: correct initial HTML (no flash), no useEffect needed, simpler component.

### 6. Tailwind 3 → 4

```diff
- // postcss.config.cjs
- module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
+ // astro.config.mjs — Vite plugin, no PostCSS needed
+ import tailwindcss from '@tailwindcss/vite';
+ export default defineConfig({
+   vite: { plugins: [tailwindcss()] }
+ });
```

Delete `postcss.config.*` and `tailwind.config.*`. Tailwind 4 uses `@tailwindcss/vite`.

## Client Directives Reference

| Directive | Hydration | Use When |
|-----------|-----------|----------|
| `client:load` | Immediately | Interactive above-fold (nav, forms, accordions) |
| `client:visible` | On scroll into view | Below-fold interactive content |
| `client:idle` | When browser idle | Low-priority interactivity |
| `client:only="react"` | Client-only, no SSR | Components that use browser APIs in render |

**Default to `client:load`** for migration simplicity. Optimize later.

## Layout Pattern

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

## View Transitions

Astro's `<ClientRouter />` gives SPA-like transitions without a client-side router:

```astro
<head><ClientRouter /></head>
<body transition:animate={fade({ duration: '0.2s' })}>
```

Scripts that need to reinitialize after transitions:
```js
document.addEventListener('astro:after-swap', initMyScript);
```

## Gotchas

1. **Navigation MUST use `client:load`** — `client:visible` causes race conditions with mobile menu
2. **Delete PostCSS config** — leftover configs from Tailwind 3 or Panda CSS break Tailwind 4 builds
3. **`motion` + View Transitions** — `whileInView` animations re-trigger after transitions (usually desirable). `AnimatePresence` exit animations may not fire during swaps.
4. **Hash routing remnants** — ensure no `/#/` prefixes survive in links
5. **`noUnusedLocals`** — will catch unused `import React from 'react'`
6. **Dynamic component pattern** (`<service.icon />` via iconMap) works unchanged in React islands
7. **Inline data arrays** — page-specific data (`faqs`, `values`, etc.) should stay inline, not move to constants

## Migration Checklist

For each React component:

- [ ] `'framer-motion'` → `'motion/react'`
- [ ] Remove `import React from 'react'`
- [ ] `React.FormEvent` → `import type { FormEvent } from 'react'`
- [ ] Remove all `react-router-dom` imports
- [ ] `<Link to={...}>` → `<a href={...}>`
- [ ] `useLocation()` → `currentPath` prop from Astro
- [ ] `useSearchParams()` → `Astro.url.searchParams` in frontmatter
- [ ] Update relative import paths for new directory structure
- [ ] Create `src/pages/{name}.astro` wrapper with `client:load`
- [ ] Add `@migration` block comment documenting changes
