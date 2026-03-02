---
name: bones-el
description: Create modern, intrinsic, accessible web elements using BONES semantic markup patterns fused with Every Layout custom elements. Use when building UI components, accessible widgets, responsive layouts, or web elements that must be framework-agnostic. Activates on bones, every-layout, intrinsic layout, accessible widget, semantic HTML, BEM, ARIA, stack-l, sidebar-l, cluster-l, box-l, cover-l, switcher-l, grid-l, frame-l, reel-l, icon-l, imposter-l, container-l. NOT for framework-specific components (React/Vue/Angular-only), CSS-only layouts without semantic structure, or purely visual styling tasks.
allowed-tools: Read,Write,Edit,Glob
---

# BONES + Every Layout: Intrinsic Accessible Web Elements

Create framework-agnostic web elements where **semantic structure meets intrinsic layout**. BONES provides the accessible HTML skeleton; Every Layout custom elements provide the responsive, intrinsic CSS bones.

## Core Philosophy

**Progressive Enhancement first.** Build the semantic HTML layer that works without CSS or JS, then enhance with Every Layout layout primitives, then enhance with interaction behavior.

**Two layers, always separate:**
1. **BONES**: Semantic HTML + ARIA for accessibility (the "what")
2. **Every Layout**: Intrinsic layout custom elements for responsive CSS (the "how it arranges")

**BEM naming** for all component classes. Every Layout elements use `-l` suffix custom element tags.

---

## Decision Tree: What to Reach For

### Need a UI widget with interaction?
→ Start from `references/bones-patterns.md` for the correct ARIA skeleton
→ Wrap in Every Layout elements for the layout context

### Need a responsive layout container?
→ Choose from Every Layout primitives below, no media queries needed

### Need both layout AND accessible interaction?
→ Compose: Every Layout element wraps or is sibling to a BONES widget

---

## Every Layout Primitives Quick Reference

| Element | Tag | Purpose | Key Attrs |
|---|---|---|---|
| Stack | `<stack-l>` | Vertical flow with consistent spacing | `space`, `recursive`, `splitAfter` |
| Box | `<box-l>` | Generic container with padding + border | `padding`, `borderWidth`, `invert` |
| Center | `<center-l>` | Horizontal centering with max-width | `max`, `gutters`, `andText`, `intrinsic` |
| Cluster | `<cluster-l>` | Wrapping inline group (tags, buttons) | `space`, `justify`, `align` |
| Sidebar | `<sidebar-l>` | Two-column, collapses to stack | `side`, `sideWidth`, `contentMin`, `space`, `noStretch` |
| Switcher | `<switcher-l>` | Horizontal ↔ vertical at threshold | `threshold`, `space`, `limit` |
| Grid | `<grid-l>` | Auto-fill responsive grid | `min`, `space` |
| Cover | `<cover-l>` | Vertically centered hero | `centered`, `space`, `minHeight`, `noPad` |
| Frame | `<frame-l>` | Aspect ratio container | `ratio` (default `16:9`) |
| Reel | `<reel-l>` | Horizontal scroll container | `itemWidth`, `space`, `height`, `noBar` |
| Icon | `<icon-l>` | Inline icon + text alignment | `space`, `label` |
| Imposter | `<imposter-l>` | Absolutely positioned overlay | `breakout`, `margin`, `fixed` |
| Container | `<container-l>` | CSS container query context | `name` |

Deep reference: `references/every-layout-components.md`

---

## BONES Widget Quick Reference

| Widget | Key ARIA | Notes |
|---|---|---|
| Accordion | `role="list"`, `aria-roledescription="accordion"` | List of `<details>` |
| Alert Dialog | `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` | Single confirm button |
| Breadcrumbs | `<nav>`, `aria-labelledby`, `aria-current="page"` | Ordered list |
| Carousel | `role="group"`, `aria-roledescription="carousel"`, `aria-hidden` | JS manages aria-hidden |
| Checkbox | `<fieldset>` + `<legend>` | Native input; SVG facade optional |
| Combobox | `role="combobox"`, `aria-expanded`, `aria-owns` | Input + listbox |
| Tabs | `role="tablist"`, `role="tab"`, `aria-controls`, `aria-selected` | Tabindex roving |
| Tooltip | `role="tooltip"`, `aria-describedby` | On hover/focus; no `aria-expanded` |
| Menu Button | `aria-haspopup="true"`, `aria-expanded`, `role="menu"` | menuitem/menuitemradio/menuitemcheckbox |
| Switch | `role="switch"`, `aria-checked`, `tabindex="0"` | Not a true form control |

Full patterns with markup: `references/bones-patterns.md`

---

## Composition Patterns

### Widget inside a layout context

