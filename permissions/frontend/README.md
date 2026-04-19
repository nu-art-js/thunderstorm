# @nu-art/permissions-frontend

Frontend modules and UI components for the permissions system.

## Key exports

| Symbol | Purpose |
|---|---|
| `ModuleFE_PermissionsAssert` | Client-side scope checking — `hasScopeAccess(scope, value)` reads the user's synced `UserPermissions` data. |
| `ModuleFE_UserPermissions` | FE module for user-permissions entities (IDB cache + smart-sync). Provides `getScopeEntries()`. |
| `ModuleFE_AccessGroup` | FE module for access-group entities. |
| `ModuleFE_PermissionScope` | FE module for permission-scope entities. |
| `ModulePackFE_Permissions` | Module pack — register in the Thunder builder to enable permission data sync and UI. |
| `PermissionGuard` | Conditional rendering component based on scope permissions. |
| `APage_Permissions` | Two-panel permissions management page — group list + detail with filterable scope multi-select and member editing. |
| `Component_ScopeMultiSelect` | Filterable multi-select scope list for assigning scopes to access groups. |
| `Component_ScopeLabels` | Read-only display of resolved scope entries as tags. |

## PermissionGuard

Conditionally renders children based on the current user's scope permissions:

```typescript
<PermissionGuard scope={PermissionScope_MyConcept} value="write">
  <MyProtectedComponent />
</PermissionGuard>
```

## Setup

Add the module pack to the Thunder builder:

```typescript
new Thunder(config)
  .addModulePack(ModulePackFE_Permissions)
  .build();
```

This enables IDB caching and smart-sync for permission scopes, user permissions, and access groups.

## Deps

- `@nu-art/permissions-shared`
- `@nu-art/db-api-frontend`
- `@nu-art/db-api-shared`
- `@nu-art/thunder-core`
- `@nu-art/thunder-widgets`
- `@nu-art/sync-manager-frontend`
- `@nu-art/user-account-frontend`
- `@nu-art/http-client`
- `@nu-art/ts-common`
