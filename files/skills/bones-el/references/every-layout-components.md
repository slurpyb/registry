# Every Layout Components — Full Reference

All components are Web Components (`customElements`) that inject scoped styles into `<head>` based on their attributes. Each component uses a `data-i` attribute for scoped CSS targeting — no shadow DOM, so styles cascade normally.

## How the Pattern Works

Every component:
1. Computes a unique ID from its attribute values: `Component-${attr1}${attr2}...`
2. Sets `data-i` on itself to that ID
3. Injects a `<style id="...">` block to `<head>` only if it doesn't exist yet (deduplication)
4. Re-renders on `attributeChangedCallback`

This means: **same attributes = single shared style block** (efficient). Attribute changes = new style block added.

---

## stack-l

**Purpose**: Inject vertical spacing between flow elements. The foundational building block for vertical rhythm.

**CSS baseline** (`Stack.css`):
```css
stack-l {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
stack-l > * + * {
  margin-block-start: var(--s1);
}
```

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `space` | `var(--s1)` | CSS value | Gap between direct children |
| `recursive` | `false` | boolean (presence) | Apply spacing at all nesting levels |
| `splitAfter` | `null` | integer | Push all items after Nth child to bottom via `margin-block-end: auto` |

**Usage**:
```html
<stack-l space="var(--s2)">
  <h1>Heading</h1>
  <p>Paragraph</p>
  <p>Another paragraph</p>
</stack-l>

<!-- Split: items 1-2 top, items 3+ bottom (useful for nav sidebars) -->
<stack-l splitAfter="2" style="height: 100vh">
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/logout">Log out</a>  <!-- pushed to bottom -->
</stack-l>
```

---

## box-l

**Purpose**: Generic container with padding and optional border. The atom of layout composition.

**CSS baseline** (`Box.css`):
```css
box-l {
  display: block;
  padding: var(--s1);
  border-width: var(--border-thin);
  outline: var(--border-thin) solid transparent; /* high contrast mode */
  outline-offset: calc(var(--border-thin) * -1);
}
```

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `padding` | `var(--s1)` | CSS value | Inner padding |
| `borderWidth` | `var(--border-thin)` | CSS value | Border width |
| `invert` | `false` | boolean (presence) | Flip light/dark via `filter: invert(100%)` |

**Usage**:
```html
<box-l padding="var(--s2)" borderWidth="2px">
  Card content with larger padding
</box-l>

<box-l invert>
  <!-- Inverted theme content (greyscale designs only) -->
</box-l>
```

---

## center-l

**Purpose**: Center content horizontally with a max-width (typographic measure). The standard centering solution.

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `max` | `var(--measure)` | CSS value | max-width of the centered element |
| `andText` | `false` | boolean | Also center-align text |
| `gutters` | `null` | CSS value | Minimum padding on either side |
| `intrinsic` | `false` | boolean | Center children by their own content width (uses flexbox) |

**Usage**:
```html
<!-- Standard page centering -->
<center-l max="80ch" gutters="var(--s1)">
  <article>...</article>
</center-l>

<!-- Center a card by its own width -->
<center-l intrinsic>
  <div class="card">...</div>
</center-l>
```

---

## cluster-l

**Purpose**: Group inline/flow items that wrap, with consistent gap. Perfect for tag lists, button groups, and badge clusters.

**CSS baseline** (`Cluster.css`):
```css
cluster-l {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
}
```

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `justify` | `flex-start` | CSS justify-content | Alignment along main axis |
| `align` | `flex-start` | CSS align-items | Alignment along cross axis |
| `space` | `var(--s1)` | CSS gap value | Gap between items |

**Usage**:
```html
<!-- Tag list -->
<cluster-l space="var(--s-1)">
  <a href="/tag/css">CSS</a>
  <a href="/tag/html">HTML</a>
  <a href="/tag/accessibility">Accessibility</a>
</cluster-l>

<!-- Right-aligned button group -->
<cluster-l justify="flex-end" space="var(--s-1)">
  <button type="button">Cancel</button>
  <button type="submit">Save</button>
</cluster-l>
```

---

## sidebar-l

**Purpose**: Two-element layout: sidebar (fixed width) + content (fills rest). Collapses to vertical stack when content would be too narrow.

**CSS baseline** (`Sidebar.css`):
```css
sidebar-l { display: flex; flex-wrap: wrap; }
sidebar-l > * { flex-grow: 1; }
```

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `side` | `left` | `left`/`right` | Which child is the sidebar |
| `sideWidth` | `null` (content width) | CSS value | Fixed width of sidebar when side-by-side |
| `contentMin` | `50%` | CSS percentage | Min width of content before collapse — **must be a percentage** |
| `space` | `var(--s1)` | CSS value | Gap between sidebar and content |
| `noStretch` | `false` | boolean | Prevent children from stretching to match height |

**Warning**: `contentMin` must be a percentage. Using absolute values causes overflow.

**Usage**:
```html
<!-- Left sidebar navigation -->
<sidebar-l side="left" sideWidth="250px" contentMin="60%" space="var(--s2)">
  <nav><!-- sidebar nav --></nav>
  <main><!-- content --></main>
</sidebar-l>

<!-- Right sidebar (ads, related content) -->
<sidebar-l side="right" sideWidth="300px" contentMin="55%">
  <article><!-- main content --></article>
  <aside><!-- sidebar --></aside>
</sidebar-l>
```

