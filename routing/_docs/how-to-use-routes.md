# How to use `@nu-art/thunder-routing`

Frontend routing using declarative route trees, processed by `ModuleFE_Routing` which wraps React Router v6.

---

## Core type: `TS_Route`

Every route is a plain object conforming to `TS_Route`:

```typescript
type TS_Route<T extends RouteParams = RouteParams> = {
	key: string;              // unique identifier — used for lookups and navigation
	path: string;             // URL segment, relative to parent
	Component?: React.ComponentType<any>;  // page component to render
	element?: React.ReactNode;             // alternative: pre-rendered ReactNode
	children?: TS_Route<any>[];            // nested child routes
	index?: boolean;          // if true, default child for the parent path
	fallback?: boolean;       // if true, catch-all route
	enabled?: () => boolean;  // gate function — route excluded from tree when returns false
	paramKeys?: (keyof T)[];  // typed route parameter keys
}
```

**Always use the explicit type annotation** when defining routes:

```typescript
import {TS_Route} from '@nu-art/thunder-routing';

export const Route_Page_MyPage: TS_Route = { ... };
```

---

## 1. Define routes (concept library)

Each concept library defines a single `routes.ts` at the UI root — **not** per-page `route.ts` files. Routes use `React.lazy` for the `Component` field so page modules are loaded on demand, not at import time.

```
my-concept/frontend/src/main/ui/
├── routes.ts                    ← all routes for this package
├── Page_MyPage/
│   └── Page_MyPage.tsx
├── Page_OtherPage/
│   └── Page_OtherPage.tsx
```

**`routes.ts`:**

```typescript
import {lazy} from 'react';
import type {TS_Route} from '@nu-art/thunder-routing';

export const Route_Page_MyPage: TS_Route = {
	path: 'my-page',
	key: 'my-page',
	Component: lazy(() => import('./Page_MyPage/Page_MyPage.js').then(m => ({default: m.APage_MyPage}))),
};

export const Route_Page_OtherPage: TS_Route = {
	path: 'other-page',
	key: 'other-page',
	Component: lazy(() => import('./Page_OtherPage/Page_OtherPage.js').then(m => ({default: m.APage_OtherPage}))),
};
```

**Why centralized + lazy:**
- Per-page `route.ts` files eagerly import page components. When two pages navigate to each other, the mutual `route.ts` imports create a circular dependency that causes `ReferenceError: Cannot access before initialization`.
- `React.lazy(() => import(...))` defers component resolution to render time — no page module is synchronously imported, so no cycle is possible.
- Bundlers (Vite, webpack) automatically code-split at `import()` boundaries — each page becomes its own chunk, loaded on demand.

**Note:** The `.then(m => ({default: m.APage_MyPage}))` adapter is needed because `React.lazy` expects a default export. This maps the named export to the shape `lazy` requires.

### Naming convention

- Route constant: `Route_Page_<Name>` (e.g. `Route_Page_Topics`, `Route_Page_AlertBots`)
- Route key: kebab-case, descriptive (e.g. `'topics-page'`, `'alert-bots-page'`)
- Route path: kebab-case URL segment (e.g. `'topics'`, `'alert-bots'`)

---

## 2. Export from package barrel

The concept library's top-level barrel re-exports the centralized routes file, page components, and the module pack:

**`my-concept/frontend/src/main/index.ts`:**

```typescript
export * from './_entity/myEntity/ModuleFE_MyEntity.js';
export * from './ui/routes.js';
export * from './ui/Page_MyPage/Page_MyPage.js';
export * from './ui/Page_OtherPage/Page_OtherPage.js';
export * from './module-pack.js';
```

This makes `Route_Page_MyPage` and `ModulePackFE_MyConcept` importable from `@app/my-concept-frontend`. Note: there are no per-page barrel `index.ts` files — each file is exported directly.

---

## 3. Add to module pack

Every concept library frontend must export a module pack with its modules. This pack gets registered in the app entry so modules are initialized by the Thunder lifecycle:

**`my-concept/frontend/src/main/module-pack.ts`:**

```typescript
import {Module} from '@nu-art/ts-common';
import {ModuleFE_MyEntity} from './_entity/myEntity/ModuleFE_MyEntity.js';

export const ModulePackFE_MyConcept: Module[] = [
	ModuleFE_MyEntity,
];
```

---

## 4. Compose into root route (app layer)

The app's root route imports child routes from all concept libraries and local pages, composing them into a tree:

**`app/frontend-vite/src/main/ui/pages/Page_Main/route.ts`:**

