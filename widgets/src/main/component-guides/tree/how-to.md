# TS_Tree — how to use

Path (for agents): `@nu-art/thunder-widgets` → `src/main/component-guides/tree/how-to.md`

Runnable examples and router entry: `getWidgetComponentGuide('tree')` from `@nu-art/thunder-widgets/v3`.

---

## Two data schemas — pick one

| Schema | Data shape | Adapter | When |
|---|---|---|---|
| **Object tree** | Plain nested object `{ key: value \| nested }` | `AdapterBuilder().tree().singleRender(renderer).setData(data)` | Debug panels, JSON-like introspection, homogeneous nodes |
| **Typed tree** | Discriminated nodes `{ type, item, _children? }` | `AdapterBuilder().tree().multiRender(map).setData(data)` | Master–detail editors, per-type labels/icons/actions |

Do **not** pass plain objects to `multiRender` or typed nodes to `singleRender`.

---

## Typed tree — the reference pattern

### 1. Define `TreeType<>` once

Map each node `type` string to the payload shape carried in `item`:

```typescript
type CatalogTree = TreeType<{
  catalog: { title: string; version: string }
  group:   { label: string; childCount: number }
  entry:   { id: string; name: string; status: 'active' | 'draft' }
  settings:{ theme: string; density: 'compact' | 'comfortable' }
}>;
```

`TreeType` gives you parallel slots:

| Slot | Purpose |
|---|---|
| `nodeRenderer` | Tree row label (per `type`) |
| `rendererV3` | Detail panel when node is selected |
| `action` | Optional context-menu handlers per `type` |
| `nodeType` | Discriminated union of the whole tree |

See `catalog-tree.types.ts` in this folder.

### 2. Build data with `_children`

Only `_children` nests typed nodes (adapter sets `childrenKey = '_children'`):

```typescript
const data: CatalogTree['nodeType'] = {
  type: 'catalog',
  item: { title: '…', version: '1.0' },
  _children: [
    {
      type: 'group',
      item: { label: 'Components', childCount: 3 },
      _children: [
        { type: 'entry', item: { id: 'button', name: 'Button', status: 'active' } },
      ],
    },
  ],
};
```

See `catalog-tree.data.ts` → `createCatalogTreeData()`.

### 3. Wire `nodeRenderer` + detail maps

```typescript
const treeRendererMap: CatalogTree['nodeRenderer'] = { catalog, group, entry, settings };
const selectionRendererMap: CatalogTree['rendererV3'] = { catalog, group, entry, settings };

const adapter = AdapterBuilder()
  .tree()
  .multiRender(treeRendererMap)
  .setData(data)
  .build();
```

See `catalog-tree.maps.tsx`.

### 4. Master–detail + selection

```typescript
const selected = TS_TreeClass.resolveItemFromPath(data, selectedPath)
  ?? TS_TreeClass.resolveItemFromPath(data, '/');

<TS_Tree
  id="my-tree"
  adapter={adapter}
  selectedPath={selectedPath}
  onNodeClicked={(path, item: CatalogTree['nodeType']) => {
    if (selectionRendererMap[item.type])
      setSelectedPath(path);
  }}
  checkExpanded={(expanded, path) => expanded[path] ?? path.split('/').length <= 3}
/>

const Detail = selectionRendererMap[selected.type];
return Detail ? <Detail {...selected.item} /> : null;
```

Import `TS_TreeClass` from `@nu-art/thunder-widgets/v3` — the v3 `TS_Tree` export is a function wrapper; static helpers stay on the class.

Only types present in `selectionRendererMap` should update selection (groups without a panel can stay expand-only).

Path resolution: `TS_Tree.resolveItemFromPath(data, '/_children/0/_children/1/')` — segments are numeric indices into `_children` arrays after `adjust()` flattens the typed node.

See `Example_TreeCatalog.tsx`.

### 5. Chevron expand/collapse (branch nodes only)

Default adapter wiring toggles expand on the **whole row**. For caret-only expand on branches and no toggle on leaves:

```typescript
import {TreeExpandCollapseChevron, wrapTreeNodeWithCaret} from '@nu-art/thunder-widgets/v3';

AdapterBuilder()
  .tree()
  .multiRender(treeRendererMap)
  .setExpandCollapseRenderer(TreeExpandCollapseChevron)
  .setNodeRenderer(wrapTreeNodeWithCaret(props => (
    <RowRenderer item={props.item.item} node={props.node} />
  )))
  .setData(data)
  .build();
```

- **Branch nodes** — chevron button calls `expandToggler` (with `stopPropagation` so row click selects only).
- **Leaf nodes** — inert spacer (`.ts-tree__caret--leaf`), no expand handler.

See `adapter/tree/TreeCaret.tsx` and `catalog-tree.maps.tsx` → `buildCatalogTreeAdapter`.

---

## Object tree — simple pattern

```typescript
const data = { workspace: { components: { Button: 'widget' } } };

const adapter = AdapterBuilder()
  .tree()
  .singleRender(props => <span>{props.node.propKey}</span>)
  .setData(data)
  .build();

<TS_Tree id="debug-tree" adapter={adapter} checkExpanded={…} />
```

See `Example_TreeObject.tsx`.

---

## Gallery / agent entry points

| Export | Role |
|---|---|
| `getWidgetComponentGuide('tree')` | Router entry — `howToPath`, `examples`, `primaryExample` |
| `Example_TreeObject` | Sample A (object tree) |
| `Example_TreeCatalog` | Sample B (typed catalog + detail panel) |
| `createCatalogTreeData` | Copy-paste starting data |
| `buildCatalogTreeAdapter` | Copy-paste adapter factory |

Design-language gallery: `Preview_Tree.tsx` in `@app/ui-foundation-frontend` renders both examples via the guide router.

---

## Anti-patterns

- Using `singleRender` with `{ type, item, _children }` nodes — types are ignored.
- Using `multiRender` without a `type` field on every node — adapter throws at render time.
- Putting domain entities in the widget package — keep generic catalog types here; map real domain data in your app.
- Duplicating how-to in app `_docs` — this file is the SSOT until component folders move per widget reorganization.

---

## Related API

- `TS_Tree`, `Props_Tree` — `adapter/tree/v1/TS_Tree.tsx` (v3 re-exports)
- `AdapterBuilder`, `TreeType`, `NodeRendererProps` — `adapter/Adapter.tsx`
- `SimpleTreeNodeRenderer` — default object-tree node chrome
