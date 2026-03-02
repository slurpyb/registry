---
name: slurpyb-fluid-typography
description: Create responsive, fluid typography scales using utopia-type-scale. Use when building typography systems that scale smoothly across all viewport sizes, setting up responsive font sizes for headings/body/code, configuring line height ratios, or integrating typography into UnoCSS presets. Triggers on typography scale configuration, responsive text sizing, font modulation, or viewport-relative font sizing.
---

# Slurpyb Fluid Typography

## Quick Start

Fluid typography scales font size smoothly between min/max viewport widths using mathematical ratios (modular scales).

```typescript
import { definePreset } from 'unocss'
import { definUtopiaTypography } from './typography'

export const preset = definePreset(async (options) => {
  const typography = await definUtopiaTypography({
    minWidth: 320,        // Mobile viewport (px)
    maxWidth: 1440,       // Desktop viewport (px)
    minFontSize: 16,      // Mobile base (px)
    maxFontSize: 20,      // Desktop base (px)
    minScale: 1.2,        // Mobile ratio (e.g., 1:1.2:1.44:1.73)
    maxScale: 1.333,      // Desktop ratio (e.g., 1:1.333:1.78:2.37)
  })

  return {
    theme: {
      fontSize: typography.fontSizeScale,    // All sizes: xs, sm, base, lg, xl, 2xl...
      lineHeight: typography.lineHeightScale, // Line heights
    },
  }
})
```

Result: `font-base` becomes 16px on mobile, 20px on desktop. All other sizes scale proportionally using the modular scale ratio.

## Core Concepts

### Modular Scale

Each scale step multiplies by a ratio. Two ratios create smooth transition across viewports:

- **Mobile scale 1:1.2**: base (1) → 1.2 → 1.44 → 1.73 (minor third progression)
- **Desktop scale 1:1.333**: base (1) → 1.333 → 1.78 → 2.37 (perfect fourth progression)

Common ratios:
- 1.125 (minor second) — subtle progression, many steps before doubling
- 1.2 (minor third) — balanced, recommended for most UIs
- 1.25 (major third) — spacious, works well for large viewports
- 1.333 (perfect fourth) — dramatic, for bold typography systems
- 1.5 (perfect fifth) — very dramatic, reserved for special uses

### Fluid Interpolation

Instead of breakpoints (e.g., "12px on mobile, 16px on tablet, 20px on desktop"), fluid typography calculates size at ANY viewport width:

```
size(viewport) = minSize + (maxSize - minSize) × (viewport - minWidth) / (maxWidth - minWidth)
```

Smooth curve, no jumps, no media queries needed per size.

### Line Height Strategy

Line heights should increase as font size increases (smaller text needs looser leading):

- **Headings**: 1.2 (tight, dramatic)
- **Body copy**: 1.5–1.6 (readable)
- **Small text**: 1.8 (spacious for accessibility)

## Configuration

Use `definUtopiaTypography()` with these options:

```typescript
interface UtopiaTypographyOptions {
  minWidth: number          // Smallest viewport (px, typically 320–375)
  maxWidth: number          // Largest viewport (px, typically 1440–2560)
  minFontSize: number       // Base font size at minWidth (px)
  maxFontSize: number       // Base font size at maxWidth (px)
  minScale: number          // Ratio at minWidth (1.125–1.5)
  maxScale: number          // Ratio at maxWidth (1.125–1.5)
  steps?: number            // How many scale steps (default: 5, creates xs/sm/base/lg/xl)
  lineHeightBase?: number   // Base line height (default: 1.5)
}
```

### Preset Configurations

**Minimal (content-focused)**
```typescript
minWidth: 320, maxWidth: 1024,
minFontSize: 15, maxFontSize: 18,
minScale: 1.125, maxScale: 1.2
// Subtle. Fits dense content.
```

**Balanced (most projects)**
```typescript
minWidth: 320, maxWidth: 1440,
minFontSize: 16, maxFontSize: 20,
minScale: 1.2, maxScale: 1.333
// Recommended. Works for blogs, SaaS, marketing.
```

**Spacious (design-forward)**
```typescript
minWidth: 320, maxWidth: 1920,
minFontSize: 16, maxFontSize: 22,
minScale: 1.25, maxScale: 1.5
// Bold. Works for design portfolios, premium brands.
```

## Integration with UnoCSS

Create a typography utility file:

```typescript
// src/theme/typography.ts
import { definUtopiaTypography } from 'utopia-type-scale'

export async function defineSlurpybTypography() {
  return definUtopiaTypography({
    minWidth: 320,
    maxWidth: 1440,
    minFontSize: 16,
    maxFontSize: 20,
    minScale: 1.2,
    maxScale: 1.333,
    steps: 5,
  })
}
```

Then in `uno.config.ts`:

```typescript
import { defineSlurpybTypography } from './src/theme/typography'

export default defineConfig({
  presets: [
    definePreset(async (options) => {
      const typography = await defineSlurpybTypography()
      return {
        theme: { fontSize: typography.fontSizeScale }
      }
    })
  ]
})
```

## Font Size Scale Reference

For balanced config (16px–20px, scale 1.2–1.333):

| Step | Name | Mobile | Desktop |
|------|------|--------|---------|
| 0 | xs | 11px | 11px |
| 1 | sm | 13px | 15px |
| 2 | base | 16px | 20px |
| 3 | lg | 19px | 27px |
| 4 | xl | 23px | 36px |

Usage: `text-base`, `text-lg`, `text-xl`, etc.

## Combining with Colors & Spacing

Fluid typography works best with:
1. **Fluid spacing** (proportional to font size) — Use [slurpyb-layout-primitives](../slurpyb-layout-primitives)
2. **Color contrast** (ensure text reads at all sizes) — Use [slurpyb-color-palette](../slurpyb-color-palette) for AA/AAA compliance

Together, these create a cohesive, responsive design system.

## Advanced: Custom Line Heights

Override per-size line heights:

```typescript
const typography = await definUtopiaTypography({...})

// Tighter headings, looser body
const customLineHeights = {
  xs: 1.4, sm: 1.4, base: 1.6, lg: 1.3, xl: 1.2
}

return {
  theme: {
    lineHeight: { ...typography.lineHeightScale, ...customLineHeights }
  }
}
```

## Resources

See `references/utopia-guide.md` for in-depth utopia-type-scale documentation and mathematical formulas.
