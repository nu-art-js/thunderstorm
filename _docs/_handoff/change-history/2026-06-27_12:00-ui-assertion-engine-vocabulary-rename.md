# ui-test-harness: UI_Assertion* vocabulary rename

- **When:** 2026-06-27
- **Packages touched:** _thunderstorm/ui-test-harness; consumers app-common/layout-checks, app/e2e-admin-portal render-audit wiring; _docs/specs/render-audit symbol references

## Why

The engine mixed two metaphors — "audit" and "contract" — that were meaningless in this context and collided with product language (render-audit as a capability name vs. a class name). A single house-style lexicon (`UI_Assertion*` types, plain camelCase methods) makes the API self-describing: the engine runs registered **assertions** over fiber-extracted `(props, state, dom)`, not opaque "contracts." Renaming the class file to `UI_AssertionEngine.ts` aligns the on-disk artifact with the exported symbol.

## What changed

- **File rename:** `RenderAudit.ts` → `UI_AssertionEngine.ts` (plain `mv`; file was untracked in git at rename time).
- **Types:** `RenderAudit` → `UI_AssertionEngine`; `Contract` → `UI_Assertion`; `ContractMap` → `UI_AssertionMap`; `RegisteredContract` → `UI_AssertionRegistration`; `ContractRegistrationOptions` → `UI_AssertionOptions`; `HasContract` → `UI_AssertionLookup`; `AuditFailure*` → `UI_AssertionFailure*`; `AuditTrace*` → `UI_AssertionTrace*`.
- **Methods/fields:** `registerContract` → `registerAssertion`; private `audit()` → `runAssertions()`; `contracts` → `assertions`; `hasContract` param → `hasAssertion`; `isAuditableComponentTag` → `isComponentTag`.
- **Trace/kind literals:** `'contract'` → `'assertion'`; `'audit-start'`/`'audit-complete'` → `'run-start'`/`'run-complete'`.
- **Consumers:** layout-checks, e2e register/wire IIFE, harness self-tests, README/ISSUES, render-audit spec symbol references.
- **Unchanged:** `window.__uiTestHarness` global key, package name, render-audit spec folder/concept, copyright headers.
