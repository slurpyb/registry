---
name: slurpyb-layout-primitives
description: Design cohesive layouts using design primitives (spacing, sizing, colors, typography). Use when building UI components, creating grid/layout systems, establishing visual hierarchy, designing responsive layouts, or ensuring consistency across a design system. Triggers on layout design, component building, spacing systems, sizing scales, color application, or design system implementation.
---

# Slurpyb Layout Primitives

## Quick Start

Design primitives are the foundational building blocks: spacing, sizing, colors, and typography. Use them together to create cohesive layouts:

```typescript
import { definePreset } from 'unocss'
import { defineSlurpybTypography } from './theme/typography'
import { defineSlurpybColors } from './theme/colors'
import { defineSlurpybSpacing } from './theme/spacing'

export default defineConfig({
  presets: [
    definePreset(async (options) => {
      const [typography, colors, spacing] = await Promise.all([
        defineSlurpybTypography(),
        defineSlurpybColors(),
        defineSlurpybSpacing(),
      ])

      return {
        theme: {
          fontSize: typography.fontSizeScale,
          lineHeight: typography.lineHeightScale,
          colors: colors.output,
          spacing: spacing.scale,
        },
      }
    })
  ]
})
```

Then build layouts with semantic markup + utility classes:

```jsx
// Vertical rhythm: space proportional to typography
<div className="p-6 space-y-4">  {/* p-6 = 24px from 4px base */}
  <h1 className="text-xl font-bold text-brand-12">Heading</h1>
  <p className="text-base text-brand-10">Body text</p>
  <button className="px-4 py-2 bg-brand-6 text-white rounded">Button</button>
</div>
```

## Core Primitives

Every design system has 4 core primitives:

### 1. Spacing

Base unit: typically 4px, 8px, or 16px. Generate scale:

```
0 → 0
1 → 4px   (base)
2 → 8px   (base × 2)
3 → 12px  (base × 3)
4 → 16px  (base × 4)
5 → 24px  (base × 6, Fibonacci-like)
6 → 32px  (base × 8)
```

Use for: padding, margin, gap, width, height.

### 2. Sizing

For components that are fixed or relative sizes:

```
icon-sm:  16px
icon-md:  24px
icon-lg:  32px

button-sm:  32px height
button-md:  40px height
button-lg:  48px height
```

### 3. Colors

From [slurpyb-color-palette](../slurpyb-color-palette):

- Brand colors (1–12 steps, light + dark)
- Semantic colors (success, error, warning, info)
- Neutral colors (grays for text, borders, backgrounds)

### 4. Typography

From [slurpyb-fluid-typography](../slurpyb-fluid-typography):

- Font sizes (xs, sm, base, lg, xl)
- Line heights (1.2, 1.5, 1.8 depending on size)
- Font weights (regular, medium, bold, black)

## Spacing Scale

### Foundation: Choose a Base Unit

Common choices:

| Base | Scale | Sizes | Use Case |
|------|-------|-------|----------|
| 4px | 4, 8, 12, 16, 24, 32, 48, 64 | Fine control | Complex, dense UIs (dashboards) |
| 8px | 8, 16, 24, 32, 40, 48, 64, 80 | Balanced | Most web apps, design systems |
| 16px | 16, 32, 48, 64, 80, 96 | Large spacing | Spacious, minimalist (content sites) |

**Recommended**: 8px base, generates natural Fibonacci-like progression.

### Using Spacing in Layout

```jsx
// Card with consistent internal spacing
<div className="p-6 space-y-4">  {/* p-6 = 24px padding all */}
  <h2 className="text-lg text-brand-12">Title</h2>
  <p className="text-sm text-brand-10 leading-relaxed">Description</p>
</div>

// Flex layout with gap
<div className="flex gap-4">  {/* gap-4 = 16px between items */}
  <div className="flex-1">Left</div>
  <div className="flex-1">Right</div>
</div>

// Grid with responsive gaps
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

## Sizing Scale

### Component Sizing

Standardize component dimensions:

```typescript
const sizing = {
  'icon-xs': '12px',
  'icon-sm': '16px',
  'icon-md': '24px',
  'icon-lg': '32px',
  'icon-xl': '48px',

  'button-sm': '32px',      // height
  'button-md': '40px',
  'button-lg': '48px',

  'input-sm': '32px',
  'input-md': '40px',
  'input-lg': '48px',
}
```

### Applying Sizing

```jsx
<button className="h-button-md px-4 flex items-center gap-2">
  <Icon className="w-icon-md h-icon-md" />
  Click me
</button>