---

## switcher-l

**Purpose**: Switch between horizontal and vertical layout at a container-width threshold. No media queries — responds to container, not viewport.

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `threshold` | `var(--measure)` | CSS width | Container width below which layout goes vertical |
| `space` | `var(--s1)` | CSS value | Gap between items |
| `limit` | `5` | integer | Max items for horizontal layout. If children exceed this, all go 100% |

**Usage**:
```html
<!-- 3 equal columns that collapse below 40rem -->
<switcher-l threshold="40rem" limit="3">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</switcher-l>
```

**Note**: `limit` triggers the "too many items" fallback. If you have 4 children with `limit="3"`, ALL go to 100% width.

---

## grid-l

**Purpose**: Auto-fill responsive grid. Items fill to minimum width, then the grid adds columns. No media queries.

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `min` | `250px` | CSS length | Minimum cell width: `minmax(min(x, 100%), 1fr)` |
| `space` | `var(--s1)` | CSS value | Grid gap |

**Usage**:
```html
<grid-l min="200px" space="var(--s1)">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</grid-l>
```

Uses `@supports (width: min(...))` for progressive enhancement. Falls back to block display.

---

## cover-l

**Purpose**: Vertically center a "hero" element within a full-height container. Remaining children pin to top/bottom.

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `centered` | `h1` | CSS selector | The element to vertically center via `margin-block: auto` |
| `space` | `var(--s1)` | CSS value | Spacing around/between all children |
| `minHeight` | `100vh` | CSS value | Minimum block size of the cover |
| `noPad` | `false` | boolean | Remove padding from container itself |

**Usage**:
```html
<cover-l centered=".hero-content" minHeight="100svh">
  <header><!-- Top: site header --></header>
  <div class="hero-content"><!-- Centered --></div>
  <footer><!-- Bottom: footer --></footer>
</cover-l>
```

---

## frame-l

**Purpose**: Enforce an aspect ratio on a media container. The single child is object-fit cropped.

**CSS generated**: `aspect-ratio: x / y`

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `ratio` | `16:9` | `W:H` string | Aspect ratio as colon-separated integers |

**Warning**: `<frame-l>` should have exactly one child element.

**Usage**:
```html
<frame-l ratio="16:9">
  <img src="photo.jpg" alt="Description">
</frame-l>

<frame-l ratio="1:1">
  <video src="clip.mp4" autoplay muted></video>
</frame-l>
```

---

## reel-l

**Purpose**: Horizontal scrolling container with per-item widths. Use for carousels, filmstrips, horizontal lists.

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `itemWidth` | `auto` | CSS value | Width of each child |
| `space` | `var(--s0)` | CSS value | Gap between items |
| `height` | `auto` | CSS value | Height of the reel container |
| `noBar` | `false` | boolean | Hide scrollbar (still scrollable) |

**JS behavior**: Uses `ResizeObserver` and `MutationObserver` to toggle `.overflowing` class when content overflows. Use `.overflowing` in CSS for scroll indicators.

**Usage**:
```html
<reel-l itemWidth="300px" space="var(--s1)" noBar>
  <img src="1.jpg" alt="...">
  <img src="2.jpg" alt="...">
</reel-l>
```

---

## icon-l

**Purpose**: Align an inline SVG icon with adjacent text. Handles the baseline alignment quirk.

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `space` | `null` | CSS value | Space between icon and text (null = natural word spacing) |
| `label` | `null` | string | If set, adds `role="img"` + `aria-label` to the element |

**Usage**:
```html
<!-- Decorative icon with text, custom spacing -->
<icon-l space="var(--s-2)">
  <svg aria-hidden="true" focusable="false">...</svg>
  Download
</icon-l>

<!-- Semantic icon element (the icon IS the label) -->
<icon-l label="Warning">
  <svg aria-hidden="true" focusable="false">...</svg>
</icon-l>
```

---

## imposter-l

**Purpose**: Absolutely position an overlay on top of any element. For modals, popovers, tooltips positioned via JS.

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `breakout` | `false` | boolean | Allow element to break out of positioning container |
| `margin` | `0px` | CSS value | Min space from edges when `breakout` is false |
| `fixed` | `false` | boolean | Position relative to viewport instead of container |

**CSS baseline**: Uses `position: absolute` (or `fixed`). Parent must have `position: relative` or similar.

**Usage**:
```html
<div style="position: relative;">
  <imposter-l margin="var(--s1)">
    <!-- Centered overlay, won't overflow container edges -->
  </imposter-l>
</div>

<!-- Viewport-fixed overlay (modal backdrop) -->
<imposter-l fixed>
  <div class="modal-backdrop"></div>
</imposter-l>
```

---

## container-l

**Purpose**: Define a CSS Container Query context. Wrap any area that children need to query for intrinsic responsiveness.

**Attributes**:
| Attr | Default | Type | Description |
|---|---|---|---|
| `name` | `null` | string | `container-name` value (optional, for named queries) |

**Usage**:
```html
<!-- Anonymous container (children query its inline-size) -->
<container-l>
  <div class="card">...</div>
</container-l>

<!-- Named container -->
<container-l name="sidebar">
  <!-- children can use @container sidebar (min-width: 300px) -->
</container-l>
```

**Browser support**: Container queries are baseline 2023. Use with feature detection or `@supports (container-type: inline-size)`.
