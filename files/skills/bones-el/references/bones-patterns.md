# BONES Widget Patterns — Full Reference

Complete HTML markup patterns from BONES. All patterns follow:
- Progressive Enhancement (semantic HTML works without JS/CSS)
- BEM naming convention
- ARIA only where strictly necessary
- Native HTML elements preferred over ARIA roles

---

## Accordion

A list of `<details>` disclosure widgets. Each `<summary>` contains a heading.

```html
<ul class="accordion" role="list" aria-roledescription="accordion">
  <li>
    <details class="details">
      <summary><h3>Panel 1</h3></summary>
      <ul>
        <li><a href="/page">Item 1</a></li>
        <li><a href="/page">Item 2</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details class="details">
      <summary><h3>Panel 2</h3></summary>
      <ul>
        <li><a href="/page">Item 1</a></li>
      </ul>
    </details>
  </li>
</ul>
```

**Key notes**:
- `role="list"` restores list semantics removed by CSS (`list-style: none`)
- `aria-roledescription="accordion"` provides a better name than "list" for AT
- No JavaScript required for basic open/close — `<details>` handles it natively

---

## Alert Dialog

A modal dialog for critical messages requiring user acknowledgment. Single confirm button.

```html
<body>
  <div><!-- main page content --></div>
  <div class="alert-dialog" role="alertdialog" aria-labelledby="alert-dialog-title" aria-modal="true" hidden>
    <div class="alert-dialog__window">
      <div class="alert-dialog__header">
        <h2 class="alert-dialog__title" id="alert-dialog-title">Alert Dialog Title</h2>
      </div>
      <div class="alert-dialog__main">
        <!-- alert content -->
      </div>
      <div class="alert-dialog__footer">
        <button class="alert-dialog__acknowledge" type="button">OK</button>
      </div>
    </div>
  </div>
</body>
```

**Key notes**:
- `role="alertdialog"` (not `role="dialog"`) — AT announces immediately
- `aria-modal="true"` prevents virtual cursor from leaving dialog
- Main page content in sibling div (not ancestor) simplifies JS focus trap
- Start `hidden`; JS removes `hidden` to show

---

## Breadcrumbs

Ordered list of links in a navigation landmark.

```html
<nav class="breadcrumbs" aria-labelledby="breadcrumbs_heading">
  <h2 class="clipped" id="breadcrumbs_heading">You are here</h2>
  <ol>
    <li>
      <a href="/grandparent">Grandparent Page</a>
      <svg focusable="false" height="10" width="10" aria-hidden="true">
        <use xlink:href="#icon-breadcrumb"></use>
      </svg>
    </li>
    <li>
      <a href="/parent">Parent Page</a>
      <svg focusable="false" height="10" width="10" aria-hidden="true">
        <use xlink:href="#icon-breadcrumb"></use>
      </svg>
    </li>
    <li>
      <a aria-current="page">Current Page</a>
    </li>
  </ol>
</nav>
```

**Key notes**:
- `.clipped` visually hides heading but keeps it for AT (use CSS clip-path, not `display: none`)
- SVG separator with `aria-hidden="true"` — decorative only
- Last item: `aria-current="page"`, no href needed (or keep href if page is directly linkable)
- Use `<ol>` (ordered), not `<ul>` — order matters for breadcrumbs

---

## Carousel

Group of items with scrolling navigation. JS manages aria-hidden on off-screen items.

```html
<div class="carousel" role="group" aria-labelledby="carousel-title" aria-roledescription="carousel">
  <button aria-label="Previous slide">
    <svg aria-hidden="true" focusable="false"><!-- icon --></svg>
  </button>
  <ul>
    <!-- On-screen items: aria-hidden="false" -->
    <li aria-hidden="false">...</li>
    <li aria-hidden="false">...</li>
    <!-- Off-screen items: aria-hidden="true" -->
    <li aria-hidden="true">...</li>
    <li aria-hidden="true">...</li>
  </ul>
  <button aria-label="Next slide">
    <svg aria-hidden="true" focusable="false"><!-- icon --></svg>
  </button>
</div>
```

**Key notes**:
- JavaScript must toggle `aria-hidden` AND `tabindex="-1"` on off-screen item focusable children
- `role="group"` with `aria-roledescription="carousel"` — better UX than generic group name
- Navigation buttons need descriptive `aria-label` (not just "prev"/"next")

---

## Checkbox Group

Native checkboxes in a fieldset — 100% accessible with no ARIA.

