# @nu-art/permissions-shared

Shared types, DB definitions, and registries for the permissions system. Consumed by both backend and frontend packages.

## Two-axis permissions model

| Axis | What it protects | Key types |
|------|-----------------|-----------|
| **Scope permissions** | Actions — any decorated function | `PermissionScope`, `DB_PermissionScope` |
| **Document access** | Data — individual DB documents | `DocumentAccessFields`, `DocumentAccessInner` |

### Scope permissions (action gating)

Permissions are defined as **scopes** — each scope has a `key` and an ordered list of `values` representing privilege levels (lowest to highest). Scopes represent what a user can **do**.

```typescript
const MyScope = definePermissionScope('topics', ['read', 'write', 'admin'] as const);
```

### Document access (data gating)

Every DB document carries an `__access` field with four ACL lists (`readers`, `writers`, `deleters`, `owners`), each containing access group IDs. Documents must be created with correct access actors — once created, the permission guards apply and there is no way to bypass them.

### Key concepts

| Concept | Description |
|---|---|
| `PermissionScope` | Branded type with `key` + ordered `values`. Defined via `definePermissionScope`. Gates actions. |
| `AccessGroup` | Grouping entity — types: `user`, `service-account`, `entity`, `custom`. Has `members` (child groups) and optional `scopeEntries`. |
| `UserPermissions` | Materialized view per account — effective `scopeEntries` and `accessIds` computed from the group graph. |
| `AccessGroupDefinition` | Code-defined group template declared via `defineAccessGroup`. Bootstrap creates DB entities from these. |
| `DocumentAccessFields` | The `__access` field type on DB documents — `{ readers, writers, deleters, owners }`. |

### Scope registry

`definePermissionScope` registers each scope in a global `Map`. Use `getPermissionScopeValues(key)` to retrieve the canonical ordered values for a scope — used by the frontend to display scope hierarchies correctly.

### Group definition registry

`defineAccessGroup` registers named group templates with fixed scope assignments. Use `getRegisteredGroupDefinitions()` to retrieve all registered definitions — used by bootstrap to create/upsert `DB_AccessGroup` entities.

## DB definitions

| Entity | DB key | Firestore collection |
|---|---|---|
| `DB_PermissionScope` | `permissions--scope` | `permissions--scopes` |
| `DB_AccessGroup` | `permissions--access-groups` | `permissions--access-groups` |
| `DB_UserPermissions` | `permissions--user-permissions` | `permissions--user-permissions` |

All entities share the `permissions` IDB group on the frontend.

## Deps

- `@nu-art/ts-common`
- `@nu-art/db-api-shared`
- `@nu-art/api-types`
