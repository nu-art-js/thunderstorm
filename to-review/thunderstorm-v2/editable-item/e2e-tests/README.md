# @nu-art/editable-item-e2e-tests

E2E test package for [@nu-art/editable-item](..\/editable-item). Contains the test backend (ModuleBE_EditableTestDB), shared test entity (types, db-def, api-def), and ATS demo UI used to exercise the editable-item library.

**Test-only package** (no consumable API). Layout follows the [Test-only (E2E) TypeScript package](_thunderstorm/.cursor/rules/package-standard/package-and-libraries.mdc) rule:

- `src/main/` — minimal `index.ts` only (so BAI compile succeeds).
- `src/test/` — all real content: shared entity, backend, ATS/frontend test UI, and (optionally) E2E spec files.

**Run tests:** `bai -t -tt=pure -up=editable-item-e2e-tests` (or `-tt=firebase` / `-tt=playwright` when added).
