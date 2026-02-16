# Firebase backend test harness (stormTester replacement)

## Problem

Backend packages that use `stormTester` and `StormTestInput` from `@nu-art/thunderstorm-backend/test/StormTest` to run Firebase emulator tests cannot migrate off thunderstorm-backend without a replacement.

## How to migrate

**Do not** import `stormTester`, `StormTestInput`, or `StormTest` from `@nu-art/thunderstorm-backend`.

**Option A — Minimal in-package harness:** Implement a small test bootstrap that (1) configures the Firebase emulator (project id, database URL), (2) initializes only the modules under test (e.g. user-account backend modules + db-api + http-server), (3) runs test cases, (4) cleans up. This avoids Storm and thunderstorm-backend. Document the bootstrap in this package and in `_docs/migration-to-v2`.

**Option B — Depend on a thunderstorm-v2 test package:** If the repo provides a test harness package under `to-review/thunderstorm-v2/test` that has no thunderstorm-* dependency (e.g. uses only firebase-backend, http-server, db-api), add that package as a devDependency and use its `stormTester`-equivalent API.

**Option C — Skip Firebase tests temporarily:** Mark Firebase tests as skipped or move them to a follow-up task; ensure pure unit tests pass. Add a task to reintroduce a harness (Option A or B) and document here.

## Example

User-account-backend either: (A) added a minimal `StormTest.ts` (or `FirebaseTestHarness.ts`) in `src/test/` that configures the emulator and initializes the user-account backend modules plus HttpServer/db-api, then runs the existing test cases; or (B) added a dependency on a v2 test package and updated imports to use its API.
