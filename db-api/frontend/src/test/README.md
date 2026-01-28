# db-api-frontend Tests

This package uses **5 layers of tests**, from pure logic to full browser integration.

## Test Layers (overview)

| Layer | Name | BAI type | Pattern | Purpose |
|-------|------|----------|---------|---------|
| **1** | Unit – helpers | pure | `unit/helpers/**/*.test.ts` | Pure functions: `isQueryMethod`, `resolveApiDef` |
| **2** | Unit – decorator | pure | `unit/decorator/**/*.test.ts` | `@ClientApi` behaviour: method inference, lazy getter, callback order |
| **3** | Unit – run-serialized-by-id | pure | `unit/run-serialized-by-id/**/*.test.ts` | BaseApi queueing, delete-wins, no-id-skip (Node or browser via dynamic import) |
| **4** | Playwright – base-db | playwright | `base-db/**/*.test.playwright.ts` | BaseDB in browser: loadCache, sync, upgrade, validation, clearData, cache filter |
| **5** | Playwright – base-api | playwright | `base-api/**/*.test.playwright.ts` | BaseApi in browser: query, queryUnique, upsert, patch, delete, deleteQuery, deleteAll |

See [Thunderstorm test conventions](https://github.com/nu-art-js/thunderstorm/tree/main/.cursor/rules/package-standard/tests) for BAI types: pure, workspace, firebase, playwright.

## Implementation status

| Layer | Implemented | Tested & passing | Notes |
|-------|-------------|------------------|--------|
| **1 – Unit helpers** | ✅ Yes | ⏳ Unverified | `is-query-method.test.ts`, `resolve-api-def.test.ts`. Run with BAI pure tests (ESM via ts-node/esm). `@nu-art/http-client` is ESM-only (no CJS/default). |
| **2 – Unit decorator** | ✅ Yes | ⏳ Unverified | `method-inference.test.ts`, `lazy-getter.test.ts`, `callback-order.test.ts` (+ `http-stub.ts`). Same as layer 1. |
| **3 – Unit run-serialized-by-id** | ✅ Yes | ⏳ Unverified | `queueing.test.ts`, `delete-wins.test.ts`, `no-id-skip-queue.test.ts`; use `test-base-api.ts`. `no-id-skip-queue` skips when IDB unavailable in Node. |
| **4 – Playwright base-db** | ✅ Yes | ✅ Yes | 6 tests: load-cache, clear-data, sync (×2), upgrade, validation, cache-filter. **All passing.** |
| **5 – Playwright base-api** | ✅ Yes | ✅ Yes | 8 tests: query, query-unique, upsert, upsert-all, patch, delete, delete-query, delete-all. **All passing.** |

**Summary:** Layers **4 and 5** are tested and passing. Layers **1, 2, 3** are implemented; BAI runs them as ESM (ts-node/esm). `@nu-art/http-client` is ESM-only (exports: `types` + `import` only; no CJS or `default`).

## Layout

```
src/test/
├── README.md                 # This file
├── index.html                # Playwright test page
├── test-entry.ts             # Exposes package + test helpers to window (main + test-utils only)
├── test-utils.ts             # cleanupDbApiIDB, TestBaseApi*, fixtures re-exports
├── fixtures/
│   └── index.ts              # DB_TestItem, testItemBaseDBConfig, createStubCrudApiDefShape, etc.
├── unit/
│   ├── helpers/              # Layer 1
│   ├── decorator/            # Layer 2
│   └── run-serialized-by-id/ # Layer 3 (+ test-base-api.ts)
├── base-db/                  # Layer 4 – Playwright
└── base-api/                 # Layer 5 – Playwright
```

## Running tests

- **Pure (layers 1–3):**  
  `bai --test --use-package=db-api-frontend --test-type=pure`

- **Playwright (layers 4–5):**  
  `bai --test --use-package=db-api-frontend --test-type=playwright`  
  Or from this package: `npx playwright test`

Debug/test page load: `src/test/_debug-page.load.test.playwright.ts` (optional; captures page errors).
