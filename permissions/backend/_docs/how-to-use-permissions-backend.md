# How to use @nu-art/permissions-backend

This package provides scope-based permission assertion for backend modules.

---

## `@RequirePermission` — self-enforcing method decorator

`@RequirePermission(scope, value)` is a TC39 method decorator that:
1. Registers the `(scope, value)` pair in the function-permission registry (used for provisioning)
2. **Wraps** the method so every invocation asserts the caller's access level before the original logic runs

### Applying the decorator

```typescript
import {RequirePermission} from '@nu-art/permissions-backend';
import {definePermissionScope} from '@nu-art/permissions-shared';

export const PermissionScope_Pipeline = definePermissionScope('pipeline', ['read', 'write', 'admin'] as const);

class MyService_Class extends Module {

  @ApiHandler(ApiDef.doSomething)
  @RequirePermission(PermissionScope_Pipeline, 'write')
  async doSomething(params: {}): Promise<Result> {
    // only runs if user has >= 'write' in 'pipeline' scope
  }
}
```

**Decorator order with `@ApiHandler`:** `@RequirePermission` must be listed **below** `@ApiHandler`. TC39 decorators apply bottom-to-top, so `@RequirePermission` wraps first, then `@ApiHandler` captures the wrapped method. This ensures the route goes through the permission check.

### How assertion works

At invocation time, the wrapper:
1. Reads `MemKey_UserScopePermissions` from the current `MemStorage` context (set by `LoadPermissionsMiddleware`)
2. Calls `ModuleBE_PermissionsAssert.assertScopePermission(scope, value)` which compares the user's scope value index against the required value index
3. Throws `ApiException(403)` if insufficient, or calls through to the original method

Works on **any async method** — API handlers, service methods, scheduled entry points, internal helpers — any code running in a `MemStorage` context with loaded permissions.

---

## `wireScopePermission` — entity-level write gate

Shorthand to gate all writes on a DB entity by a scope:

```typescript
import {wireScopePermission} from '@nu-art/permissions-backend';

class AppPermissions_Class extends Module {
  protected init() {
    super.init();
    wireScopePermission(ModuleBE_TopicDB, PermissionScope_Topics, 'write');
    wireScopePermission(ModuleBE_ArticleDB, PermissionScope_Ingest, 'write');
  }
}
```

This registers a `preWrite` interceptor that calls `assertScopePermission(scope, value)` before any write to that collection. Once registered, the interceptor cannot be bypassed by the entity module.

---

## `wireEntityPermissions` — custom entity-level interceptors

For more complex assertions (org checks, ownership, query scoping), use the full `wireEntityPermissions`:

```typescript
import {wireEntityPermissions} from '@nu-art/permissions-backend';

wireEntityPermissions(ModuleBE_MyEntityDB, {
  preWrite: async (dbItem, original, tx?) => {
    ModuleBE_PermissionsAssert.assertScopePermission(PermissionScope_Ingest, 'write');
    // additional org/ownership checks...
  },
  queryInterceptor: (query) => {
    return {...query, where: {...query.where, orgId: currentOrgId()}};
  },
  preDelete: async (dbItems, tx?) => {
    ModuleBE_PermissionsAssert.assertScopePermission(PermissionScope_Ingest, 'admin');
  },
});
```

### Two-tier assertions

**Simple / declarative**: `@RequirePermission(scope, value)` — binary access-level gate, self-enforcing.

**Complex / custom**: App-defined callbacks via `wireEntityPermissions` — org checks, ownership, custom scoping. Callbacks can also use `assertScopePermission` for layered assertion.

---

## Middleware setup

In `app/backend/src/main/index.ts`, register the permissions middleware on the HTTP server:

```typescript
HttpServer.getDefault().addApiMiddleware(
  (apiDef: ApiDef<any>) => !openApis.includes(apiDef),
  ModuleBE_SessionDB.Middleware,
  ModuleBE_AccountDB.Middleware,
  ModuleBE_PermissionsAssert.LoadPermissionsMiddleware
);
```

`LoadPermissionsMiddleware` reads the user's `scopeEntries` from the session and populates `MemKey_UserScopePermissions` in the request's `MemStorage`.

---

## Project setup and default groups

`ModuleBE_Permissions` implements `PerformProjectSetup`. On setup it:

1. **Collects default scope grants** from all modules implementing `CollectDefaultScopeValues`
2. **Creates/updates the Default group** (`GroupId_Default`) with those scope entries
3. **Creates the Permissions Admin group** (`GroupId_PermissionsAdmin`) with the highest level for every registered scope

### Admin bootstrap (RTDB flag)

For existing systems where no user has admin permissions yet, `ModuleBE_Permissions` manages an RTDB flag at the module's config path (`grantAdminOnLogin`). When `true`, the next user to log in is assigned the Permissions Admin group. The flag is then set to `false`.

Access via `ModuleBE_Permissions.getAdminGrantFlagRef()`.

---

## Module pack

Include `ModulePackBE_Permissions` in your app's module list:

```typescript
import {ModulePackBE_Permissions} from '@nu-art/permissions-backend';

new Storm(Environment)
  .addModulePack(ModulePackBE_Permissions)
  // ...
```

Contains: `ModuleBE_PermissionGroupDB`, `ModuleBE_PermissionUserDB`, `ModuleBE_PermissionsAssert`, `ModuleBE_Permissions`.

---

## Architecture

```
db-api (infra)       — generic interceptor chain; no permission types
      ^
permissions (middle) — @RequirePermission + wireEntityPermissions; agnostic to app semantics
      ^
app (top)            — defines scopes, wires entity permissions, contributes default grants
```

- db-api knows nothing about permissions
- permissions bridges db-api hooks with scope-based assertion
- app defines domain-specific rules (org, ownership, visibility)

---

## Key exports

| Export | Description |
|--------|-------------|
| `RequirePermission(scope, value)` | Self-enforcing method decorator |
| `wireEntityPermissions(dbModule, policy)` | Register entity-level interceptors |
| `wireScopePermission(dbModule, scope, value)` | Shorthand for scope-based preWrite gate |
| `ModuleBE_PermissionsAssert` | Module with `assertScopePermission()` and `LoadPermissionsMiddleware` |
| `ModuleBE_Permissions` | Module handling setup, session data, admin bootstrap |
| `ModulePackBE_Permissions` | Full module pack for app registration |
| `getRequirePermissionDef(handler)` | Introspect the permission def attached to a decorated method |
