# How to use @nu-art/permissions-shared

This package defines the scope-based permission model shared by backend and frontend.

---

## Defining a scope

A `PermissionScope` is the atomic permission unit. It has a **key** (lowercase string) and **ordered values** (lowest to highest access).

```typescript
import {definePermissionScope} from '@nu-art/permissions-shared';

export const PermissionScope_Ingest = definePermissionScope('ingest', ['read', 'write', 'admin'] as const);
```

- **key** — stable lowercase string. Can use `:` for hierarchy (e.g. `'org:topics'`).
- **values** — ordered array. Index 0 is lowest access, last index is highest. A user with `admin` (index 2) satisfies a `write` (index 1) check.
- Always use `as const` so TypeScript narrows the values to literal types.

### Convention: lowercase always

Scope keys and values are **lowercase**. Never capitalize.

```typescript
// correct
definePermissionScope('pipeline', ['read', 'write', 'admin'] as const);

// wrong
definePermissionScope('Pipeline', ['Read', 'Write', 'Admin'] as const);
```

### Where to define scopes

Define scopes in the **shared** package of the feature library that owns them:

```
news-ingest/shared/    → PermissionScope_Ingest
news-topic/shared/     → PermissionScope_Topics
news-alert/shared/     → PermissionScope_Alerting
```

Or in the **backend** package if the scope is backend-only. The scope object is then importable by both backend and frontend.

---

## Scope entry format

A scope entry is a flat string: `scopeKey:value`.

Examples: `ingest:write`, `alerting:admin`, `topics:read`.

For nested scope keys: `myorg:topics:write` — `myorg:topics` is the key, `write` is the value.

---

## Session format

The user's JWT session carries `scopeEntries: string[]` — one entry per scope, representing the **max value** across all groups the user belongs to.

```json
{
  "permissions": {
    "scopeEntries": ["ingest:write", "alerting:admin", "topics:read"],
    "roles": [{"key": "Default", "uiLabel": "Default"}]
  }
}
```

---

## Group storage

`DB_PermissionGroup` stores permissions as flat `scopeEntries: string[]`:

```typescript
{
  _id: '...',
  label: 'Editor',
  uiLabel: 'Editor',
  scopeEntries: ['topics:write', 'ingest:write', 'alerting:read']
}
```

No domain/level indirection. Groups directly list scope entries.

---

## Default scope grants

Modules contribute default permissions for new users via the `CollectDefaultScopeValues` dispatcher:

```typescript
import type {CollectDefaultScopeValues, DefaultScopeGrant} from '@nu-art/permissions-shared';

class MyModule_Class extends Module implements CollectDefaultScopeValues {
  __collectDefaultScopeValues(): DefaultScopeGrant[] {
    return [
      {scope: PermissionScope_Topics, value: 'read'},
      {scope: PermissionScope_Ingest, value: 'read'},
    ];
  }
}
```

These contributions are collected during `PerformProjectSetup` and written to the **Default** group (`GroupId_Default`). Every new user gets this group on registration/login.

---

## Well-known groups

| Constant | Purpose |
|----------|---------|
| `GroupId_Default` | Assigned to every user. Contains default scope grants from all modules. |
| `GroupId_PermissionsAdmin` | Full admin access to all registered scopes. Assigned via RTDB bootstrap flag. |

---

## Key exports

| Export | Description |
|--------|-------------|
| `definePermissionScope(key, values)` | Creates a branded, frozen scope definition |
| `PermissionScope` | Type for scope objects |
| `CollectDefaultScopeValues` | Dispatcher interface for contributing default grants |
| `DefaultScopeGrant` | Type: `{ scope: PermissionScope, value: string }` |
| `RegisteredScope` | Type: `{ key: string, values: readonly string[] }` |
| `ResolveAdditionalPermissionGroups` | Dispatcher for app-specific group assignment on login/register |
| `GroupId_Default`, `GroupId_PermissionsAdmin` | Well-known group IDs |
| `PerformProjectSetup` | Interface for modules that contribute to initial system setup |
| `DB_PermissionGroup` | Group entity type with `scopeEntries: string[]` |
| `SessionData_Permissions` | Session data type: `{ scopeEntries: string[], roles: {...}[] }` |
