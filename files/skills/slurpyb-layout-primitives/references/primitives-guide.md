# Design Primitives Guide

## Overview

Design primitives are reusable, measurable building blocks for design systems. They enforce consistency and reduce decision-making friction.

## The Four Primitives

### 1. Spacing

**Purpose**: Control distance between elements, maintain rhythm.

**Base unit**: 8px (most common)

**Fibonacci progression** (golden ratio):
```
0    (no space)
4    (half unit)
8    (1 unit)
12   (1.5 units)
16   (2 units)
24   (3 units)
32   (4 units)
48   (6 units)
64   (8 units)
96   (12 units)
```

Each step feels like a consistent visual jump.

**Usage**:
- Margin, padding, gap, width, height
- Responsive: use base for mobile, multiply for desktop
- Vertical rhythm: match line-height of text

### 2. Sizing

**Purpose**: Standardize component dimensions.

**Component size scale**:
```
Icon:
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px

Button:
  sm: 32px (height)
  md: 40px
  lg: 48px

Input:
  sm: 32px
  md: 40px
  lg: 48px
```

**Rule**: Height = baseline (40px typically) adjusted by 8px increments.

**Aspect ratios** (common):
- 16:9 (video)
- 4:3 (image)
- 1:1 (icon, avatar)
- 2:1 (hero, banner)

### 3. Color

**Purpose**: Establish brand identity, semantic meaning, accessibility.

**Structure** (from [slurpyb-color-palette](../slurpyb-color-palette)):
- 6 color families (brand, success, error, warning, info, neutral)
- 12 steps per family (light to dark)
- Light + dark modes
- Alpha variants (transparency)

**Use cases**:

