# Auth headers and JWT response header

## Problem

Packages that depend on `@nu-art/thunderstorm-shared` for HTTP header name constants (e.g. `HeaderKey_Authorization`, `ResponseHeaderKey_JWTToken`, `HeaderKey_DeviceId`, `HeaderKey_TabId`, `HeaderKey_Origin`) cannot migrate off thunderstorm-* without a replacement.

## How to migrate

**Do not** import these from `@nu-art/thunderstorm-shared` or `@nu-art/thunderstorm-shared/headers`.

**Option A — Define locally in your shared package (recommended for app/concept packages):**

In your shared package, add a small `headers.ts` (or add to an existing consts file) and define:

```ts
export const HeaderKey_Authorization = 'Authorization';
export const ResponseHeaderKey_JWTToken = 'X-Auth-Token';
export const HeaderKey_DeviceId = 'device-id';
export const HeaderKey_TabId = 'tab-id';
export const HeaderKey_Origin = 'Origin';
```

Then import from your own shared package in backend and frontend. This gives a single source of truth and zero thunderstorm dependency.

**Option B — Use a shared infra package:** If the project adds these to `@nu-art/api-types` or a dedicated headers package, import from there instead.

## Example

User-account-shared defined local header constants in `_entity/session/headers.ts` (or consts) and exports `HeaderKey_Authorization`, `ResponseHeaderKey_JWTToken`, and the other header names used by session/account. Backend and frontend import from `@nu-art/user-account-shared`.
