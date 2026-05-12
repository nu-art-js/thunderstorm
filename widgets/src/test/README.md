# Widgets test suite

Each component is tested in **complete isolation** — one component, one page, one point of failure. No shared rendering page.

## Layout

- **`index.html`** – single HTML shell that loads `_bootstrap/loader.tsx`.
- **`_bootstrap/loader.tsx`** – initializes Thunder, reads `?entry=` from URL, dynamically imports the matching entry file, renders it, and sets `window.TestReady`.
- **`_helpers/test-constants.ts`** – shared `testPage(entry)` (builds URL) and `waitForReady(page)` (waits for `TestReady` flag).
- **`<component>/`** – one folder per component, e.g. `input/`, `checkbox/`, `button/`.
  - **`entry--<variant>.tsx`** – renders exactly one component instance with one set of props. Default export.
  - **`render.test.playwright.ts`** – visibility tests per variant.
  - **`value.test.playwright.ts`**, **`toggle.test.playwright.ts`**, etc. – behaviour tests, each navigating to the specific entry page.

## Component folders – full coverage

| Folder | Simple tests | Complex tests |
|--------|--------------|----------------|
| `input/` | render | value (type, blur) |
| `checkbox/` | render | toggle |
| `button/` | render | click (callback, disabled, loading) |
| `label/` | render | content (text, className) |
| `link/` | render | href (children, ts-link, clickable) |
| `printable/` | render | — |
| `layouts/` | render | structure (children order, class) |
| `collapsable-container/` | render | expanded |
| `checkbox-group/` | render | content |
| `component-transition/` | render | trigger (show/hide) |
| `copy-to-clipboard/` | render | clipboard (copy text) |
| `toggle/` | render | toggle (checked state) |
| `slider/` | render | value (initial, min/max, change) |
| `read-more/` | render | expand (Read More/Less) |
| `radio/` | render | selection |
| `textarea/` | render | value |
| `tabs/` | render | selection |
| `table/` | render | content |
| `json-viewer/` | render | expand |
| `circular-loader/` | render | — |
| `progress-bar/` | render | progress |
| `three-dots-loader/` | render | — |
| `prop-renderer/` | render | states (error, disabled) |
| `show/` | render | — |
| `overlay/` | render | click |
| `button-group/` | render | selection |
| `video/` | render | — |
| `error-boundary/` | render | — |
| `dialog/` | render | — |
| `toaster/` | render | — |
| `dropdown/` | render | — |
| `tree/` | render | — |
| `virtualized-list/` | render | — |
| `list-organizer/` | render | — |
| `height-bounder/` | render | — |
| `memory-monitor/` | render | — |

Add new tests in the right folder and new files (e.g. `slider/value.test.playwright.ts`) when you add behaviour coverage.

## Running tests

From repo root with BAI:

```bash
bai -t -tt=playwright -up=widgets
```

Or with npx in the widgets package:

```bash
npx playwright test
```
