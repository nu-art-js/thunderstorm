# @nu-art/permissions-shared

Shared types, DB definitions, and scope utilities for the scope-based permissions system. Consumed by both backend and frontend packages.

## Scope-based permissions model

Permissions are defined as **scopes** — each scope has a `key` and an ordered list of `values` representing privilege levels (lowest to highest).

```typescript
const MyScope = definePermissionScope('topics', ['read', 'write', 'admin'] as const);
```

### Key concepts

| Concept | Description |
|---|---|
| `PermissionScope` | Branded type with `key` + ordered `values`. Defined via `definePermissionScope`. |
| `PermissionRole` | Collection of scope entry IDs. Can be `personal` or `assignable`. System roles have `system: true`. |
| `PermissionUser` | Links an account to role assignments (with optional entity context). |

### Scope registry

`definePermissionScope` registers each scope in a global `Map`. Use `getPermissionScopeValues(key)` to retrieve the canonical ordered values for a scope — used by the frontend to display scope hierarchies correctly.

## DB definitions

| Entity | DB key | Firestore collection |
|---|---|---|
| `DB_PermissionScope` | `permissions--scope` | `permissions--scopes` |
| `DB_PermissionRole` | `permissions--role` | `permissions--roles` |
| `DB_PermissionUser` | `permissions--user` | `permissions--users` |

All entities share the `permissions` IDB group on the frontend.

## Deps

- `@nu-art/ts-common`
- `@nu-art/db-api-shared`
