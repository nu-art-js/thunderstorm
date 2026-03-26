# How to use @nu-art/permissions-backend

## Self-enforcing `@RequirePermission` decorator

`@RequirePermission(scope, value)` is a TC39 method decorator that:
1. Registers the `(scope, value)` pair in the function-permission registry (for provisioning)
2. **Wraps** the method so that every invocation asserts the caller's access level before the original logic runs

### Defining a scope

```typescript
import {definePermissionScope} from '@nu-art/permissions-shared';

export const PermissionScope_Pipeline = definePermissionScope('pipeline', ['read', 'write', 'admin'] as const);
```

The scope key is a stable string seed; domain/level IDs are derived from it during provisioning.

### Applying the decorator

```typescript
import {RequirePermission} from '@nu-art/permissions-backend';

class MyService_Class extends Module {

	@ApiHandler(ApiDef.doSomething)
	@RequirePermission(PermissionScope_Pipeline, 'write')
	async doSomething(params: {}): Promise<Result> {
		// only runs if user has >= 'write' in 'pipeline' scope
	}
}
```

**Decorator order with `@ApiHandler`:** `@RequirePermission` must be listed **below** `@ApiHandler`. TC39 decorators apply bottom-to-top, so `@RequirePermission` wraps first, then `@ApiHandler` captures the wrapped method for the HTTP route. This ensures the route goes through the permission check.

### How assertion works

At invocation time, the wrapper:
1. Reads `MemKey_UserPermissions` from the current `MemStorage` execution context (set by `LoadPermissionsMiddleware` or equivalent)
2. Calls `ModuleBE_PermissionsAssert.assertFunctionPermission(def)` which checks the user's level in the def's domain
3. Throws `ApiException(403)` if insufficient, or calls through to the original method

This works on **any async method** — not just API handlers. Service methods, scheduled entry points, internal helpers — any method that runs in a `MemStorage` context with loaded permissions.

Human and service account callers both have permissions in `MemKey_UserPermissions`; the same assertion path applies.

---

## Entity-level access control with `wireEntityPermissions`

For entity-level assertions (pre-write, query scoping, pre-delete) that cannot be bypassed by entity modules, use `wireEntityPermissions` from `@nu-art/permissions-backend`.

### Registering interceptors

```typescript
import {wireEntityPermissions} from '@nu-art/permissions-backend';
import {ModuleBE_MyEntityDB} from '@app/my-entity-backend';

class AppPermissions_Class extends Module {

	protected init() {
		super.init();

		wireEntityPermissions(ModuleBE_MyEntityDB, {
			preWrite: async (dbItem, original, tx?) => {
				// assert write access — throw ApiException(403) to deny
			},
			queryInterceptor: (query) => {
				// inject mandatory scoping into every query
				return {...query, where: {...query.where, orgId: currentOrgId()}};
			},
			preDelete: async (dbItems, tx?) => {
				// gate deletion — throw ApiException(403) to deny
			},
		});
	}
}
```

### Two-tier assertions

**Simple / declarative**: `@RequirePermission(scope, value)` — binary access-level gate, self-enforcing.

**Complex / custom**: App-defined callbacks via `wireEntityPermissions` — org checks, ownership, custom scoping. Callbacks can themselves be `@RequirePermission`-decorated for layered assertion:

```typescript
@RequirePermission(PermissionScope_Ingest, 'write')
private async assertArticleWrite(dbItem, original, tx?) {
	// @RequirePermission fires first (fast-reject if user lacks 'write')
	// then run complex org/ownership logic here
}
```

### Architecture

```
db-api (infra)       — generic interceptor chain; no permission types
      ↑
permissions (middle) — @RequirePermission + wireEntityPermissions; agnostic to app semantics
      ↑
app (top)            — defines custom assertion callbacks; registers via wireEntityPermissions
```

- db-api knows nothing about permissions
- permissions bridges db-api hooks with app callbacks
- app defines domain-specific rules (org, ownership, visibility)
