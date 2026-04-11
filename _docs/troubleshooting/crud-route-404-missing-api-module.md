# CRUD Route 404 — Missing `createApisForDBModule`

## Symptom

Frontend sync fails with:

```
HttpException: 404 - https://localhost:8002/v1/<dbKey>/query
ModuleFE_SyncManager_Class Error while syncing collection '<dbKey>'
```

The backend is running, other collections sync fine, and the `ModuleBE_*DB` module is in the module pack.

## Cause

`ModuleBE_BaseDB` handles **Firestore operations only** — it does not register HTTP routes.
CRUD routes (`/v1/{dbKey}/query`, `/upsert`, `/delete-unique`, etc.) are registered by `ModuleBE_BaseApi`, which is a separate module.

If the entity's module pack only includes the `ModuleBE_*DB` instance, the DB layer works but no HTTP endpoints exist — hence the 404.

## Fix

Every DB entity needs a per-entity `module-pack.ts` that pairs the DB module with its API module:

```typescript
import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_ExampleDB} from './ModuleBE_ExampleDB.js';

export const ModulePackBE_Example = [ModuleBE_ExampleDB, createApisForDBModule(ModuleBE_ExampleDB)];
```

The parent module pack then spreads the entity pack:

```typescript
export const ModulePackBE_Feature: Module[] = [
	...ModulePackBE_Example,
	// other modules
];
```

## Checklist

- [ ] Entity has a `module-pack.ts` that calls `createApisForDBModule`
- [ ] Parent module pack spreads (`...`) the entity pack instead of listing `ModuleBE_*DB` directly
- [ ] Backend rebuilt and restarted after the change