```html
<fieldset>
  <legend>Auction Type</legend>
  <span>
    <input id="freeshipping" type="checkbox" name="freeshipping" />
    <label for="freeshipping">Free Shipping</label>
  </span>
  <span>
    <input id="endssoon" type="checkbox" name="endssoon" />
    <label for="endssoon">Ends soon</label>
  </span>
</fieldset>
```

For vertical stacking: switch `<span>` to `<div>`.

### Custom Checkbox (SVG Facade)

```html
<span class="checkbox">
  <input class="checkbox__control" id="freeshipping" type="checkbox" name="freeshipping" />
  <span class="checkbox__icon" hidden>
    <svg aria-hidden="true" class="checkbox__unchecked" focusable="false">
      <use xlink:href="#icon-checkbox-unchecked"></use>
    </svg>
    <svg aria-hidden="true" class="checkbox__checked" focusable="false">
      <use xlink:href="#icon-checkbox-checked"></use>
    </svg>
  </span>
</span>
```

**Key notes**: `hidden` on the icon span ensures native checkbox shows in no-CSS state. CSS must `display: block` to override.

---

## Combobox

Textbox + listbox combination. For autocomplete/autosuggest.

**Collapsed**:
```html
<div class="combobox" id="combobox-1">
  <span class="combobox__control">
    <input name="combobox-1-name" type="text" role="combobox" 
           autocomplete="off" aria-expanded="false" aria-owns="combobox-1-listbox" />
  </span>
  <div class="combobox__overlay">
    <ul id="combobox-1-listbox" role="listbox">
      <li role="option" id="combobox-1-option-1">Option 1</li>
      <li role="option" id="combobox-1-option-2">Option 2</li>
    </ul>
  </div>
</div>
```

**Expanded**: Add `combobox--expanded` modifier class; change `aria-expanded="true"`.

**Key notes**: JS must update `aria-activedescendant` on the input to reflect the active listbox option.

---

## Confirm Dialog

Modal with cancel + confirm buttons.

```html
<body>
  <div><!-- main page content --></div>
  <div class="confirm-dialog" role="dialog" aria-labelledby="confirm-dialog-title" aria-modal="true" hidden>
    <div class="confirm-dialog__window">
      <div class="confirm-dialog__header">
        <h2 class="confirm-dialog__title" id="confirm-dialog-title">Confirm Dialog Title</h2>
      </div>
      <div class="confirm-dialog__main">
        <!-- confirm content -->
      </div>
      <div class="confirm-dialog__footer">
        <button class="confirm-dialog__cancel" type="button">Cancel</button>
        <button class="confirm-dialog__confirm" type="button">OK</button>
      </div>
    </div>
  </div>
</body>
```

---

## Details (Disclosure)

Native HTML disclosure widget.

```html
<details class="details">
  <summary>Details heading</summary>
  <ul>
    <li><a href="/page">Link 1</a></li>
    <li><a href="/page">Link 2</a></li>
  </ul>
</details>
```

---

## Fake Menu (Navigation List)

List of links/buttons styled like a menu. Navigation semantics, not menu semantics.

```html
<ul>
  <li><a href="/page">Link Text</a></li>
  <li><button type="button">Button Text</button></li>
  <li><a href="/current" aria-current="page">Current Page</a></li>
</ul>
```

**Key distinction**: Use `<ul>` of links/buttons for navigation. Only use `role="menu"` for JS-driven command menus (not navigation).

---

## Fake Menu Button

Button that opens a fake menu (navigation list), not a ARIA menu.

```html
<div class="fake-menu">
  <button aria-expanded="false">Fake Menu</button>
  <div hidden>
    <ul>
      <li><a href="/page">Link Text</a></li>
      <li><button type="button">Button Text</button></li>
    </ul>
  </div>
</div>
```

---

## Fake Tabs (Navigation)

Links styled as tabs — page navigation, not ARIA tabs.

```html
<nav aria-labelledby="fake-tabs-title" class="fake-tabs">
  <h2 class="clipped" id="fake-tabs-title">Fake Tabs Heading</h2>
  <ul>
    <li><a aria-current="page" href="/page/1">Page 1</a></li>
    <li><a href="/page/2">Page 2</a></li>
    <li><a href="/page/3">Page 3</a></li>
  </ul>
</nav>
```

**Use over ARIA tabs when**: Each tab navigates to a new URL. ARIA tabs are for client-side panel switching only.

---

## Icon Button

Button or link with only an icon — requires accessible label.