| Step | Use Case |\n|------|----------|\n| 1 | Ghost buttons, hover backgrounds |\n| 2-3 | Form inputs, cards, containers |\n| 4-5 | Secondary backgrounds, dividers |\n| 6-7 | Interactive elements, buttons, links |\n| 8-9 | Medium text, secondary headings |\n| 10-11 | Primary text, headings |\n| 12 | Maximum contrast, dark text |\n\n**Text color hierarchy**:\n```\nPrimary text:   step 12 (darkest)\nSecondary text: step 10\nTertiary text:  step 8\nDisabled text:  step 5 (neutral)\n```\n\n**Background hierarchy**:\n```\nPage background:     step 1 (lightest)\nCard/section:        step 2-3\nHover state:         step 2-3\nInput background:    step 2\nActive/selected:     step 6-7 (interactive color)\n```\n\n### 4. Typography\n\n**Purpose**: Establish hierarchy, readability, personality.\n\n**Scale** (from [slurpyb-fluid-typography](../slurpyb-fluid-typography)):\n```\nxs:  11px–15px\nsm:  13px–17px\nbase: 16px–20px (body text)\nlg:  19px–27px (subheading)\nxl:  23px–36px (heading)\n```\n\n**Line height**:\n```\nHeadings:     1.1–1.2 (tight)\nBody text:    1.5–1.6 (readable)\nSmall text:   1.8 (spacious)\n```\n\n**Font weight**:\n```\nRegular:  400 (body)\nMedium:   500 (emphasis)\nSemibold: 600 (subheading)\nBold:     700 (heading)\nBlack:    900 (display)\n```\n\n## Spatial Grid Systems\n\n### 8px Grid (Recommended)\n\nAll measurements divisible by 8:\n\n```\n8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 120, 144\n```\n\n**Advantages**:\n- Works with even font sizes (16, 24, 32)\n- Scales well on all devices\n- Natural rhythm, feels balanced\n\n**Example layout**:\n```\n┌─────────────────────────────┐ \n│ Padding: 24px (3 × 8)       │\n│ ┌─────────────────────────┐ │\n│ │ Content: 8px gap        │ │\n│ │ ┌─────────┬─────────┐   │ │\n│ │ │ Card    │ Card    │   │ │\n│ │ │ 240px   │ 240px   │   │ │\n│ │ └─────────┴─────────┘   │ │\n│ └─────────────────────────┘ │\n└─────────────────────────────┘\n```\n\n### 4px Grid (Detailed Control)\n\nFor dense, complex UIs (dashboards):\n\n```\n4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64\n```\n\n## Color Contrast Requirements\n\n### WCAG 2.1 Standards\n\n| Level | Text Size | Ratio |\n|-------|-----------|-------|\n| AA | Normal (14px+) | 4.5:1 |\n| AA | Large (18px+) | 3:1 |\n| AAA | Normal (14px+) | 7:1 |\n| AAA | Large (18px+) | 4.5:1 |\n\n**Checking contrast**:\n- Use WebAIM contrast checker\n- DevTools: Inspect element → Accessibility tab\n- Color tools: https://contrast-ratio.com\n\n**Good defaults** (from palette):\n- Text (step 12) on background (step 1): 18:1 (exceeds AAA)\n- Text (step 10) on background (step 3): 8:1 (AAA)\n- Text (step 8) on background (step 5): 3:1 (AA for large text only)\n\n## Responsive Breakpoints\n\n**Standard breakpoints** (align with device sizes):\n\n```\nxs: 320px   (mobile small)\nsm: 640px   (mobile large)\nmd: 768px   (tablet)\nlg: 1024px  (laptop)\nxl: 1280px  (desktop)\n2xl: 1536px (ultrawide)\n```\n\n**Mobile-first approach**:\n```jsx\n{/* Default: mobile */}\n<div className=\"text-base px-4 py-2\">\n  {/* Tablet and up */}\n  <div className=\"md:text-lg md:px-6 md:py-4\">\n    {/* Desktop and up */}\n    <div className=\"lg:text-xl lg:px-8 lg:py-6\">Content</div>\n  </div>\n</div>\n```\n\n## Density (Space Efficiency)\n\n### Compact (Dense UIs)\n\nFor data-heavy dashboards, admin tools:\n\n```\nPadding: 8px–12px\nGap: 8px\nHeight (buttons): 32px\nFont size: -1 step\n```\n\n### Normal (Most UIs)\n\nFor web apps, SaaS:\n\n```\nPadding: 16px–24px\nGap: 16px\nHeight (buttons): 40px\nFont size: base\n```\n\n### Spacious (Minimalist UIs)\n\nFor content sites, premium brands:\n\n```\nPadding: 24px–32px\nGap: 24px\nHeight (buttons): 48px\nFont size: +1 step\n```\n\n## Vertical Rhythm\n\n**Principle**: All line heights, margins, padding should be based on a unit.\n\n**Formula**:\n```\nBase line-height: 24px (for 16px text with 1.5 ratio)\nUnit: 24px\n\nHeading spacing:   24px\nParagraph spacing: 24px\nSection spacing:   48px (2 × unit)\n```\n\n**Implementation**:\n```jsx\n<article className=\"space-y-6\">  {/* 24px gap = 1 unit */}\n  <h1 className=\"text-3xl leading-tight mb-4\">Title</h1>\n  <p className=\"text-base leading-relaxed\">Paragraph 1</p>\n  <p className=\"text-base leading-relaxed\">Paragraph 2</p>\n  <h2 className=\"text-2xl leading-snug mt-8 mb-4\">Subheading</h2>\n  <p className=\"text-base leading-relaxed\">Paragraph 3</p>\n</article>\n```\n\n## Common Design Patterns\n\n### Hero Section\n```\nPadding:   64px–96px vertical\nSpacing:   48px between heading + subheading\nFont:      xl–3xl\nContrast:  Maximum (step 12 on step 1–2)\n```\n\n### Card\n```\nPadding:   16px–24px\nBorder:    1px solid, step 3–5\nShadow:    Subtle, no color\nGap:       16px between items\n```\n\n### Form\n```\nLabel padding:   0\nInput height:    40px\nInput padding:   12px (left/right), 8px (top/bottom)\nInput border:    1px, focus ring 2px\nField gap:       24px\n```\n\n### Button\n```\nHeight:    40px (md), 32px (sm), 48px (lg)\nPadding:   12px–16px horizontal, 8px–12px vertical\nRadius:    4px–8px\nGap:       8px (icon + text)\n```\n\n## Integration Checklist\n\n- [ ] Spacing scale defined and documented\n- [ ] Color palette generated with semantic colors\n- [ ] Typography scale configured (mobile + desktop)\n- [ ] Sizing scale for components (button, input, icon)\n- [ ] Contrast ratios validated (AA/AAA)\n- [ ] Responsive breakpoints established\n- [ ] Density strategy chosen (compact, normal, spacious)\n- [ ] Vertical rhythm applied\n- [ ] Interactive states documented (hover, active, disabled, focus)\n- [ ] Dark mode tested\n- [ ] Component library built using primitives\n