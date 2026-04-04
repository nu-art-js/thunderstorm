# @nu-art/permissions-frontend

Frontend modules and UI components for the scope-based permissions system.

## Key exports

| Symbol | Purpose |
|---|---|
| `ModuleFE_PermissionsAssert` | Client-side permission checking — `hasScopeAccess(scope, value)` reads the JWT session data. |
| `ModuleFE_PermissionUser` | FE module for permission-user entities (IDB cache + smart-sync). |
| `ModuleFE_PermissionRole` | FE module for permission-role entities. |
| `ModuleFE_PermissionScope` | FE module for permission-scope entities. |
| `ModulePackFE_Permissions` | Module pack — register in the Thunder builder to enable permission data sync and UI. |
| `ScopePermissionsEditor` | UI component — displays a matrix of users × scopes with role assignment editing. |
| `DropDown_PermissionRole` | Dropdown component for selecting permission roles. |

## ScopePermissionsEditor

Extends `ComponentSync` and implements `OnPermissionUserUpdated`, `OnPermissionRoleUpdated`, `OnPermissionScopeUpdated`, `OnAccountsUpdated` — automatically re-renders when any of these collections update via smart-sync.

Scope values are displayed in their defined hierarchical order using the shared `getPermissionScopeValues` registry.

## Setup

Add the module pack to the Thunder builder:

```typescript
new Thunder(config)
  .addModulePack(ModulePackFE_Permissions)
  // ...
  .build();
```

## Deps

- `@nu-art/permissions-shared`
- `@nu-art/db-api-frontend`
- `@nu-art/thunder-core`
- `@nu-art/thunder-widgets`
- `@nu-art/thunder-routing`
- `@nu-art/user-account-frontend`
- `@nu-art/http-client`
- `@nu-art/ts-common`