```html
<!-- Button -->
<button class="icon-btn" type="button" aria-label="Menu">
  <svg class="icon" focusable="false" width="16" height="16" aria-hidden="true">
    <use xlink:href="icons.svg#icon-menu"></use>
  </svg>
</button>

<!-- Link -->
<a class="icon-link" href="/home" aria-label="Home">
  <svg class="icon" focusable="false" width="16" height="16" aria-hidden="true">
    <use xlink:href="icons.svg#icon-home"></use>
  </svg>
</a>
```

---

## Infotip

Click-triggered popover with pointer arrow and close button.

```html
<span class="infotip">
  <button class="infotip__host" type="button" aria-expanded="false" aria-label="Help">
    <svg focusable="false" width="16" height="16" aria-hidden="true">
      <use xlink:href="#icon-information-small"></use>
    </svg>
  </button>
  <div class="infotip__overlay">
    <span class="infotip__pointer infotip__pointer--bottom-center"></span>
    <div class="infotip__mask">
      <div class="infotip__cell">
        <div class="infotip__content">
          <h3 class="infotip__heading">Infotip Title</h3>
          <!-- content -->
        </div>
        <button class="infotip__close" type="button" aria-label="Dismiss infotip">
          <svg focusable="false" height="24" width="24" aria-hidden="true">
            <use xlink:href="#icon-close"></use>
          </svg>
        </button>
      </div>
    </div>
  </div>
</span>
```

---

## Inline Notice

Status message with icon. If client-rendered, wrap in live region.

```html
<div class="inline-notice inline-notice--confirmation">
  <span class="inline-notice__header">
    <svg focusable="false" height="16" width="16" role="img" aria-label="Confirmation">
      <use xlink:href="#icon-confirmation-filled"></use>
    </svg>
  </span>
  <span class="inline-notice__main">
    <p>Notice Copy</p>
  </span>
</div>
```

For dynamic updates: wrap in `<div aria-live="polite" role="status">`.

---

## Input Validation

Live region pattern for client-side form validation messages.

```html
<div class="input-validation">
  <span>
    <label for="input1">Input 1</label>
    <input aria-describedby="input1-description" aria-invalid="false" 
           id="input1" name="input1" type="text" />
  </span>
  <span aria-live="polite" class="input-validation__status" role="status">
    <span class="input-validation__description" id="input1-description">
      <!-- Empty when valid; populated with error message when invalid -->
    </span>
  </span>
</div>
```

**Key notes**:
- Live region updates must happen on a **direct descendant** of the `aria-live` element (not the element itself) for VoiceOver compatibility
- Set `aria-invalid="true"` on input in invalid state
- `aria-describedby` links the input to its description (same ID as the live region content)

---

## Lightbox Dialog

Base modal pattern. Other dialog types (alert, confirm, input) extend this.

```html
<div class="lightbox-dialog" role="dialog" aria-labelledby="lightbox-dialog-title" aria-modal="true">
  <div class="lightbox-dialog__window">
    <div class="lightbox-dialog__header">
      <h2 class="lightbox-dialog__title" id="lightbox-dialog-title">Dialog Title</h2>
      <button aria-label="Close dialog" class="lightbox-dialog__close" type="button"></button>
    </div>
    <div class="lightbox-dialog__main">
      <!-- dialog content -->
    </div>
  </div>
</div>
```

---

## Listbox

JavaScript alternative to `<select multiple>`. Keyboard-navigable option list.

```html
<span class="listbox">
  <div role="listbox" tabindex="0">
    <div class="listbox__option" role="option" aria-selected="false">
      <span>Option 1</span>
      <span class="listbox__status"></span>
    </div>
    <div class="listbox__option" role="option" aria-selected="true">
      <span>Option 2</span>
      <span class="listbox__status"></span>
    </div>
  </div>
</span>
```

---

## Listbox Button

Button that opens a listbox.

```html
<span class="listbox-button">
  <button class="listbox-button__button" aria-expanded="false" aria-haspopup="listbox">
    <span>
      <span>Selected Option</span>
      <span class="listbox-button__icon-expand"></span>
    </span>
  </button>
  <div class="listbox-button__listbox" hidden>
    <div role="listbox" tabindex="0">
      <div class="listbox__option" role="option" aria-selected="true">
        <span>Option 1</span>
        <span class="listbox__status"></span>
      </div>
    </div>
  </div>
</span>
```

---

## Menu

ARIA menu for JavaScript command execution (not navigation).

