# Utopia Type Scale Guide

## Mathematical Foundation

Fluid typography uses **linear interpolation** between two modular scales:

### The Formula

At viewport width `w`:
```
fontSize(w) = minSize + (maxSize - minSize) × (w - minWidth) / (maxWidth - minWidth)
```

For scale step `n`:
```
stepSize(w) = baseSize(w) × scale^n
```

Where `scale` interpolates between minScale and maxScale:
```
scale(w) = minScale + (maxScale - minScale) × (w - minWidth) / (maxWidth - minWidth)
```

### Example Calculation

Config: minWidth=320, maxWidth=1440, minFontSize=16, maxFontSize=20, minScale=1.2, maxScale=1.333

At viewport 320px:
- Base: 16px
- lg (×1.2): 19.2px
- xl (×1.2²): 23px

At viewport 1440px:
- Base: 20px
- lg (×1.333): 26.66px
- xl (×1.333²): 35.5px

At viewport 880px (midpoint):
- Base: 18px (16 + 2×0.5)
- lg (×1.267): 22.8px
- xl (×1.267²): 28.9px

## Modular Scale Ratios

| Ratio | Name | Uses |
|-------|------|------|
| 1.067 | Minor second | Minimal, academic |
| 1.125 | Major second | Fine typography |
| 1.2 | Minor third | **Recommended baseline** |
| 1.25 | Major third | Spacious layouts |
| 1.333 | Perfect fourth | Bold typography |
| 1.5 | Perfect fifth | Display, headings |
| 1.618 | Golden ratio | Premium brands |

## Common Configurations

### Blog / Content Site
```
minWidth: 320, maxWidth: 1200
minFontSize: 15, maxFontSize: 18
minScale: 1.125, maxScale: 1.2
steps: 5
```
Focus: Readability, accessibility, comfortable reading.

### SaaS Product
```
minWidth: 320, maxWidth: 1440
minFontSize: 14, maxFontSize: 18
minScale: 1.2, maxScale: 1.25
steps: 6
```
Focus: Hierarchy, density, scannability.

### Design Portfolio / Premium Brand
```
minWidth: 375, maxWidth: 1920
minFontSize: 16, maxFontSize: 24
minScale: 1.25, maxScale: 1.5
steps: 6
```
Focus: Drama, showcase, cinematic feel.

## Line Height Guidelines

| Context | Ratio | Use Case |
|---------|-------|----------|
| Display (headings) | 1.1–1.2 | Tight, dramatic headlines |
| Subheadings | 1.2–1.3 | Clear hierarchy |
| Body text | 1.5–1.6 | Comfortable reading |
| Small text | 1.7–1.8 | Accessible, spacious |
| UI labels | 1.2 | Compact, dense |
| Code | 1.5–1.6 | Monospace readability |

**Rule**: Smaller text needs looser leading (higher ratio).

## Responsive Breakpoints (Old Approach)

For reference—fluid typography replaces this:

```css
/* Old way (bad) */
@media (max-width: 640px) { font-size: 14px; }
@media (min-width: 641px) and (max-width: 1024px) { font-size: 16px; }
@media (min-width: 1025px) { font-size: 18px; }

/* New way (fluid) */
font-size: clamp(14px, 1.2vw, 18px);
```

Fluid wins: smooth scaling, fewer media queries, better UX.

## Integration with Other Primitives

Typography doesn't exist in isolation. Coordinate with:

### Spacing
- **Vertical rhythm**: Use typography line-height as basis for spacing scale (16px base + 1.5 ratio = 8px/16px/24px/36px spacing)
- **Gutters**: Match padding/margin to typography hierarchy (larger text = more space around it)

### Color
- **Contrast**: Larger text can use lower contrast (4.5:1 AA). Small text needs higher contrast (7:1 AAA).
- **Color hierarchy**: Brightest/most saturated colors on largest/most important text.

### Grid/Layout
- **Cap width**: Max width of text should match font size (e.g., 45–75 characters per line)
- **Column width**: Linked to font size and line height for readability

## Testing

Use browser DevTools to verify:
1. Open site on mobile (320px) — should be readable, not cramped
2. Resize to tablet (768px) — smooth, no jumps
3. Resize to desktop (1440px) — proportional growth, not disproportionately large
4. Test on 2560px ultrawide — should not exceed maxFontSize

Watch for:
- Line wrapping changes (should be smooth, based on content, not font jumps)
- Text readability across all sizes (especially headings at 320px)
- Visual hierarchy maintained (lg should still be noticeably larger than base)
