# @nu-art/permissions-backend

Backend enforcement for scope-based action permissions and document-level access control: `@RequirePermission` decorator, document access interceptors, service accounts, and bootstrap of system groups.

## Key exports

| Symbol | Purpose |
|---|---|
| `ModuleBE_Permissions` | Singleton — manages service account configs, bootstrap of system groups, `runAsServiceAccount` for SA operations, `setAccessContextResolver` for custom document access resolution. |
| `ModuleBE_PermissionsAssert` | Assertion engine — `assertScopePermission(scope, value)` checks the caller's scope entries. Provides `LoadPermissionsMiddleware` for HTTP pipelines. |
| `@RequirePermission(scope, value)` | Method decorator — asserts scope permission before any decorated async method. Not limited to API handlers — gates any function. |
| `wireDocumentAccess(dbModule, ...)` | Registers query/write/delete interceptors on a DB module for `__access` field enforcement. Wired globally to all modules by `ModuleBE_Permissions.init()`. |
| `shareDocument` / `unshareDocument` | Programmatic document sharing — owners can add/remove principals to ACL lists. |
| `ModulePackBE_Permissions` | Module pack containing all permission entity modules + assert + core. |

## Service accounts

Service accounts participate in the permission system — they are **not exempt** from document access checks. An SA has its own personal access group ID and must be included in the relevant `__access` lists of documents it interacts with.

`runAsServiceAccount` sets the SA's scope permissions and access IDs on request-scoped `MemStorage`, exactly as the user middleware does for human users. The only exception is document **creation** — during creation, `__access` is being stamped (not checked).

```typescript
type ServiceAccountConfig = {
  readonly scopes: string[];     // scope entries like ['permissions:admin']
  readonly enabled: boolean;
  readonly systemOnly: boolean;  // if true, cannot be used within a user request context
};
```

The `bootstrap-admin` service account is registered by default. Its scope entries are dynamically resolved to the highest value of every registered scope.

## System groups

Bootstrap creates and maintains system groups on every startup:

| Group | Purpose |
|-------|---------|
| **Default** | All users are members; scope entries from `CollectDefaultScopeValues` |
| **Permissions Admin** | Highest scope value for every registered scope |
| **Permissions Infra (×4)** | Document-level access groups for the permissions entities themselves |

System groups are bootstrap-only — do not modify from app code.

## Document access

Document access interceptors are wired **globally to all DB modules** on init. Every document carries `__access: { readers, writers, deleters, owners }`. Documents must be created with correct access actors — once created, all subsequent interactions are permission-guarded.

For custom access resolution on a module, use `ModuleBE_Permissions.setAccessContextResolver(dbModule, resolver)`.

## Deps

- `@nu-art/permissions-shared`
- `@nu-art/db-api-backend`
- `@nu-art/http-server`
- `@nu-art/firebase-backend`
- `@nu-art/user-account-backend`
- `@nu-art/user-account-shared`
- `@nu-art/action-processor-backend`
- `@nu-art/ts-common`