```html
<!-- Single group -->
<div class="menu">
  <div role="menu">
    <div role="menuitem" tabindex="0">Command 1</div>
    <div role="menuitem" tabindex="-1">Command 2</div>
  </div>
</div>

<!-- Multiple groups with radio and checkbox items -->
<div class="menu">
  <div role="menu">
    <div role="presentation">
      <div role="menuitem" tabindex="0">Action 1</div>
    </div>
    <hr />
    <div role="presentation">
      <div aria-checked="true" role="menuitemradio" tabindex="-1">View: List</div>
      <div aria-checked="false" role="menuitemradio" tabindex="-1">View: Grid</div>
    </div>
    <hr />
    <div role="presentation">
      <div aria-checked="true" role="menuitemcheckbox" tabindex="-1">Show labels</div>
    </div>
  </div>
</div>
```

**Key notes**: `role="presentation"` on group wrappers removes group semantics (intentional).

---

## Menu Button

Button that opens an ARIA menu popover.

```html
<div class="menu-button">
  <button aria-expanded="false" aria-haspopup="true" class="menu-button__button">
    <span>
      <span>Open Menu</span>
      <span class="menu-button__icon-expand"></span>
    </span>
  </button>
  <div class="menu-button__menu" hidden>
    <div role="menu">
      <div role="menuitem" tabindex="0">Item 1</div>
      <div role="menuitem" tabindex="-1">Item 2</div>
    </div>
  </div>
</div>
```

---

## Page Notice

Prominent page-level messaging with optional live region.

```html
<span aria-live="polite">
  <section class="page-notice page-notice--information" aria-label="Information">
    <div class="page-notice__header">
      <svg focusable="false" height="24" width="24" role="img" aria-label="Information">
        <use xlink:href="#icon-information"></use>
      </svg>
    </div>
    <div class="page-notice__main">
      <h2 class="page-notice__title">Title</h2>
      <p>Copy</p>
    </div>
    <div class="page-notice__footer">
      <a href="https://example.com" class="page-notice__cta">Call to action</a>
    </div>
  </section>
</span>
```

Remove `aria-live` wrapper if server-rendered with no dynamic updates.

---

## Pagination

Navigation landmark for page result sets.

```html
<nav class="pagination" aria-labelledby="pagination-heading">
  <span aria-live="off">
    <h2 id="pagination-heading" class="clipped">Results Pagination - Page 1</h2>
  </span>
  <a aria-disabled="true" aria-label="Previous Page" class="pagination__previous" href="1.html">
    <svg aria-hidden="true"><use xlink:href="#icon-chevron-left"></use></svg>
  </a>
  <ol>
    <li><a aria-current="page" href="1.html">1</a></li>
    <li><a href="2.html">2</a></li>
    <li><a href="3.html">3</a></li>
  </ol>
  <a aria-label="Next Page" class="pagination__next" href="2.html">
    <svg aria-hidden="true"><use xlink:href="#icon-chevron-right"></use></svg>
  </a>
</nav>
```

Enable `aria-live="polite"` on heading span for client-side pagination updates.

---

## Panel Dialog

Modal dialog flush to one edge of screen (drawer pattern).

```html
<div aria-labelledby="dialog-title" aria-modal="true" class="panel-dialog" hidden role="dialog">
  <div class="panel-dialog__window">
    <div class="panel-dialog__header">
      <h2 id="dialog-title" class="panel-dialog__title">Panel Dialog Title</h2>
      <button aria-label="Close dialog" class="icon-btn panel-dialog__close" type="button">
        <svg aria-hidden="true" focusable="false" height="16" width="16">
          <use xlink:href="#icon-close"></use>
        </svg>
      </button>
    </div>
    <div class="panel-dialog__main"><!-- content --></div>
    <div class="panel-dialog__footer"><!-- optional --></div>
  </div>
</div>
```

---

## Popover

Generic expandable overlay. Base pattern for tooltips, menus, infotips.

```html
<div class="popover">
  <button class="popover__host" aria-expanded="false">Host Button</button>
  <div class="popover__overlay">
    <!-- overlay content -->
  </div>
</div>
```

Overlay must immediately follow host in DOM for correct reading order.

---

## Radio Group

Native radio buttons in fieldset — 100% accessible.

```html
<fieldset>
  <legend>Radio Group Title</legend>
  <span>
    <input id="radio-group1_input1" name="radio-group1" type="radio" value="1" checked />
    <label for="radio-group1_input1">Option 1</label>
  </span>
  <span>
    <input id="radio-group1_input2" name="radio-group1" type="radio" value="2" />
    <label for="radio-group1_input2">Option 2</label>
  </span>
</fieldset>
```

For vertical stacking: switch `<span>` to `<div>`.

---

## Select

Native `<select>` with custom SVG indicator.

