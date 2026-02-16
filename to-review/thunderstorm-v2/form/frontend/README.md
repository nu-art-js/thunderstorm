# @nu-art/thunder-form

Form components and Form V3 for Thunderstorm. This package is **decoupled from widgets**: it depends on **@nu-art/editable-item** and **@nu-art/thunder-widgets** (for `ComponentSync`, `TS_PropRenderer`, layout). Use it when building forms that integrate with `EditableItem`.

## Contents

- **TS_Form** — Class form shell (value-based; can be wired to EditableItem by consumers).
- **Form / Component_Form** — Declarative form with `Form<T>`, `FormRenderer<T>`, value and `onAccept`.
- **Form V3** — `Component_FormV3`: form driven by `EditableItem<T>` and per-property renderers (editable editors). Use `@nu-art/thunder-form/v3` for the v3 entry.

## Entry points

- **Default** (`@nu-art/thunder-form`): TS_Form, Form, Component_Form, and shared types.
- **v3** (`@nu-art/thunder-form/v3`): Same plus FormV3, Component_FormV3, and form-v3 types.

## Usage

### Form V3 (EditableItem-based)

```ts
import { Component_FormV3 } from '@nu-art/thunder-form/v3';
import { EditableItem } from '@nu-art/editable-item';
import { TS_InputV2 } from '@nu-art/thunder-widgets';

const NameInput = TS_InputV2.editable({ type: 'text', saveEvent: ['blur'] });

<Component_FormV3
  editable={editable}
  renderers={{
    name: { label: 'Name', editor: NameInput },
  }}
/>
```

### Declarative Form (value + onAccept)

```ts
import { Form, Component_Form } from '@nu-art/thunder-form';
// Define Form<T> and FormRenderer<T>, then:
<Component_Form form={form} renderer={renderer} value={value} onAccept={onAccept} />
```

## Build

Build runs with **BAI** (Build-And-Install). From the project root:

- **This package and its deps:** `bash ./build-and-install.sh -up=thunder-form --build-tree`
- **Full monorepo:** `bash ./build-and-install.sh`

BAI discovers this package via `__package.json`. Use `--build-tree` so editable-item and thunder-widgets are built first and resolve correctly.

## Dependencies

- **@nu-art/editable-item** — EditableItem, UIProps_EditableItem (for Form V3).
- **@nu-art/thunder-widgets** — ComponentSync, TS_PropRenderer (and layout classes if used by app).
- **@nu-art/ts-common**, **react**, **react-dom**.
