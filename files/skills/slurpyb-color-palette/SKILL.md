---
name: slurpyb-color-palette
description: Generate complete light/dark theme color palettes from brand colors using Rampensau algorithm. Use when building design systems with brand-driven colors, creating semantic color scales (success/error/warning/info), generating accessible color contrasts (WCAG AA/AAA), implementing dark mode, or integrating colors into UnoCSS presets. Triggers on palette generation, theme color setup, brand color system, or accessibility-first color design.
---

# Slurpyb Color Palette

## Quick Start

Convert a brand color into a complete 12-step color scale with light/dark modes, semantic colors, and WCAG validation:

```typescript
import { createGuidedPalette } from 'slurpyb-unocss/color'
import { definePreset } from 'unocss'

export const preset = definePreset(async (options) => {
  const palette = await createGuidedPalette({
    brandColor: '#003DA5',        // American Blue
    tags: ['professional', 'high-contrast'],
    accessibility: 'AA',           // Ensure WCAG AA compliance
    formats: ['hex', 'oklch'],
  })

  // palette.output has 6 color families × 12 steps × 2 modes (light/dark)
  // Smart-named: "Blue Jay", "Aurora Green" (semantic), "Grisaille" (neutral), etc.
  
  return {
    theme: {
      colors: palette.output,      // UnoCSS-ready theme colors
    },
  }
})
```

Result:
- **Brand colors**: 12 steps of your brand color
- **Semantic colors**: Auto-generated success/error/warning/info/neutral
- **Dark mode**: Automatic light+dark variants
- **Naming**: Smart names from color.pizza API (e.g., "brightSkyBlue")
- **Alpha variants**: a1–a12 transparency levels per color
- **Total**: 144 colors (6 families × 12 steps × 2 modes) + 144 alpha variants

## Core Concepts

### Color Families

Every palette has 6 color families:

1. **Brand**: Your primary color, 12-step scale
2. **Success**: Auto-generated accent (emerald/green), semantic
3. **Error**: Auto-generated accent (red), semantic
4. **Warning**: Auto-generated accent (orange), semantic
5. **Info**: Auto-generated accent (sky blue), semantic
6. **Neutral**: Grayscale for backgrounds, borders, text

Each family: 12 steps from very light (1) to very dark (12).

### Modifiers: Style Tags

Style tags adjust how colors are generated. Combine multiple tags:

```typescript
tags: [
  'professional',   // Formal, muted, business
  'playful',        // Bright, saturated, fun
  'elegant',        // Refined, subtle, premium
  'tech',           // Bold, high-contrast, modern
  'warm',           // Warm hues, orange/red bias
  'cool',           // Cool hues, blue/cyan bias
  'vibrant',        // High saturation, energetic
  'muted',          // Low saturation, subdued
]
```

Last tag wins if conflict. E.g., `['warm', 'cool']` → cool wins.

### Light & Dark Modes

Automatic dark mode generation with WCAG validation:

- **Light mode**: Steps 1–12 light to dark
- **Dark mode**: Auto-inverted with `-dark` suffix
- **Validation**: Ensures contrast ratios at each step (AA: 4.5:1, AAA: 7:1)
- **Auto-adjustment**: If contrast fails, lightness adjusted until compliant

## Configuration

### Basic

```typescript
const palette = await createGuidedPalette({
  brandColor: '#FF6B6B',        // Single color or hex string
  accessibility: 'AA',           // 'AA' or 'AAA' or false (no validation)
})
```

### With Modifiers

```typescript
const palette = await createGuidedPalette({
  brandColor: '#1E90FF',
  energy: 0.8,                   // 0–1: muted to vibrant
  warmth: 0.3,                   // 0–1: cool to warm
  contrast: 0.7,                 // 0–1: low to high
  depth: 0.4,                    // 0–1: flat to dimensional
  tags: ['tech', 'vibrant'],
})
```

### Light & Dark Brand Colors

```typescript
const palette = await createGuidedPalette({
  brandColor: {
    light: '#FF6B6B',            // Color on light backgrounds
    dark: '#FF9999',             // Color on dark backgrounds
  },
})
```

### Full Options

```typescript
interface GuidedPaletteOptions {
  brandColor: string | { light: string; dark?: string | 'auto' }
  prefix?: string                // CSS var prefix (default: 'color')
  energy?: number                // 0–1: muted to vibrant (default: 0.6)
  warmth?: number                // 0–1: cool to warm (default: 0.5)
  contrast?: number              // 0–1: low to high (default: 0.7)
  depth?: number                 // 0–1: flat to dimensional (default: 0.2)
  tags?: StyleTag[]              // Composable style presets
  accessibility?: 'AA' | 'AAA' | boolean  // WCAG validation (default: 'AA')
  formats?: ('hex' | 'rgb' | 'hsl' | 'oklch' | 'p3')[]
  semantic?: {
    algorithm?: 'harmony' | 'inherit' | 'hybrid'
    customColors?: Record<string, string>  // Override success/error/warning hues
  }
}
```

