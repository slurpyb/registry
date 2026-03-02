# Rampensau Algorithm Reference

## Overview

Rampensau generates color ramps (scales) from a single input color using mathematical transformations in OKLCH color space. It creates perceptually uniform scales where each step feels like a consistent visual step.

## Algorithm Overview

1. **Input**: Single brand color (any format: hex, rgb, hsl)
2. **Convert**: RGB → OKLCH (perceptually uniform color space)
3. **Transform**: Adjust Oklch.L (lightness) from 0–1 (black to white)
4. **Modulate**: Apply hue/chroma rotations based on desired "character"
5. **Output**: 12-step scale in multiple formats (hex, rgb, hsl, oklch, p3)

## OKLCH Color Space

OKLCH is designed for perceptual uniformity:
- **O**: Oklab (perceptually uniform, like Lab)
- **K**: Chroma (color intensity, 0 = gray, higher = more saturated)
- **C**: Chroma value (saturation)
- **H**: Hue (0–360°, red to red)

**Why OKLCH?** Unlike HSL, equal steps in OKLCH produce equal visual perception. A +0.1 change in lightness always feels like the same visual step.

## Transform Parameters (Modifiers)

The 4 modifiers control how the ramp "character" changes:

### Energy (vibrant–muted)

Controls chroma (saturation) across the ramp:
```
chroma = baseChroma × (0.2 + energy × 0.75)
```

- Energy 0.0: Muted, grayscale-like, low saturation
- Energy 0.5: Balanced, natural saturation
- Energy 1.0: Vibrant, high saturation

### Warmth (cool–warm)

Rotates hue around the color wheel:
```
hue = baseHue + (warmth - 0.5) × 60°
```

- Warmth 0.0: Cool colors, shift toward cyan/blue
- Warmth 0.5: No shift (keep brand hue)
- Warmth 1.0: Warm colors, shift toward orange/red

### Contrast (flat–dimensional)

Controls the lightness range at endpoints:
```
minLight = 0.05 + contrast × 0.2
maxLight = 0.95 - contrast × 0.2
```

- Contrast 0.0: Compressed range (light steps 0.2–0.8), flat appearance
- Contrast 0.5: Normal range (light steps 0.05–0.95), dimensional
- Contrast 1.0: Extended range (light steps 0–1), high drama

### Depth (flat–dimensional hue variation)

Applies hue cycling across the ramp:
```
hueVariation = depth × 180°  // Rotate hue across the 12 steps
```

- Depth 0.0: No hue variation, maintain brand hue
- Depth 0.5: Moderate hue cycling, rainbow effect
- Depth 1.0: Full hue cycling, 180° variation across ramp

## 12-Step Distribution

Steps are distributed logarithmically across 0–1 lightness range:

```
step = [0.05, 0.10, 0.15, 0.25, 0.35, 0.50, 0.65, 0.75, 0.85, 0.90, 0.95, 0.99]
```

This creates a scale where:
- Steps 1–3: Very light, backgrounds
- Steps 4–7: Medium, interactive elements
- Steps 8–12: Dark, text/borders

Each step has consistent visual appearance thanks to OKLCH perceptual uniformity.

## Style Tags Implementation

Tags are bundled modifier presets:

| Tag | Modifiers | Purpose |
|-----|-----------|---------|
| vibrant | energy: 1.0 | High saturation, energetic |
| muted | energy: 0.2 | Low saturation, subdued |
| warm | warmth: 0.75 | Orange/red bias |
| cool | warmth: 0.25 | Blue/cyan bias |
| professional | energy: 0.4, warmth: 0.5 | Formal, business |
| playful | energy: 0.9, contrast: 0.8 | Fun, bright |
| minimal | energy: 0.3, contrast: 0.3 | Clean, subtle |
| elegant | energy: 0.5, depth: 0.3 | Refined, sophisticated |
| tech | energy: 0.8, contrast: 0.9 | Modern, high-contrast |

Tags can be combined. **Last tag wins** if there's a conflict.

## Semantic Color Generation

Automatic generation of success/error/warning/info colors:

### Harmony Algorithm

Generates complementary colors based on color wheel distance:
```
success: baseHue + 142° (emerald)
error: baseHue + 0° (red)
warning: baseHue + 35° (orange)
info: baseHue + 200° (sky blue)
```

Creates colors that harmonize with the brand through hue relationships.

### Inherit Algorithm

Semantic colors inherit saturation/lightness from brand:
```
success: hardcoded hue (142°) + brand.chroma + brand.lightness
```

Creates semantic colors that "feel" related to brand through saturation/lightness matching.

### Hybrid Algorithm (Default)

Mixes harmony + inherit for best of both:
```
success: hue from harmony, chroma/lightness influenced by inherit
```

Creates colors that are semantically distinct (harmony hues) but visually cohesive (matching saturation range).

## WCAG Compliance

Dark mode generation with automatic contrast validation:

### Contrast Ratio Formula

```
L1 = relative luminance of lighter color
L2 = relative luminance of darker color

ratio = (L1 + 0.05) / (L2 + 0.05)
```

- AA requirement: 4.5:1 for normal text, 3:1 for large text
- AAA requirement: 7:1 for normal text, 4.5:1 for large text

### Auto-Adjustment

If contrast fails:
1. Calculate required contrast ratio
2. Adjust dark mode lightness iteratively
3. Re-validate until compliant

This ensures dark mode pairs always meet accessibility standards.

## Color Format Conversions

All scales support multiple output formats:

- **Hex**: #RRGGBB (web standard)
- **RGB**: rgb(r, g, b) or rgba(r, g, b, a)
- **HSL**: hsl(h, s%, l%) — human-readable but less accurate
- **OKLCH**: oklch(L, C, H) — perceptually uniform, future-proof
- **Display P3**: color(display-p3 r g b) — wider gamut, professional color

Choose based on use case:
- **Hex**: Safest, most compatible
- **RGB/RGBA**: Transparency, standard web colors
- **HSL**: Manual fine-tuning in DevTools
- **OKLCH**: Color-space aware, future CSS standard
- **P3**: Professional printing, high-gamut displays

## Advanced: Custom Semantic Colors

Override specific semantics:

```typescript
const palette = await createGuidedPalette({
  brandColor: '#003DA5',
  semantic: {
    customColors: {
      success: '#10B981',    // Custom hue
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6'        // Blue, not sky blue
    }
  }
})
```

## Performance Characteristics

- Color generation: ~100ms per palette (primarily API calls)
- API calls: 1 per semantic color (5 total: brand, success, error, warning, info, neutral)
- Caching: API responses cached in-memory
- Retry logic: 3 attempts, exponential backoff if API fails

## References

- **OKLCH Spec**: https://bottosson.github.io/posts/oklab/
- **Rampensau**: https://github.com/meodai/rampensau
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Color.pizza API**: https://api.color.pizza/v1/
