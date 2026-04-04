# @nu-art/db-api-backend

Backend base classes for Firestore-backed entity modules. Provides `ModuleBE_BaseDB` (collection operations + interceptor chain) and `ModuleBE_BaseApi_Class` (CRUD HTTP endpoints).

## Key exports

| Symbol | Purpose |
|---|---|
| `ModuleBE_BaseDB` | Abstract base for entity modules — wraps a `FirestoreCollection` with pre/post-write interceptors, query interceptors, pre-delete interceptors, version upgrades, and entity dependency collection. |
| `ModuleBE_BaseApi_Class` / `createApisForDBModule` | Generates standard CRUD HTTP endpoints (query, queryUnique, upsert, upsertAll, delete, deleteQuery, deleteAll) for a `ModuleBE_BaseDB`. |
| `RuntimeBE_ModulesDB` | Returns all registered `ModuleBE_BaseDB` instances from the module manager. |
| `ModuleBE_CollectionActions` | Batch collection actions (upgrade, process). |

## Interceptor chain

Interceptors are registered externally (e.g. by the permissions package or the sync manager) and run in the mandatory chain — once registered they cannot be bypassed.

| Hook | Registration | Runs |
|---|---|---|
| `PreWriteInterceptor` | `registerPreWriteInterceptor(fn)` | Before subclass `preWriteProcessing`, before Firestore write |
| `PostWriteInterceptor` | `registerPostWriteInterceptor(fn)` | After subclass `postWriteProcessing`, after Firestore write |
| `QueryInterceptor` | `registerQueryInterceptor(fn)` | Wraps every query (manipulates the `FirestoreQuery`) |
| `PreDeleteInterceptor` | `registerPreDeleteInterceptor(fn)` | Before delete, alongside entity dependency checks |

## Deps

- `@nu-art/ts-common`
- `@nu-art/firebase-backend`
- `@nu-art/firebase-shared`
- `@nu-art/db-api-shared`
- `@nu-art/http-server`