<input type="text" className="w-full h-input-md px-3" />
```

## Color Application

### Text Colors

```typescript
// Hierarchy
'text-primary': colors['brand-12']     // Darkest, primary text
'text-secondary': colors['brand-10']   // Medium, supporting text
'text-tertiary': colors['brand-8']     // Lightest, hint text
'text-disabled': colors['neutral-5']   // Disabled state

// Semantic
'text-success': colors['success-12']
'text-error': colors['error-12']
'text-warning': colors['warning-12']
```

### Background Colors

```typescript
// Hierarchy
'bg-page': colors['neutral-1']         // Page background
'bg-card': colors['neutral-2']         // Card/container
'bg-section': colors['neutral-3']      // Section divider
'bg-input': colors['neutral-2']        // Form input

// Interactive
'bg-hover': colors['brand-2']          // Button hover
'bg-active': colors['brand-6']         // Button active
'bg-focus': colors['brand-4']          // Focus state
```

### Border Colors

```typescript
'border-light': colors['neutral-3']    // Subtle divider
'border-medium': colors['neutral-5']   // Normal border
'border-dark': colors['neutral-7']     // Strong border
'border-focus': colors['brand-6']      // Focus ring
```

## Layout Patterns

### Vertical Rhythm

Stack elements with consistent vertical spacing:

```jsx
<article className="max-w-prose space-y-6">
  <h1 className="text-3xl font-bold">Title</h1>
  <p className="text-base leading-relaxed">Paragraph</p>
  <h2 className="text-2xl font-bold mt-8">Subheading</h2>
  <p className="text-base leading-relaxed">Paragraph</p>
</article>
```

Rule: Spacing between elements = leading of text (e.g., 1.5rem text = 1.5rem space).

### Modular Grid

Responsive grid based on spacing units:

```jsx
<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Each cell is independently sized, aligned by grid gap */}
</div>
```

### Component Hierarchy

Use size + color to show hierarchy:

```jsx
<div className="space-y-4">
  <h1 className="text-3xl font-black text-brand-12">Primary</h1>
  <h2 className="text-2xl font-bold text-brand-11">Secondary</h2>
  <h3 className="text-xl font-semibold text-brand-10">Tertiary</h3>
  <p className="text-base text-brand-9">Body</p>
  <small className="text-sm text-brand-8">Small</small>
</div>
```

## Interactive States

### Button States

```jsx
<button
  className={[
    'px-4 py-2 rounded font-medium',           // Base
    'bg-brand-6 text-white',                   // Normal state (step 6)
    'hover:bg-brand-7',                        // Hover (step 7, slightly darker)
    'active:bg-brand-8',                       // Active (step 8, much darker)
    'disabled:bg-neutral-4 disabled:text-neutral-6',  // Disabled
  ].join(' ')}
>
  Action
</button>
```

Pattern: `normal` → `+1 step on hover` → `+2 steps on active`

### Form States

```jsx
<input
  className={[
    'w-full px-3 py-2 rounded border',         // Base
    'border-neutral-5 bg-neutral-1',           // Normal
    'focus:border-brand-6 focus:bg-brand-1',   // Focus
    'disabled:bg-neutral-3 disabled:cursor-not-allowed',
  ].join(' ')}
/>
```

### Text Emphasis

```jsx
<p>
  This is <strong className="text-brand-12 font-bold">important</strong> and
  <em className="text-brand-10 italic">secondary</em>.
</p>
```

## Combining with Other Primitives

### Typography + Spacing

Larger text deserves more surrounding space:

```jsx
<div className="space-y-6">  {/* 1.5rem space */}
  <h1 className="text-3xl">Large heading</h1>
  <p className="text-base">Body text</p>
</div>
```

### Colors + Contrast

Ensure readability:

```jsx
{/* Good: dark text (step 12) on light background (step 1) */}
<div className="bg-neutral-1 text-neutral-12 p-4">Readable</div>

{/* Bad: medium text (step 8) on medium background (step 5) */}
<div className="bg-neutral-5 text-neutral-8 p-4">Hard to read</div>
```

## Anti-Patterns

### ❌ Magic Numbers
```jsx
{/* DON'T: Use arbitrary values */}
<div className="ml-13">Content</div>
```

### ✅ Use scale
```jsx
{/* DO: Use designed scale */}
<div className="ml-4">Content</div>
```

### ❌ Inconsistent color references
```jsx
{/* DON'T: Mix color steps randomly */}
<div className="text-brand-7 bg-neutral-4">Unclear</div>
```

### ✅ Clear hierarchy
```jsx
{/* DO: Follow a system */}
<div className="text-brand-12 bg-neutral-1">Clear</div>
```

## Resources

See `references/primitives-guide.md` for detailed specifications, measurement tables, and implementation patterns.
