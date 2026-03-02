# Anti-Patterns: BONES + Every Layout

Common mistakes when building accessible, intrinsic web elements. Each entry explains the wrong assumption, why it fails, and the correct approach.

---

## Layout Anti-Patterns

### 1. Media Queries for Layout Breakpoints

**Novice thinking**: "I need the sidebar to collapse on mobile, so I write `@media (max-width: 768px)`."

**Reality**: Hard-coded viewport breakpoints are fragile. They break when the component is used inside a narrow container on desktop, or when user font size increases. They encode device assumptions, not content needs.

**Correct approach**: Use `<sidebar-l contentMin="60%">` or `<switcher-l threshold="40rem">`. These respond to the *container*, not the viewport. No media queries needed.

```html
<!-- Wrong: viewport-dependent, fragile -->
<style>
  @media (max-width: 768px) { .layout { flex-direction: column; } }
</style>
<div class="layout">...</div>

<!-- Right: container-intrinsic, flexible -->
<sidebar-l contentMin="60%" space="var(--s2)">
  <nav>...</nav>
  <main>...</main>
</sidebar-l>
```

---

### 2. Hardcoded `px` Values for Spacing

**Novice thinking**: "I'll use `gap: 16px` or `margin: 24px` directly."

**Reality**: Fixed pixel values don't scale with user font preferences, don't adapt to context, and create design inconsistency.

**Correct approach**: Use the modular scale (`var(--s0)`, `var(--s1)`, `var(--s-1)`, etc.) for all spacing. This gives you a harmonious, proportional rhythm that respects user settings.

```html
<!-- Wrong -->
<stack-l space="16px">...</stack-l>

<!-- Right -->
<stack-l space="var(--s1)">...</stack-l>
```

---

### 3. Misusing `<switcher-l>` with Too Many Items

**Novice thinking**: "I'll use switcher for a 6-item feature list."

**Reality**: `<switcher-l>` has a `limit` attribute. If the number of children **exceeds** the limit, ALL items go to 100% width (vertical). Default limit is 5. This is a feature — it prevents awkward near-overflow horizontal layouts — but surprises users who don't read the docs.

**Correct approach**: For grids where any number of items should flow, use `<grid-l>` instead.

| Need | Use |
|---|---|
| Fixed number of equal columns (2-5) | `<switcher-l>` |
| Unknown number of items, responsive grid | `<grid-l>` |
| Two elements with one fixed width | `<sidebar-l>` |

---

### 4. `<frame-l>` with Multiple Children

**Novice thinking**: "I'll put a caption inside frame-l with the image."

**Reality**: `<frame-l>` expects exactly one child. The `object-fit` CSS cropping only works correctly with a single media element. Multiple children will break the aspect ratio behavior.

**Correct approach**: Wrap frame in a stack or box if you need a caption.

```html
<!-- Wrong -->
<frame-l ratio="16:9">
  <img src="photo.jpg" alt="...">
  <figcaption>Caption</figcaption>
</frame-l>

<!-- Right -->
<figure>
  <frame-l ratio="16:9">
    <img src="photo.jpg" alt="...">
  </frame-l>
  <figcaption>Caption</figcaption>
</figure>
```

---

### 5. Forgetting CSS Custom Properties at `:root`

**Novice thinking**: "I imported the component JS, why doesn't the spacing work?"

**Reality**: Every Layout components use CSS custom properties like `var(--s1)`, `var(--measure)`, `var(--border-thin)`. These must be defined — the components don't define them.

**Correct approach**: Always include a modular scale definition at `:root` before using any Every Layout component.

```css
:root {
  --ratio: 1.5;
  --s0: 1rem;
  --s-1: calc(var(--s0) / var(--ratio));
  --s1: calc(var(--s0) * var(--ratio));
  --s2: calc(var(--s1) * var(--ratio));
  --measure: 60ch;
  --border-thin: 1px;
}
```

---

### 6. Using `<sidebar-l contentMin>` with Absolute Values

**Novice thinking**: `contentMin="400px"` to ensure the content area is always at least 400px wide.

**Reality**: The sidebar layout math (`flex-basis: calc((threshold - 100%) * 999)`) requires a **percentage** for `contentMin`. Absolute values cause overflow. The component logs a warning about this in the console.

**Correct approach**: Always use percentages for `contentMin`.

```html
<!-- Wrong: causes overflow -->
<sidebar-l contentMin="400px">...</sidebar-l>

<!-- Right -->
<sidebar-l contentMin="55%">...</sidebar-l>
```

---

## ARIA / Accessibility Anti-Patterns

### 7. `role="button"` on `<div>` or `<span>`

**Novice thinking**: "I'll style a div to look like a button and add `role='button'`."

**Reality**: Native `<button>` elements give you keyboard activation (Enter + Space), implicit focus management, form association, disabled state, and touch handling for free. `role="button"` gives you only the ARIA semantics — you must manually implement all keyboard behavior.

**Correct approach**: Always use `<button type="button">` for interactive controls.

```html
<!-- Wrong: missing keyboard handling, focus styles, disabled support -->
<div role="button" tabindex="0" class="btn">Click me</div>

<!-- Right -->
<button type="button" class="btn">Click me</button>
```

---

### 8. `aria-expanded` on Tooltips

**Novice thinking**: "The tooltip is either shown or hidden, so I'll toggle `aria-expanded`."

**Reality**: `aria-expanded` is reserved for elements that control a collapsible region they *own* (menus, accordion panels, comboboxes). Tooltips use `role="tooltip"` + `aria-describedby`. Their show/hide state is communicated differently — via CSS modifier class.

**Timeline**: ARIA 1.1+ strictly defines `aria-expanded` for owned expandable regions. Tooltip is a descriptive overlay, not an owned region.

