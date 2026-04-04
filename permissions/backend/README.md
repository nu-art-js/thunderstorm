# @nu-art/permissions-backend

Backend enforcement for scope-based permissions: assertion middleware, entity-level interceptors, service account elevation, and bootstrap of system roles.

## Key exports

| Symbol | Purpose |
|---|---|
| `ModuleBE_Permissions` | Singleton — manages service account configs, bootstrap of the Permissions Admin role, and `runAsServiceAccount` for elevated operations. |
| `ModuleBE_PermissionsAssert` | Assertion engine — `assertScopePermission(scope, value)` checks the caller's scope entries. Provides `LoadPermissionsMiddleware` for HTTP pipelines. |
| `@RequirePermission(scope, value)` | Method decorator for API handlers — asserts scope permission before execution. |
| `wireScopePermission(dbModule, scope, value)` | Registers a `PreWriteInterceptor` on a DB module that asserts scope permission before every write. |
| `wireEntityPermissions(dbModule, policy)` | Registers entity-level interceptors (`preWrite`, `queryInterceptor`, `preDelete`) on a DB module. |
| `ModulePackBE_Permissions` | Module pack containing all permission entity modules + assert + core. |

## Service accounts

System operations (bootstrap, login/registration flows) run under service accounts via `ModuleBE_Permissions.runAsServiceAccount(id, callback)`. Service accounts are defined in the module's `Config`:

```typescript
type ServiceAccountConfig = {
  scopes: string[];     // scope entries like ['permissions:admin', 'topics:admin']
  enabled: boolean;
  systemOnly: boolean;  // only usable by infra, not app code
};
```

The `bootstrap-admin` service account is registered by default in the constructor.

## System roles

Roles with `system: true` can only be modified by the bootstrap service account. The `preWriteProcessing` interceptor on `ModuleBE_PermissionRoleDB` enforces this.

## Entity-level permission wiring

The permissions package wires scope assertions on its own entity modules:
- `ModuleBE_PermissionUserDB` — requires `permissions:write`
- `ModuleBE_PermissionRoleDB` — requires `permissions:write`
- `ModuleBE_PermissionScopeDB` — requires `permissions:write`

App-level code can wire additional assertions on its own DB modules using `wireScopePermission`.

## Deps

- `@nu-art/permissions-shared`
- `@nu-art/db-api-backend`
- `@nu-art/http-server`
- `@nu-art/firebase-backend`
- `@nu-art/user-account-backend`
- `@nu-art/ts-common`