```typescript
import {TS_Route} from '@nu-art/thunder-routing';
import {Route_Page_Landing} from '../Page_Landing/route.js';
import {Route_Page_MyPage} from '@app/my-concept-frontend';
import {Page_Main} from './Page_Main.js';

export const Route_Page_Main: TS_Route = {
	path: '',
	key: 'root',
	Component: Page_Main,
	fallback: true,
	children: [
		Route_Page_Landing,
		Route_Page_MyPage,
	]
};
```

Child `path` values are **relative** to the parent. Since the root has `path: ''`, a child with `path: 'my-page'` resolves to `/my-page`.

---

## 5. Wire into app entry

The app entry registers all module packs and passes the root route to `ThunderstormDefaultApp`:

**`app/frontend-vite/src/main/index.tsx`:**

```typescript
import {Thunder} from '@nu-art/thunder-core';
import {ThunderstormDefaultApp} from '@nu-art/thunder-widgets';
import {Route_Page_Main} from './ui/pages/Page_Main/route.js';
import {ModulePackFE_MyConcept} from '@app/my-concept-frontend';

new Thunder(config)
	.addModulePack(ModulePackFE_MyConcept)
	.setMainApp(ThunderstormDefaultApp, {rootRoute: Route_Page_Main})
	.build();
```

Two things must happen here:
1. **`.addModulePack(ModulePackFE_MyConcept)`** — registers the concept's modules so they init properly.
2. **`.setMainApp(..., {rootRoute: Route_Page_Main})`** — passes the composed route tree. `ThunderstormDefaultApp` calls `ModuleFE_Routing.generateRoutes(rootRoute)` to build the React Router tree.

`ModuleFE_Routing` itself is exported as `ModulePackFE_Routing` from `@nu-art/thunder-routing` and should be included in the module packs if not already present.

---

## 6. Layout component with `<Outlet/>` and `<Suspense>`

The root page component (`Page_Main`) renders shared layout (sidebar, header) and an `<Outlet/>` where matched child routes render. Because routes use `React.lazy`, a `<Suspense>` boundary must wrap the outlet:

```typescript
import {Suspense} from 'react';
import {Outlet} from 'react-router-dom';

export class Page_Main extends AppPage {
	render() {
		return <LL_H_T className={'app-layout'}>
			{this.renderSidebar()}
			<div className={'app-layout__content'}>
				<Suspense>
					<Outlet/>
				</Suspense>
			</div>
		</LL_H_T>;
	}
}
```

Any route with `children` acts as a layout boundary — its `Component` must render `<Outlet/>` for children to appear. The `<Suspense>` boundary is required so React can show a fallback while lazy-loaded page chunks are being fetched.

---

## 7. Index routes

An **index route** is the default child rendered when the parent path matches exactly (no deeper segment).

```typescript
export const Route_Page_Landing: TS_Route = {
	path: '',
	key: 'landing-page',
	Component: Page_Landing,
	index: true,
};
```

- Set `index: true` on exactly **one** child per parent.
- If the index route has a non-empty `path`, the router generates a `<Navigate>` redirect to that path when the parent is visited directly.
- If the index route has an empty `path` (`''`), it renders the component inline as the default.
- Multiple index routes under the same parent throws `BadImplementationException`.

---

## 8. Fallback routes

A **fallback route** acts as a catch-all. When no sibling route matches, traffic falls through to this route.

```typescript
export const Route_Page_Main: TS_Route = {
	path: '',
	key: 'root',
	Component: Page_Main,
	fallback: true,
	children: [ ... ]
};
```

Typically set on the root route so unknown paths still render the main layout (rather than a blank page).

---

## 9. Route gating with `enabled`

A route can be conditionally excluded from the tree:

```typescript
export const Route_Page_Admin: TS_Route = {
	path: 'admin',
	key: 'admin-page',
	Component: Page_Admin,
	enabled: () => isUserAdmin(),
};
```

When `enabled()` returns `false`, the route is filtered out during tree building — it won't match any URL and won't appear in navigation.

---

## 10. Route parameters with `paramKeys`

For routes with dynamic URL segments:

```typescript
export const Route_Page_ArticleDetail: TS_Route<{ articleId: string }> = {
	path: 'articles/:articleId',
	key: 'article-detail',
	Component: Page_ArticleDetail,
	paramKeys: ['articleId'],
};
```

`paramKeys` declares which segments are parameters. Use `ModuleFE_Routing.goToRoute(route, { articleId: '123' })` to navigate with params filled in.

---

## 11. Navigation

### Cross-page navigation imports

Pages that navigate to other pages import route descriptors from the centralized `routes.ts` — **never** from per-page files or other page component files:

