# db-api-frontend Tests

This package uses **3 layers of tests**: pure run-serialized-by-id and Playwright base-db/base-api. ApiCaller decorator tests live in `@nu-art/http-client`.

## Test Layers (overview)

| Layer | Name | BAI type | Pattern | Purpose |
|-------|------|----------|---------|---------|
| **1** | Unit – run-serialized-by-id | pure | `unit/run-serialized-by-id/**/*.test.ts` | BaseApi queueing, delete-wins, no-id-skip (Node or browser via dynamic import) |
| **2** | Playwright – base-db | playwright | `base-db/**/*.test.playwright.ts` | BaseDB in browser: loadCache, sync, upgrade, validation, clearData, cache filter |
| **3** | Playwright – base-api | playwright | `base-api/**/*.test.playwright.ts` | BaseApi in browser: query, queryUnique, upsert, patch, delete, deleteQuery, deleteAll |

**Note:** `@ApiCaller` decorator and its unit tests (isQueryMethod, resolveContent, method inference, lazy getter, callback order) live in `@nu-art/http-client`.

See [Thunderstorm test conventions](https://github.com/nu-art-js/thunderstorm/tree/main/.cursor/rules/package-standard/tests) for BAI types: pure, workspace, firebase, playwright.

## Implementation status

| Layer | Implemented | Tested & passing | Notes |
|-------|-------------|------------------|--------|
| **1 – Unit run-serialized-by-id** | ✅ Yes | ⏳ Unverified | `queueing.test.ts`, `delete-wins.test.ts`, `no-id-skip-queue.test.ts`; use `test-base-api.ts`. `no-id-skip-queue` skips when IDB unavailable in Node. |
| **2 – Playwright base-db** | ✅ Yes | ✅ Yes | 6 tests: load-cache, clear-data, sync (×2), upgrade, validation, cache-filter. **All passing.** |
| **3 – Playwright base-api** | ✅ Yes | ✅ Yes | 8 tests: query, query-unique, upsert, upsert-all, patch, delete, delete-query, delete-all. **All passing.** |

**Summary:** Playwright layers are tested and passing. Pure run-serialized-by-id tests run with BAI (ESM via ts-node/esm).

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
│   └── run-serialized-by-id/ # Pure: queueing, delete-wins, no-id-skip (+ test-base-api.ts)
├── base-db/                  # Playwright – BaseDB
└── base-api/                 # Playwright – BaseApi
```

## Running tests

- **Pure (layer 1):**  
  `bai --test --use-package=db-api-frontend --test-type=pure`

- **Playwright (layers 2–3):**  
  `bai --test --use-package=db-api-frontend --test-type=playwright`  
  Or from this package: `npx playwright test`

Debug/test page load: `src/test/_debug-page.load.test.playwright.ts` (optional; captures page errors).
