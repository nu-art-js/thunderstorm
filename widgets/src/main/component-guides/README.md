# Component guides router

Each tokenized / documented widget can register a **`WidgetComponentGuide`** entry:

- `id` — stable slug (matches design-language gallery id when applicable)
- `howToPath` — markdown how-to under `src/main/` (agent SSOT)
- `examples` — named runnable React demos
- `primaryExample` — default when only one sample is shown

```typescript
import {getWidgetComponentGuide, listWidgetComponentGuides} from '@nu-art/thunder-widgets/v3';

const tree = getWidgetComponentGuide('tree');
// tree.howToPath → 'component-guides/tree/how-to.md'
// tree.examples.catalog → Example_TreeCatalog
```

Add a folder under `component-guides/<id>/` and append to `registry.ts`. When widgets move into per-concept folders, move the guide folder with the component — the router shape stays the same.
