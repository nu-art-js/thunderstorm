# Migrate frontend API module to @ApiCaller decorator

## Problem

Frontend modules use the old pattern:

- A versioned property: `readonly v1` / `_v1` / `vv1` (or other names) typed as `ApiDefCaller<ApiStruct_*>['v1']` or a manual type
- Constructor assigns: `this.v1 = { endpoint: apiWithBody(apiDef, onComplete), ... }` (or `apiWithQuery` for GET/DELETE)
- Imports `apiWithBody`, `apiWithQuery` from `@nu-art/thunderstorm-frontend`
- Imports `ApiDefCaller` (and optionally `ApiStruct`) from `@nu-art/thunderstorm-shared`
- Optional: `implements ApiDefCaller<ApiStruct_*>` on the class

Callers use `Module.myEndpoint(payload).executeSync()` or `.execute(callback)`.

The new pattern uses the `@ApiCaller` decorator from `@nu-art/http-client`: each endpoint becomes a decorated method that returns a `Promise<Response>` directly. No versioned property object; callers use `await Module.myEndpoint(payload)`.

## How to migrate

### 1. Identify the old pattern

- Find the **versioned property**: `readonly v1` / `_v1` / `vv1` or similar.
- Note its **type**: `ApiDefCaller<ApiStruct_*>['v1']` or a manually constructed type.
- Locate the **constructor block**: `this.v1 = { ... apiWithBody(...), apiWithQuery(...) ... }`.
- Note **imports**: `apiWithBody`, `apiWithQuery` from thunderstorm-frontend; `ApiDefCaller` from thunderstorm-shared.
- If the class has `implements ApiDefCaller<ApiStruct_*>`, you will remove it.

### 2. Shared side prerequisite (if needed)

- If the API types use **nested ApiStruct** (e.g. `{ v1: { endpoint: BodyApi<...> } }`), flatten to a **flat API type** (e.g. `API_Foo = { endpoint: BodyApi<...> }`) and a flat `ApiDefResolver<API_Foo>`. Import types from `@nu-art/api-types` (not thunderstorm-shared). See [api-struct-flatten-to-v2-api-type.md](api-struct-flatten-to-v2-api-type.md) and [api-struct-flatten-remove-v1-wrapper.md](api-struct-flatten-remove-v1-wrapper.md) if applicable.
- If the API types are **already flat** (e.g. `API_UserAccount` with top-level keys), no shared-side change is needed.

### 3. Module class — replace each endpoint with @ApiCaller

For each endpoint in the old versioned property object:

**Old:**

```typescript
this.v1 = {
	myEndpoint: apiWithBody(ApiDef_Foo.myEndpoint, this.onMyEndpointComplete),
};
```

**New:**

```typescript
@ApiCaller(ApiDef_Foo.myEndpoint, {
	onComplete: (m, ctx) => m.onMyEndpointComplete(ctx)
})
async myEndpoint(body: API_Foo['myEndpoint']['Body']): Promise<API_Foo['myEndpoint']['Response']> {
	void body;
	return undefined as unknown as API_Foo['myEndpoint']['Response'];
}
```

- **Body endpoints** (POST/PUT/PATCH): method parameter type is `API_*['endpoint']['Body']`.
- **Query endpoints** (GET/DELETE): method parameter type is `API_*['endpoint']['Params']`.
- If the endpoint has **no onComplete callback**, use `@ApiCaller(ApiDef_Foo.myEndpoint)` only (no second argument).
- Any pre-call logic (validation, cleanup) goes in the method body before the `void` / `return`.

### 4. Callback signature migration

Old `onComplete` callbacks receive the raw response: `(response: ResponseType) => Promise<any>`.

New `onComplete` receives `(module, ctx: ApiCallContext<API>)` where `ctx.response` is the typed response.

Update each private callback:

- **Old:** `private onFoo = async (response: SomeType) => { ... }`
- **New:** `private onFoo = async (ctx: ApiCallContext<API_Foo['myEndpoint']>) => { ... }` and use `ctx.response` instead of `response`.

### 5. Internal call sites (within the same module)

- **Old:** `this._v1.myEndpoint(payload).executeSync()`
- **New:** `await this.myEndpoint(payload)`

- **Old:** `this._v1.myEndpoint(payload).execute(callback)`
- **New:** `await this.myEndpoint(payload)` — the callback is either in `onComplete` on the decorator or passed as the second argument `userCallback` to the method.

### 6. Cleanup

- Remove the versioned property declaration (`readonly v1` / `_v1` / `vv1`).
- Remove the entire constructor block that assigned the versioned property.
- Remove `implements ApiDefCaller<...>` from the class declaration.
- Remove imports: `apiWithBody`, `apiWithQuery` from thunderstorm-frontend; `ApiDefCaller`, `ApiStruct_*` from thunderstorm-shared (if only used for the caller type).
- Add imports: `ApiCaller` from `@nu-art/http-client`; `ApiCallContext` if any callback uses it.
- Add `@nu-art/http-client` to the frontend package dependencies (`__package.json` and package.json per workspace rules) if not already present.

## Call site migration (separate step)

Call sites **outside** the module (e.g. in UI components) must be updated in a separate pass:

- **Old:** `ModuleFE_X._v1.login(body).executeSync()` or `.execute(callback)`
- **New:** `await ModuleFE_X.login(body)` (and move any callback into the module’s `onComplete` or pass as second argument if the API supports it).

This document does not cover updating those call sites; do that when migrating each consumer.
