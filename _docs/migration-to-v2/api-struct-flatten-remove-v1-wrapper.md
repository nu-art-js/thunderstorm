# API struct flatten — remove _v1 wrapper

## Problem

API definitions use a versioned shape: `ApiStruct_X = { _v1: { endpointA: ..., endpointB: ... } }` and `ApiDef_X: ApiDefResolver<ApiStruct_X> = { _v1: { endpointA: {...}, endpointB: {...} } }`. Call sites then use `ApiDef_X._v1.endpointA` and (on the frontend) `ModuleFE_X._v1.endpointA`. This adds unnecessary nesting and makes migration and discovery harder.

## Goal

Use a **flat** API type and def: one level of keys (no `_v1`). Same path/method contracts; only the TypeScript and runtime shape change.

**Before (versioned):**

```ts
export type ApiStruct_Account = {
	_v1: {
		registerAccount: BodyApi<...>;
		login: BodyApi<...>;
		// ...
	}
};

export const ApiDef_Account: ApiDefResolver<ApiStruct_Account> = {
	_v1: {
		registerAccount: { method: HttpMethod.POST, path: '/v1/account/register-account' },
		// ...
	}
};
```

**After (flat):**

```ts
export type API_UserAccount = {
	registerAccount: BodyApi<...>;
	login: BodyApi<...>;
	// ... all endpoints at top level
};

export const ApiDef_Account: ApiDefResolver<API_UserAccount> = {
	registerAccount: { method: HttpMethod.POST, path: '/v1/account/register-account' },
	// ...
};
```

## How to migrate

1. **Shared package (api-def):**
   - Replace `ApiStruct_*` with a single flat type (e.g. `API_UserAccount`). Name the type so it’s clear it’s the API surface (e.g. `API_<Concept>`).
   - List all endpoints at the top level (no `_v1`).
   - Change `ApiDef_*` to `ApiDefResolver<API_*>` and move every endpoint from `_v1` to the top level. Paths and methods stay the same.

2. **Backend (ApiHandler):**
   - Replace `ApiDef_X._v1.endpointName` with `ApiDef_X.endpointName` everywhere.

3. **Frontend (module that builds API callers):**
   - Use the new flat type in `ApiDefCaller<...>` (e.g. `ApiDefCaller<API_UserAccount>` or a combined type if you merge several APIs).
   - When building callers, reference `ApiDef_X.endpointName` instead of `ApiDef_X._v1.endpointName`.
   - If the module exposes a single namespace (e.g. `readonly _v1` or `readonly api`), you can keep that property name and only change the type and where defs are read from; call sites like `ModuleFE_Account._v1.registerAccount(...)` remain valid. Optionally rename `_v1` to `api` and document that the API is no longer version-namespaced.

4. **Call sites (components, app):**
   - No change if the frontend module still exposes the same property (e.g. `_v1` or `api`). If you switch to flat properties on the module (e.g. `ModuleFE_Account.registerAccount`), update all call sites accordingly.

## Example (user-account)

- **Shared** `user-account/shared/.../api-def.ts`: `API_UserAccount` flat type; `ApiStruct_Account` removed; `ApiDef_Account` flat.
- **Backend** `ModuleBE_AccountDB.ts`: `ApiDef_Account._v1.refreshSession` → `ApiDef_Account.refreshSession`, and same for all other handlers.
- **Frontend** `ModuleFE_Account.ts`: Type uses `API_UserAccount` (and combined with SAML if needed); callers built with `ApiDef_Account.refreshSession`, `ApiDef_Account.registerAccount`, etc. Exposed surface can stay `_v1` so existing `ModuleFE_Account._v1.registerAccount` call sites keep working.

## Notes

- Paths and HTTP methods are unchanged; only the TS/object shape is flattened.
- If one package has multiple API groups (e.g. Account + SAML), you can migrate one at a time: flatten Account first, leave SAML under `_v1` until its own migration, and type the combined caller accordingly.
- `ApiDefResolver` and `ApiDefCaller` in `@nu-art/api-types` / thunderstorm support both nested and flat structs; flat is a valid `ApiStruct`.
