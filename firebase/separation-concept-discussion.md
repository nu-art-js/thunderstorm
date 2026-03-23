# Database separation concept — discussion notes

**Context**: Breaking the database monolith; defining a db-agnostic interface so db-api and app code can work with Firestore, Redis, Postgres, etc. via a single contract.

**For review when back** — options, dilemmas, open questions, no decisions yet.

---

## 1. Current state (what we’re abstracting)

### 1.1 Who uses Firestore today

- **db-api (ModuleBE_BaseDB)**  
  - Gets a `FirestoreCollection` from `ModuleBE_Firebase.createAdminSession().getFirestore().getCollection(dbDef, hooks)`.  
  - Uses: `collection.query`, `collection.create`, `collection.set`, `collection.delete`, `collection.doc`, `collection.runTransaction`.  
  - Passes **hooks** into the collection: `canDeleteItems`, `preWriteProcessing`, `postWriteProcessing`, `upgradeInstances`, `manipulateQuery`.

- **db-api (ModuleBE_BaseApi)**  
  - Calls `dbModule.query.where(queryBody)`, `dbModule.set.item/all`, `dbModule.delete.unique/query`, etc.  
  - Request/response types use **CrudQuery / CrudClause_Where** from `db-api-shared` (already db-agnostic).  
  - Still **casts** body to `FirestoreQuery<T>` when calling the DB module (e.g. `queryBody as FirestoreQuery<T>`). So the API is conceptually db-agnostic but the implementation is Firestore-typed.

- **FirestoreCollection**  
  - Exposes: `query` (where, unique, uniqueAssert, custom), `create` (item, all), `set` (item, all), `delete` (unique, item, all, query, unManipulatedQuery), `doc`, `runTransaction`.  
  - Uses **FirestoreCollectionHooks** for validation, lifecycle, and query shaping.

### 1.2 Data flows to cover (from todo)

| Flow | Firestore today | Needed for generic interface |
|------|------------------|------------------------------|
| New document | create.item / create.all | create one / create many |
| Update document | set.item / set.all | set one / set many |
| Delete document | delete.unique / delete.item / delete.query / delete.all | delete by id / by query |
| Read | query.unique / query.where / doc.unique().get | get by id / query (where, orderBy, limit, etc.) |

Transactions and “run in chunks” are Firestore implementation details; the interface can expose “run in transaction” as an optional capability.

---

## 2. Interface design options

### Option A: Single “collection” interface

One object per collection with methods: `query`, `create`, `set`, `delete`, `getById`, and optionally `runTransaction(fn)`.

- **Pros**: Mirrors current FirestoreCollection usage; one place to pass hooks/callbacks.  
- **Cons**: Big interface; some DBs may not support transactions or batch writes the same way.

### Option B: Split by concern (Query / Write / Delete)

Separate interfaces, e.g. `CollectionQuery`, `CollectionWrite`, `CollectionDelete`, composed by a “collection” facade.

- **Pros**: Smaller contracts; can implement only what a DB supports (e.g. read-only wrapper).  
- **Cons**: More types and wiring; db-api currently expects one collection object with all methods.

### Option C: Minimal “CRUD + query” surface

One interface with only: `getById`, `query(where/orderBy/limit)`, `setOne`, `setMany`, `deleteById`, `deleteByQuery`, and optionally `runTransaction`. No `create` vs `set` distinction in the interface (implementations can map both to put/upsert).

- **Pros**: Easiest to implement for Redis/Postgres/Mongo; matches “CRUD API” mental model.  
- **Cons**: Firestore has create vs set semantics; we’d be normalizing that in the wrapper.

**Recommendation (for discussion)**: Start with **Option A or C**. Option A keeps the current shape and pushes “how” into each wrapper; Option C forces a minimal contract and may simplify testing and other backends. We can refine after mapping the exact method list to Redis/Postgres.

---

## 3. Where do “hooks” live?

Today **FirestoreCollectionHooks** are: `canDeleteItems`, `preWriteProcessing`, `postWriteProcessing`, `manipulateQuery`, `upgradeInstances`.

- **Option 1 — Hooks stay in the wrapper**  
  The generic interface includes optional lifecycle callbacks (e.g. `beforeWrite`, `afterWrite`, `canDelete`, `transformQuery`). Each wrapper calls them at the right time.  
  **Pro**: Same app code (ModuleBE_BaseDB) works with any DB. **Con**: Interface is heavier and tied to “write lifecycle”.

- **Option 2 — Hooks live in the app layer**  
  The wrapper exposes only “raw” operations (get, query, set, delete). ModuleBE_BaseDB (or a thin adapter) owns canDelete, pre/post write, upgradeInstances, manipulateQuery and calls the wrapper.  
  **Pro**: Interface stays minimal and db-agnostic. **Con**: More logic in db-api or in a per-DB adapter layer.

- **Option 3 — Hybrid**  
  Interface has a minimal extension point (e.g. single `options` or `context` per call) and the app passes in behavior; the wrapper only “calls back” if it supports it.  
  **Pro**: Flexible. **Con**: Contract is fuzzier; harder to test uniformly.