```html
<!-- Sidebar layout wrapping a nav + main content area -->
<sidebar-l side="left" sideWidth="16rem" contentMin="60%">
  <nav class="site-nav" aria-label="Main navigation">
    <!-- nav content -->
  </nav>
  <main>
    <stack-l space="var(--s2)">
      <!-- page content -->
    </stack-l>
  </main>
</sidebar-l>
```

### Cluster for a widget's action group

```html
<!-- Dialog footer: Cluster aligns buttons with gap -->
<div class="confirm-dialog__footer">
  <cluster-l justify="flex-end" space="var(--s-1)">
    <button class="confirm-dialog__cancel" type="button">Cancel</button>
    <button class="confirm-dialog__confirm" type="button">OK</button>
  </cluster-l>
</div>
```

### Stack for form fields

```html
<stack-l space="var(--s1)">
  <fieldset>
    <legend>Auction Type</legend>
    <stack-l space="var(--s-1)">
      <span>
        <input id="freeshipping" type="checkbox" name="freeshipping" />
        <label for="freeshipping">Free Shipping</label>
      </span>
    </stack-l>
  </fieldset>
</stack-l>
```

### Grid for card sets

```html
<grid-l min="280px" space="var(--s1)">
  <!-- each child becomes a responsive grid cell -->
  <box-l class="card">...</box-l>
  <box-l class="card">...</box-l>
</grid-l>
```

### Reel for carousel items

```html
<div class="carousel" role="group" aria-labelledby="carousel-title" aria-roledescription="carousel">
  <button aria-label="Previous slide"><!-- SVG --></button>
  <reel-l itemWidth="300px" space="var(--s1)">
    <li aria-hidden="false">...</li>
    <li aria-hidden="true">...</li>
  </reel-l>
  <button aria-label="Next slide"><!-- SVG --></button>
</div>
```

---

## SVG Icon Pattern (BONES Standard)

Always use this pattern for decorative icons:
```html
<svg focusable="false" width="16" height="16" aria-hidden="true">
  <use xlink:href="#icon-name"></use>
</svg>
```

For semantic icons (standalone meaning), use `role="img"` and `aria-label`:
```html
<svg focusable="false" height="16" width="16" role="img" aria-label="Confirmation">
  <use xlink:href="#icon-confirmation-filled"></use>
</svg>
```

Use `<icon-l>` when an icon appears inline with text and needs precise alignment:
```html
<icon-l space="var(--s-2)" label="Warning">
  <svg aria-hidden="true" focusable="false">...</svg>
  Warning: action required
</icon-l>
```

---

## Modular Scale & CSS Custom Properties

Every Layout components expect these CSS custom properties. Define at `:root`:

```css
:root {
  --ratio: 1.5;
  --s-5: calc(var(--s-4) / var(--ratio));
  --s-4: calc(var(--s-3) / var(--ratio));
  --s-3: calc(var(--s-2) / var(--ratio));
  --s-2: calc(var(--s-1) / var(--ratio));
  --s-1: calc(var(--s0) / var(--ratio));
  --s0: 1rem;
  --s1: calc(var(--s0) * var(--ratio));
  --s2: calc(var(--s1) * var(--ratio));
  --s3: calc(var(--s2) * var(--ratio));
  --s4: calc(var(--s3) * var(--ratio));
  --s5: calc(var(--s4) * var(--ratio));
  --measure: 60ch;
  --border-thin: 1px;
}
```

---

## Loading Custom Elements

```html
<!-- In <head> or before </body> with type="module" -->
<script type="module">
  import Stack from './components/Stack/Stack.js';
  import Sidebar from './components/Sidebar/Sidebar.js';
  // etc.
</script>
```

Or include CSS fallback for no-JS:
```html
<link rel="stylesheet" href="./components/Stack/Stack.css">
```

The CSS files provide baseline styles; JS enhances with attribute-driven dynamic styles injected into `<head>`.

---

## Anti-Patterns

See `references/anti-patterns.md` for full detail. Top mistakes:

1. **Using media queries for layout breakpoints** — use Switcher/Sidebar threshold instead
2. **Applying `role="button"` to divs/spans** — use native `<button>` elements
3. **Omitting `focusable="false"` on SVG** — causes double-focus in IE/Edge
4. **Missing `aria-modal="true"` on dialogs** — screen readers won't constrain browsing
5. **Using `aria-expanded` on tooltips** — tooltips use modifier class, not aria-expanded
6. **Nesting Every Layout elements without CSS custom property context** — components inherit space values; define `--s0` etc. at root
7. **Forgetting `hidden` on dialog elements** — dialogs must start hidden; toggle with JS

---

## References

- `references/every-layout-components.md` — All 13 components with full attribute docs + CSS output
- `references/bones-patterns.md` — All BONES widget HTML patterns
- `references/anti-patterns.md` — Anti-patterns with explanations and correct alternatives
