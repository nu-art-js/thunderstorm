# Scope Permission Model

## Convention: Lowercase Always

Scope keys and values are **lowercase strings**. Never capitalized. This is a hard convention across all packages.

```typescript
// correct
definePermissionScope('ingest', ['read', 'write', 'admin'] as const)

// wrong — never capitalize
definePermissionScope('Ingest', ['Read', 'Write', 'Admin'] as const)
```

## Scope Definition

A `PermissionScope` is created via `definePermissionScope(key, values)`:

- **key** — lowercase string identifying the scope. Can be nested using `:` as separator (e.g. `'org:topics'`).
- **values** — ordered readonly array of permission levels. Position defines hierarchy: index 0 is the lowest, last index is the highest.

```typescript
const PermissionScope_Ingest = definePermissionScope('ingest', ['read', 'write', 'admin'] as const);
// read (index 0) < write (index 1) < admin (index 2)
```

## Scope Entry Format

A scope entry is a string: `scopeKey:value`.

For flat scopes: `ingest:write`, `alerting:admin`, `topics:read`.

For nested scope keys: `myorg:topics:write` where `myorg:topics` is the key and `write` is the value.

The scope key is known at assertion time (from `definePermissionScope`), so parsing is unambiguous: strip the `scopeKey:` prefix and the remainder is the value.

## Session Format

The session carries a `string[]` of scope entries:

```
['ingest:write', 'alerting:admin', 'topics:read']
```

For each scope, the entry represents the **max value** across all groups the user belongs to (max by position in the scope's values array).

## Assertion

`assertScopePermission(scope, requiredValue)`:

1. Find the entry in the user's scope array starting with `scopeKey:`
2. Extract the user's value
3. Compare: `scope.values.indexOf(userValue) >= scope.values.indexOf(requiredValue)`
4. A user with `admin` (index 2) passes a `write` (index 1) check

No numeric indirection. The scope definition is self-sufficient.

## Nested Scopes

Scope keys can be hierarchical using `:` as separator:

```typescript
definePermissionScope('myorg:topics', ['read', 'write', 'admin'] as const)
```

The entry becomes `myorg:topics:write`. The assertion uses prefix `myorg:topics:` to find the matching entry. Same logic works for any nesting depth.

The `:` separator is reserved for this hierarchical pattern.