**Dilemma**: Sync manager (e.g. `ModuleBE_SyncManager.setLastUpdated`, `onItemsDeleted`) is **application** concern and should stay outside the wrapper. So at least `postWriteProcessing`-as-used-today is partly “notify app” — that could stay in ModuleBE_BaseDB and call the wrapper, then run sync. So we could move toward Option 2 and keep the wrapper dumb.

---

## 4. Query type: one canonical shape

- **db-api-shared** already has **CrudQuery / CrudClause_Where / CrudEmptyQuery** (where, orderBy, select, limit, withDeleted).  
- **firebase-shared** has **FirestoreQuery** (same shape; used by Firestore SDK).  
- So the “wire” type for the API and for the generic interface should be **CrudQuery** (or a type alias). Wrappers (Firestore, Redis, Postgres) translate CrudQuery → native queries.

**Decision to confirm**: The generic interface uses **CrudQuery** (from db-api-shared or a shared kernel). No `FirestoreQuery` in the interface signature. That removes the need for casts in ModuleBE_BaseApi.

---

## 5. Dilemmas and tensions

### 5.1 Transactions

- Firestore: `runTransaction(fn)` with get/set/delete inside.  
- Redis: MULTI/EXEC or similar.  
- Postgres: BEGIN/COMMIT and a client that can run multiple operations in one connection.

**Tension**: If the interface exposes `runTransaction(fn)`, `fn` must receive a “transaction-scoped” view of the same operations (get, set, delete). That implies either (a) the interface’s operations are all transaction-aware (take optional `transaction?`), or (b) the wrapper builds a “transaction context” and passes it into the callback. Current Firestore code uses (a). A generic interface likely keeps (a) and wrappers map it to their transaction model.

### 5.2 Batch / chunking

- Firestore has limits (e.g. 500 ops per batch). FirestoreCollection does `runTransactionInChunks` for large deletes/writes.  
- This can stay **inside** the Firestore wrapper: the interface can say “deleteByQuery(query)” and the Firestore implementation chunks internally. So chunking is not part of the generic interface.

### 5.3 “withDeleted” and soft delete

- Firestore layer has `withDeleted` on queries and soft-delete handling.  
- If we want the same behavior on Redis/Postgres, either (1) the generic interface supports `withDeleted` and every wrapper implements it (e.g. a “deleted” flag), or (2) it’s an app-level convention and the wrapper only exposes “get/query/set/delete” and the app (or a middleware) filters.  
- Open: do we want soft delete in the interface or out?

### 5.4 Unique keys and doc identity

- Firestore: doc id is the primary key; `uniqueKeys` are used for “get by unique key set” and validation.  
- Redis/Postgres: primary key + unique indexes.  
- The interface could speak in “id” (string) and “item” (object); uniqueness constraints are configuration of the wrapper or the schema, not necessarily part of the generic method signatures.

---

## 6. Testing strategy (from todo)

- **Contract tests**: One test suite (inputs/outputs and behaviors) defined in terms of the **generic interface**. Run the same suite against Firestore wrapper, Redis wrapper, Postgres wrapper (and optionally in-memory).  
- **Data flows to cover**: create one/many, set one/many, delete by id/query, query (where, orderBy, limit), getById; plus failure cases (not found, duplicate key, invalid query).  
- **Where tests live**: Either (a) in a shared package that depends only on the interface and receives a “factory” for a collection instance, or (b) in each wrapper package with a shared test **harness** that imports the same scenario definitions.  
- **Open**: Do we want a **reference in-memory implementation** of the interface (e.g. in ts-common or a small package) so that db-api and others can run without a real DB in unit tests?

---

## 7. Open questions (to close later)

1. **Single interface vs split (Query / Write / Delete)** — Option A vs B vs C above.  
2. **Hooks in wrapper vs app** — Option 1 vs 2 vs 3; and whether `manipulateQuery` is part of the interface or always app-side.  
3. **Transaction surface** — Optional `runTransaction(fn)` and/or optional `transaction` parameter on each method?  
4. **Soft delete / withDeleted** — In contract or out?  
5. **Package layout** — One package per DB (e.g. `firestore-wrapper`, `redis-wrapper`, `postgres-wrapper`) plus one shared package for the interface (and maybe CrudQuery)? Shared package could live under db-api or a new “db-core” / “db-contract”.  
6. **Naming** — “Wrapper” vs “Driver” vs “Adapter”; and name of the interface (e.g. `CollectionStore`, `CrudCollection`).  
7. **Versioning** — When we add a new method or parameter to the interface, how do we avoid breaking existing wrappers? (e.g. optional methods, or explicit version of the contract.)

---

## 8. Suggested next steps (after review)

1. **Lock the query type**: Use CrudQuery everywhere in the interface; remove FirestoreQuery from db-api’s public surface.  
2. **List the exact methods** the interface must have (no more, no less) and document expected behavior (e.g. “setOne creates or overwrites”).  
3. **Decide hooks vs app** and then sketch the interface (with or without lifecycle callbacks).  
4. **Add a minimal in-memory implementation** and one contract test suite that runs against “any implementation”.  
5. **Implement Firestore wrapper** against that interface (and refactor ModuleBE_BaseDB to use it).  
6. **Then** add Redis/Postgres wrappers and run the same tests.

---

*Written for offline review; no code changes. When you’re back we can refine and turn this into concrete interface + tasks.*