## Output Structure

```typescript
const palette = await createGuidedPalette({...})

// palette.output: UnoCSS-ready theme colors
{
  'brand-1': '#...',
  'brand-2': '#...',
  ...
  'brand-dark-1': '#...',
  'brand-dark-2': '#...',
  
  'success-1': '#...',
  'success-dark-1': '#...',
  ...
  
  'a-brand-1': 'rgba(..., 0.08)',  // Alpha variant
  'a-brand-2': 'rgba(..., 0.15)',
  ...
}

// All other data
palette.scale           // Raw Rampensau scale configs
palette.wcagReport      // Contrast ratios & compliance status
palette.names           // Smart names: { brand: 'Blue Jay', success: 'Aurora Green', ... }
palette.generatedAt     // Timestamp
```

## Integration with UnoCSS

Create a color utility file:

```typescript
// src/theme/colors.ts
import { createGuidedPalette } from 'slurpyb-unocss/color'

export async function defineSlurpybColors() {
  return createGuidedPalette({
    brandColor: '#003DA5',        // Your brand color
    tags: ['professional'],
    accessibility: 'AA',
  })
}
```

Then in `uno.config.ts`:

```typescript
import { defineSlurpybColors } from './src/theme/colors'

export default defineConfig({
  presets: [
    definePreset(async (options) => {
      const palette = await defineSlurpybColors()
      return {
        theme: { colors: palette.output }
      }
    })
  ]
})
```

Usage in HTML/JSX:
```jsx
<div className="bg-brand-5 text-brand-12">Primary button</div>
<div className="bg-success-3 text-success-12">Success state</div>
<div className="bg-brand-dark-5 dark:bg-brand-dark-10">Dark mode</div>
```

## Color Scale Reference

Each family uses steps 1–12:

| Step | Purpose | Use Case |
|------|---------|----------|
| 1 | Lightest background | Hover state, ghost button |
| 2–3 | Light backgrounds | Form inputs, cards |
| 4–5 | Neutral backgrounds | Page bg, secondary cards |
| 6–7 | Interactive elements | Buttons, links, active state |
| 8–9 | Medium text | Body text, secondary heading |
| 10–11 | Dark text | Primary heading, emphasis |
| 12 | Darkest text | Maximum contrast |

## Semantic Color Algorithms

Choose how semantic colors relate to brand:

- **harmony**: Colors complement brand (hue-based harmony)
- **inherit**: Semantic colors inherit brand saturation/lightness
- **hybrid** *(default)*: Mix of harmony + inherit for best results

```typescript
const palette = await createGuidedPalette({
  brandColor: '#003DA5',
  semantic: {
    algorithm: 'harmony',  // Override default 'hybrid'
    customColors: {        // Override specific semantics
      success: '#10B981',  // Custom success hue
      error: '#EF4444',
    }
  }
})
```

## Style Tag Examples

```typescript
// Professional business app
tags: ['professional', 'high-contrast', 'minimal']
// Result: Muted, formal, easy to scan

// Creative design portfolio
tags: ['playful', 'vibrant', 'elegant']
// Result: Bold, saturated, premium feel

// Tech startup dashboard
tags: ['tech', 'vibrant', 'warm']
// Result: Modern, energetic, slightly warm

// Accessible healthcare app
tags: ['minimal', 'cool', 'high-contrast']
// Result: Clean, trustworthy, maximum readability
```

## Dark Mode Strategy

Light mode uses steps 1–12. Dark mode inverts intelligently:

| Light Mode | Dark Mode | Reason |
|-----------|-----------|--------|
| bg-1 (very light) | bg-dark-11 (very dark) | Light bg → dark bg |
| text-12 (very dark) | text-dark-1 (very light) | Dark text → light text |
| button-6 (medium) | button-dark-7 (adjusted) | Interactive elements stay recognizable |

WCAG validation ensures text/bg contrast remains ≥4.5:1 (AA) or 7:1 (AAA).

## Combining with Typography & Spacing

Color palettes are part of a larger system. Coordinate with:

1. **Typography**: Ensure text color (step 11/12) has enough contrast on bg (step 1–4)
2. **Spacing**: Use color steps to echo spacing scale (e.g., step 5 bg with 1rem padding)
3. **Interactive states**: hover = +1 step, active = +2 steps, disabled = step 2

## Resources

See `references/rampensau-reference.md` for algorithm details, formula, and advanced customization.