**Correct approach**: Toggle a modifier class (e.g., `tooltip--expanded`) on the tooltip wrapper. The `role="tooltip"` + `aria-describedby` on the host handles the AT communication.

```html
<!-- Wrong -->
<button aria-expanded="true" aria-describedby="tip-1">Settings</button>

<!-- Right: aria-expanded NOT present; use modifier class -->
<span class="tooltip tooltip--expanded">
  <button aria-describedby="tip-1" aria-label="Settings">...</button>
  <div id="tip-1" role="tooltip">...</div>
</span>
```

---

### 9. Missing `focusable="false"` on SVG

**Novice thinking**: "SVGs aren't focusable, so I don't need to add anything."

**Reality**: In Internet Explorer and older Edge, SVG elements are focusable by default, creating phantom tab stops. Users encounter focus landing on invisible "elements" mid-keyboard navigation.

**Correct approach**: Always add `focusable="false"` to decorative SVGs. This is a IE/legacy Edge fix that's harmless in modern browsers.

```html
<!-- Wrong: focusable in IE/legacy Edge -->
<svg width="16" height="16" aria-hidden="true">
  <use xlink:href="#icon-close"></use>
</svg>

<!-- Right -->
<svg focusable="false" width="16" height="16" aria-hidden="true">
  <use xlink:href="#icon-close"></use>
</svg>
```

---

### 10. Missing `aria-modal="true"` on Dialogs

**Novice thinking**: "The overlay blocks mouse clicks, so screen reader users can't click outside either."

**Reality**: Screen reader virtual cursor ignores visual overlays. Without `aria-modal="true"`, AT users can navigate the entire page DOM even when a modal is open, bypassing the dialog completely.

**Correct approach**: Add `aria-modal="true"` to every modal dialog (`role="dialog"` or `role="alertdialog"`). Also implement a JS focus trap for keyboard users.

```html
<!-- Wrong: AT can navigate past the dialog -->
<div role="dialog" aria-labelledby="title">...</div>

<!-- Right -->
<div role="dialog" aria-labelledby="title" aria-modal="true">...</div>
```

---

### 11. Omitting `hidden` on Dialogs at Page Load

**Novice thinking**: "I'll position the dialog off-screen with CSS (`position: absolute; left: -9999px`)."

**Reality**: Visually hidden elements via position tricks are still in the AT reading order. Screen reader users encounter the dialog content before it's meant to appear. `display: none` or `hidden` removes from all trees (visual, accessibility, DOM).

**Correct approach**: Use the `hidden` attribute on dialogs. JS removes it to show; re-adds to hide.

```html
<!-- Wrong: AT reads this even when "hidden" -->
<div role="dialog" style="position:absolute;left:-9999px">...</div>

<!-- Right -->
<div role="dialog" aria-modal="true" hidden>...</div>
```

---

### 12. Using ARIA Tabs for Navigation

**Novice thinking**: "These sections look like tabs, so I'll use `role='tablist'`."

**Reality**: ARIA tabs require client-side panel switching. Arrow keys move focus between tabs. If clicking a tab navigates to a new URL, the AT expectations are violated — users expect tabs to reveal panels in-place, not load pages.

**Decision tree**:
- Clicking changes URL → Use **Fake Tabs** (`<nav>` + links with `aria-current="page"`)
- Clicking shows/hides panels on same page → Use **ARIA Tabs** (`role="tablist"`, roving tabindex)

---

### 13. Navigation as ARIA Menu

**Novice thinking**: "This is a site navigation menu, so I'll use `role='menu'` and `role='menuitem'`."

**Reality**: ARIA `role="menu"` has strict keyboard expectations (arrow key navigation, typeahead) intended for application command menus (like a desktop app's Edit menu). Navigation links wrapped in `role="menu"` confuse AT users who expect regular link navigation behavior.

**Correct approach**: Use native `<nav>` + `<ul>` + `<a>` for site navigation. Only use `role="menu"` for JavaScript command menus that execute actions.

```html
<!-- Wrong: nav links inside menu role -->
<div role="menu">
  <a role="menuitem" href="/home">Home</a>
  <a role="menuitem" href="/about">About</a>
</div>

<!-- Right: native nav -->
<nav aria-label="Main">
  <ul>
    <li><a href="/home">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

---

### 14. `aria-live` Updates on the Region Itself

**Novice thinking**: "I'll swap out the content of my `aria-live` div directly."

**Reality**: VoiceOver (macOS/iOS) requires live region updates to happen on a **direct child** of the live region, not the live region itself. Updating the `aria-live` element's own content is not reliably announced.

**Correct approach**: Always update a child element of the `aria-live` container.

```html
<!-- Wrong: updating aria-live element directly -->
<span aria-live="polite" id="status"></span>
<script>document.getElementById('status').textContent = 'Error!';</script>

<!-- Right: update child element -->
<span aria-live="polite">
  <span id="status-msg"></span>
</span>
<script>document.getElementById('status-msg').textContent = 'Error!';</script>
```

---

### 15. Omitting `role="list"` After Removing List Styles

**Novice thinking**: "Lists with `list-style: none` are still semantic lists."

**Reality**: Safari + VoiceOver strips list semantics from `<ul>` elements that have `list-style: none` applied via CSS. Navigating by heading/list landmark no longer announces the list.

**Timeline**: This has been VoiceOver behavior since ~2018. Apple's stance: if it looks like prose, it's prose.

**Correct approach**: Add `role="list"` explicitly when you style away list bullets but want list semantics preserved.

```html
<!-- Wrong: VoiceOver won't announce as list -->
<ul style="list-style: none;">
  <li>Item</li>
</ul>

<!-- Right -->
<ul role="list" style="list-style: none;">
  <li>Item</li>
</ul>
```
