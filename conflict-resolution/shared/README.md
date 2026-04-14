# @nu-art/conflict-resolution-shared

Shared types for the conflict-resolution feature. Defines the contract for conflict resolution items and renderers used when the backend returns entity dependency errors (e.g. delete blocked by references). Used by `@nu-art/conflict-resolution-frontend`.

## Package purpose

Provides `ConflictResolutionItem<Proto>` and related types so frontend modules can register how each entity type is displayed and filtered in the conflict resolution UI. No backend package; shared is consumed only by the frontend.

## Installation and usage

- Add `@nu-art/conflict-resolution-shared` as a dependency in `__package.json` of the consuming package.
- Import types: `import type { ConflictResolutionItem } from '@nu-art/conflict-resolution-shared';`
- Use when registering conflict resolution items with `ModuleFE_ConflictResolution.registerConflictResolutionItem()` (in the frontend package).

## Key features

- **types.ts** — `ConflictResolutionItem<Proto>`: `dbKey`, `renderer`, `collectionRenderer`, `filterMapper`.
- **index.ts** — Re-exports all public types.

## API overview

- `ConflictResolutionItem<Proto>` — Describes how to render and filter one entity type in the conflict resolution panel. `Proto` extends `DBProto<any>` from ts-common.

## Dependencies

- `@nu-art/ts-common` — DBProto.
- `react` — ReactNode in renderer signatures.
- `@nu-art/thunderstorm-shared` — Used by frontend; shared has minimal deps.
- `@nu-art/ts-styles` — Optional styling types.

## Examples

Registering a conflict item (done in app/frontend using this package):

```ts
import type { ConflictResolutionItem } from '@nu-art/conflict-resolution-shared';
import { ModuleFE_ConflictResolution } from '@nu-art/conflict-resolution-frontend';

ModuleFE_ConflictResolution.registerConflictResolutionItem({
  dbKey: 'my-entity',
  renderer: (item) => item.label,
  collectionRenderer: () => 'My entity',
  filterMapper: (item) => [item.label, item.id],
});
```
