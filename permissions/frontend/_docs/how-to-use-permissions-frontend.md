# How to use @nu-art/permissions-frontend

This package provides client-side permission checking and UI components for the scope-based permission system.

---

## `PermissionGuard` — conditional rendering by scope

A React component that renders its children only if the current user has sufficient access in the given scope. Reads `scopeEntries` from the JWT session — uses the **same `PermissionScope`** objects defined for the backend.

```tsx
import {PermissionGuard} from '@nu-art/permissions-frontend';
import {PermissionScope_Topics} from '@app/news-topic-shared';

<PermissionGuard scope={PermissionScope_Topics} value="write">
  <TopicEditor />
</PermissionGuard>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `scope` | `PermissionScope` | The scope to check (same object used by `@RequirePermission` on backend) |
| `value` | `string` | The required access level (e.g. `'read'`, `'write'`, `'admin'`) |
| `children` | `ReactNode` | Rendered when user has sufficient access |
| `fallback` | `ReactNode` (optional) | Rendered when access is denied. Defaults to nothing. |

### With fallback

```tsx
<PermissionGuard scope={PermissionScope_Alerting} value="admin" fallback={<span>Admin access required</span>}>
  <AlertBotConfig />
</PermissionGuard>
```

---

## `ModuleFE_PermissionsAssert.hasScopeAccess` — programmatic check

For imperative checks (e.g. in event handlers, conditional logic outside JSX):

```typescript
import {ModuleFE_PermissionsAssert} from '@nu-art/permissions-frontend';
import {PermissionScope_Pipeline} from '@app/pipeline-orchestrator-shared';

if (ModuleFE_PermissionsAssert.hasScopeAccess(PermissionScope_Pipeline, 'write')) {
  // user can trigger pipeline runs
}
```

Returns `true` if the user's session `scopeEntries` has a value for the scope that is >= the required value (by index in the scope's values array).

---

## `ScopePermissionsEditor` — admin UI component

A full-page React component that shows all registered scopes, all users, and each user's effective permission level per scope. Useful for an admin panel.

```tsx
import {ScopePermissionsEditor} from '@nu-art/permissions-frontend';

// As a route
const route = ScopePermissionsEditor.Route; // key: 'scope-permissions-editor'

// Or directly
<ScopePermissionsEditor />
```

The editor:
- Fetches all registered scopes from the backend (`getRegisteredScopes` API)
- Shows each scope's key and ordered values
- Lists all permission users with their groups and effective scope access
- Resolves max value per scope from the user's groups (same logic as session computation)

---

## API callers

`ModuleFE_PermissionsAssert` exposes API callers for the permissions backend:

| Method | Description |
|--------|-------------|
| `setupPermissions()` | Triggers `PerformProjectSetup` on the backend (creates default groups, etc.) |
| `getRegisteredScopes()` | Returns all scopes registered via `@RequirePermission` decorators on the backend |

---

## Module pack

Include `ModulePackFE_Permissions` in your app's module list:

```typescript
import {ModulePackFE_Permissions} from '@nu-art/permissions-frontend';

new Thunder(Environment)
  .addModulePack(ModulePackFE_Permissions)
  // ...
```

Contains: `ModuleFE_PermissionGroup`, `ModuleFE_PermissionUser`, `ModuleFE_PermissionsAssert`.

---

## How frontend permissions work

1. User logs in — the session JWT is populated with `scopeEntries: string[]` (computed by `ModuleBE_Permissions.__collectSessionData`)
2. `SessionKey_Permissions_FE` stores the session data on the client
3. `hasScopeAccess(scope, value)` reads from `SessionKey_Permissions_FE` and compares the user's value index against the required value index
4. `PermissionGuard` calls `hasScopeAccess` to conditionally render

No additional API calls for assertion — permissions are embedded in the session token.

---

## Key exports

| Export | Description |
|--------|-------------|
| `PermissionGuard` | React component for scope-based conditional rendering |
| `ScopePermissionsEditor` | Admin UI for viewing user/scope matrix |
| `ModuleFE_PermissionsAssert` | Module with `hasScopeAccess()` and API callers |
| `ModulePackFE_Permissions` | Full module pack for app registration |
| `SessionKey_Permissions_FE` | Session key for accessing permission data on the client |
| `Renderer_RoleNames` | UI renderer for displaying user role names |
