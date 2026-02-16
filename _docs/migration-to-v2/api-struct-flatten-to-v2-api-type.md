# Moving to Thunderstorm v2 — Flatten ApiStruct to flat API type

## Problem

The old pattern uses:
1. **Intermediate wrapper types** (`Account_Login`, `SAML_Assert`, etc.) that only hold `{ request: ..., response: ... }` and exist solely to feed the struct.
2. **`ApiStruct_*`** with a versioned nesting key (`_v1`) grouping the API endpoints.
3. **`['request']` / `['response']` accessors** to extract types from the intermediate wrappers.

This creates unnecessary indirection — three type declarations (wrapper, struct entry, def entry) for every single endpoint.

## How to migrate

### 1. Remove intermediate request/response wrapper types

**Before:**
```typescript
export type Account_Login = {
	request: AccountEmailWithDevice & AccountPassword;
	response: Response_Auth;
}
```

**After:** Delete it entirely. The `request` and `response` types move directly into the `BodyApi`/`QueryApi` generics.

### 2. Rename `ApiStruct_*` → `API_*` and flatten (remove `_v1` nesting)

**Before:**
```typescript
export type ApiStruct_Account = {
	_v1: {
		login: BodyApi<Account_Login['response'], Account_Login['request']>;
		// ...
	}
}
```

**After:**
```typescript
export type API_UserAccount = {
	login: BodyApi<Response_Auth, AccountEmailWithDevice & AccountPassword>;
	// ...
}
```

**Rules:**
- `ApiStruct_X` → `API_X` (or a more contextual name, e.g. `API_UserAccount`).
- Remove all intermediate nesting keys (`_v1`, `_v2`, etc.) — the endpoints are direct properties.
- Replace `SomeType['response']` and `SomeType['request']` with the actual types inlined.

### 3. Flatten and rename the `ApiDef` constant to match

**Before:**
```typescript
export const ApiDef_Account: ApiDefResolver<ApiStruct_Account> = {
	_v1: {
		login: {method: HttpMethod.POST, path: 'v1/account/login', timeout: Minute},
		// ...
	}
};
```

**After:**
```typescript
export const ApiDef_UserAccount: ApiDefResolver<API_UserAccount> = {
	login: {method: HttpMethod.POST, path: 'v1/account/login', timeout: Minute},
	// ...
};
```

**Rules:**
- Rename `ApiDef_X` to match the new `API_X` name (e.g. `ApiDef_UserAccount`).
- Remove the `_v1` nesting — method/path entries are direct properties.
- Path strings stay the same (they still contain `/v1/` in the URL — that's the HTTP route, not a type structure concern).

### 4. Update all consumers

After transforming the definition file, find and update every import / usage of:
- The old `ApiStruct_*` type name → new `API_*` name.
- The old `ApiDef_*` constant name → new `ApiDef_*` name.
- Any reference to `ApiDef_X._v1.someEndpoint` → `ApiDef_X.someEndpoint` (remove `._v1`).
- Any reference to the deleted intermediate types (`Account_Login`, `Account_CreateToken`, etc.) → inline or create a local alias if genuinely needed elsewhere.

### 5. Update import source

**Before:**
```typescript
import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm-shared';
```

**After:**
```typescript
import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/api-types';
```

### 6. Remove `//########################` section separators

The old-style `//######################## ... ########################` comment banners are removed. No replacement needed — the code is self-explanatory without them.

## Checklist

- [ ] All intermediate `{ request, response }` wrapper types removed
- [ ] `ApiStruct_*` renamed to `API_*`, `_v1` nesting removed
- [ ] `BodyApi`/`QueryApi` generics use inlined types directly (no `['request']`/`['response']`)
- [ ] `ApiDef_*` constant renamed to match, `_v1` nesting removed
- [ ] Import source changed from `@nu-art/thunderstorm-shared` to `@nu-art/api-types`
- [ ] `//########################` section separators removed
- [ ] All consumers updated (imports, `._v1.` access paths, type references)
- [ ] Package compiles: `bai -up=<package>`

## Reference

See `_thunderstorm/user-account/shared/src/main/_entity/account/api-def.ts` for the first migrated example.