```typescript
// Correct — from the package's centralized routes
import {Route_Page_OtherPage} from '../routes.js';

// Correct — from another package (goes through its barrel)
import {Route_Page_ExternalPage} from '@app/other-concept-frontend';

// Wrong — per-page route.ts (creates circular deps)
import {Route_Page_OtherPage} from '../Page_OtherPage/route.js';
```

### Declarative: `TS_NavLink`

Wraps React Router's `NavLink`. Resolves the full path from the route's `key`:

```typescript
import {TS_NavLink} from '@nu-art/thunder-routing';

<TS_NavLink route={Route_Page_Topics} className={'nav-item'}>
	Topics
</TS_NavLink>
```

Props:
- `route` — the `TS_Route` object (required)
- `ignoreClickOnSameRoute` — if `true`, clicking while already on that route does nothing
- All other `NavLinkProps` are passed through (e.g. `className`, `style`)

`NavLink` automatically adds an `active` class when the current URL matches, useful for styling active nav items.

### Programmatic: `ModuleFE_Routing.goToRoute`

```typescript
import {ModuleFE_Routing} from '@nu-art/thunder-routing';

ModuleFE_Routing.goToRoute(Route_Page_Topics);
ModuleFE_Routing.goToRoute(Route_Page_ArticleDetail, { articleId: '123' });
ModuleFE_Routing.goToRoute(Route_Page_Topics, undefined, 'section-2'); // with hash
```

Pushes a new history entry. If the target URL is the same as the current URL, logs a warning and does nothing.

### Redirect (render-time)

Returns a `<Navigate>` element — use inside render methods:

```typescript
return ModuleFE_Routing.redirect(Route_Page_Landing);
```

### Low-level: `push` / `replace`

```typescript
ModuleFE_Routing.push({ pathname: '/custom-path', search: '?foo=bar' });
ModuleFE_Routing.replace({ pathname: '/custom-path' });
```

`push` adds a history entry; `replace` replaces the current entry (no back-button).

---

## 12. Query parameters

All methods are on `ModuleFE_Routing`:

| Method | Description |
|--------|-------------|
| `getQueryParams()` | Returns all query params as `{ [key]: value }`, decoded |
| `getQueryParameter(key)` | Single param value; `null` if key exists with empty value; `undefined` if key missing |
| `addQueryParam(key, value)` | Adds/updates one param (replaces current history entry) |
| `removeQueryParam(key)` | Removes one param (replaces current history entry) |
| `setQuery(params)` | Replaces all query params at once |

All query-param mutations use `replaceState` (no new history entry).

---

## 13. Location change listener

React to URL changes anywhere in the app by implementing the `OnLocationChanged` interface:

```typescript
import {OnLocationChanged} from '@nu-art/thunder-routing';

export class MyComponent
	extends ComponentSync
	implements OnLocationChanged {

	__onLocationChanged = (path: string) => {
		// path is window.location.pathname after the change
		this.reDeriveState();
	};
}
```

The dispatcher fires on every `popstate` event (browser back/forward, programmatic navigation).

---

## 14. URL utilities

| Method | Returns |
|--------|---------|
| `getCurrentUrl()` | `window.location.pathname` |
| `getOrigin()` | `window.location.origin` |
| `getCurrent()` | `{ pathname, search, hash }` |
| `getFullPath(routeKey)` | Full resolved path for a route key |
| `getRouteByKey(routeKey)` | The `TS_Route` object, or `undefined` |
| `getCurrentRouteKey()` | The `TS_Route` matching the current pathname |

---

## 15. Dev page route (TS_AppTools)

For the app-tools / dev page, use `TS_AppTools.createRoute()` which builds a route with auto-generated child routes from screen definitions:

```typescript
import {TS_AppTools} from '@nu-art/thunder-ui-modules';
import {TS_Route} from '@nu-art/thunder-routing';

export const Route_DevPage: TS_Route = TS_AppTools.createRoute(
	Page_Dev_Screens,
	'dev-page',
);
```

This is a special case — normal concept pages should define routes as plain `TS_Route` objects.

---

## Checklist: adding a new page

1. Create `Page_MyPage.tsx` component under `my-concept/frontend/src/main/ui/Page_MyPage/`
2. Add a `React.lazy` route entry in the package's centralized `ui/routes.ts`
3. Re-export the page component from the package barrel (`src/main/index.ts`) — routes are already exported via `routes.js`
4. Add route to `Route_Page_Main.children` in `app/frontend-vite/src/main/ui/pages/Page_Main/route.ts`
5. Ensure `ModulePackFE_MyConcept` is registered in `app/frontend-vite/src/main/index.tsx` via `.addModulePack()`
6. Add nav entry in `Page_Main.tsx` sidebar (if the page should appear in navigation)
7. Verify the app shell wraps `<Outlet/>` with `<Suspense>` (should already be in place)