```html
<span class="select">
  <select name="options">
    <option value="item1">Option 1</option>
    <option value="item2">Option 2</option>
  </select>
  <svg class="icon icon--dropdown" focusable="false" height="8" width="8" aria-hidden="true">
    <use xlink:href="#icon-dropdown"></use>
  </svg>
</span>
```

---

## Switch

Toggle for immediate JavaScript state change (not form submission).

```html
<!-- Non-form switch -->
<span class="switch">
  <span class="switch__control" role="switch" tabindex="0" aria-checked="false"></span>
  <span class="switch__button"></span>
</span>

<!-- Form-capable switch (checkbox under the hood) -->
<span class="switch">
  <input class="switch__control" role="switch" type="checkbox" aria-checked="false" />
  <span class="switch__button"></span>
</span>
```

---

## Tabs

Client-side tab panels with roving tabindex.

```html
<div class="tabs" id="tabs-1">
  <h2 class="clipped">Tabs Heading</h2>
  <div class="tabs__items" role="tablist">
    <div class="tabs__item" role="tab" aria-controls="tabs-1-panel-1" 
         aria-selected="true" id="tabs1_tab1" tabindex="0">
      <span>Tab 1</span>
    </div>
    <div class="tabs__item" role="tab" aria-controls="tabs-1-panel-2" 
         aria-selected="false" id="tabs1_tab2" tabindex="-1">
      <span>Tab 2</span>
    </div>
  </div>
  <div class="tabs__content">
    <div aria-labelledby="tabs1_tab1" class="tabs__panel" role="tabpanel" id="tabs-1-panel-1">
      <h3>Panel 1 heading</h3>
    </div>
    <div aria-labelledby="tabs1_tab2" class="tabs__panel" role="tabpanel" hidden id="tabs-1-panel-2">
      <h3>Panel 2 heading</h3>
    </div>
  </div>
</div>
```

**Key notes**: Roving tabindex — active tab has `tabindex="0"`, all others `tabindex="-1"`. JS moves focus with arrow keys.

---

## Toast Dialog

Non-modal transient notification. Must not steal focus.

```html
<div role="status">
  <aside aria-label="Notification" aria-modal="false" class="toast-dialog" role="dialog" hidden>
    <div class="toast-dialog__window">
      <div class="toast-dialog__header">
        <h2 class="toast-dialog__title"><!-- heading --></h2>
        <button class="toast-dialog__close" type="button" aria-label="Close notification dialog">
          <svg focusable="false" height="24" width="24" aria-hidden="true">
            <use xlink:href="#icon-close"></use>
          </svg>
        </button>
      </div>
      <div class="toast-dialog__main"><!-- content --></div>
      <div class="toast-dialog__footer">
        <a accesskey="a" class="toast-dialog__cta" href="/action">Action</a>
      </div>
    </div>
  </aside>
</div>
```

**Key notes**:
- `role="status"` on outer div — live region; toggling `hidden` on aside triggers announcement
- `aria-modal="false"` — non-modal; keyboard must not be trapped
- `accesskey` on CTA: first letter of CTA label text defines the value

---

## Tooltip

Visible on hover AND focus. Describes the host element (not its action).

```html
<span class="tooltip">
  <button class="tooltip__host" aria-describedby="tooltip-0" aria-label="Settings">
    <svg focusable="false" height="16" width="16" aria-hidden="true">
      <use xlink:href="#icon-settings"></use>
    </svg>
  </button>
  <div class="tooltip__overlay" id="tooltip-0" role="tooltip">
    <span class="tooltip__pointer"></span>
    <div class="tooltip__mask">
      <div class="tooltip__cell">
        <div class="tooltip__content">Settings</div>
      </div>
    </div>
  </div>
</span>
```

Expanded state: use modifier class `tooltip--expanded`, NOT `aria-expanded` (reserved for true popovers).

---

## Tourtip

Persistent educational tip, visible on page load. Dismissible.

```html
<div class="tourtip tourtip--expanded">
  <button class="tourtip__host" aria-label="Settings">
    <svg focusable="false" height="16" width="16" aria-hidden="true">
      <use xlink:href="#icon-settings"></use>
    </svg>
  </button>
  <div class="tourtip__overlay" role="region" aria-labelledby="tourtip-label">
    <span class="tourtip__pointer"></span>
    <div class="tourtip__mask">
      <div class="tourtip__cell">
        <span class="tourtip__content">
          <h2 class="tourtip__heading" id="tourtip-label">Tourtip Title</h2>
          <!-- content -->
        </span>
        <button class="tourtip__close" type="button" aria-label="Dismiss tip">
          <svg focusable="false" height="24" width="24" aria-hidden="true">
            <use xlink:href="#icon-close"></use>
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>
```
