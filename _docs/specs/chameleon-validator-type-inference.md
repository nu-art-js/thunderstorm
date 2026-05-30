# Chameleon — Validator-First Type Inference (Spike)

**Date**: 2026-05-30
**Status**: Proposed — isolated spike (not yet started)
**Task**: [AgentDrivenDevelopment/Task #525](https://nu-art.fibery.io/AgentDrivenDevelopment/Task/525) (Project: Thunderstorm)
**Package**: `_thunderstorm/experiment/chameleon` (isolated `typescript-lib`, depends on nothing — copies the validator slice from `ts-common`)

---

## Motivation

The framework's validation system works well and is **type-first**: the entity `type T` is the single
source of truth, and `ValidatorTypeResolver<T>` is a structural mirror the compiler forces to match `T`
field-for-field (`_thunderstorm/ts-common/src/main/validator/validator-core.ts`). The mirror cannot
drift, but you author **two artifacts** per entity — the type and the validator.

The appeal of zod is the inverse: author **one** schema, infer the type (`z.infer`). This spike explores
capturing that ergonomic **natively** — a framework-owned `InferType<typeof validator>` — so the
**validator becomes the SSOT** and the entity type is derived. No zod dependency; the framework's own
validator engine stays the runtime.

**Explicit non-goal:** replacing or modifying the current infra. Chameleon is a sealed sandbox to prove
(or disprove) the idea with freedom to break nothing.

---

## Why native, not zod

- **Zod "only for the type" in the DB layer is a net negative.** Using a zod schema purely to `z.infer`
  the type while keeping the framework validator for runtime yields three artifacts (zod schema +
  inferred type + framework validator), a new dependency, and a parallel definition — a direct SSOT
  violation. The single-source payoff only lands when the *same* artifact is also the runtime check.
- **The framework lacks the inverse helper today.** `ValidatorTypeResolver<K>` is one-directional
  (type → validator). The spike's core deliverable is the missing direction: validator → type.

---

## Core deliverables

1. **`InferType<V>`** — recover the entity type from a validator value.
   - Leaf inference works because `ValidatorImpl<P> = (p?: P, parentObj?: any) => ...` carries `P` in the
     first parameter; primitive builders return precise `Validator<P>` (`tsValidateString → Validator<string>`, etc.).
   - Optionality is the one real gap: `mandatory` is a runtime arg invisible to the type system. Closed
     with a type-level brand (`OptionalValidator<P>`) emitted when a builder is called with
     `mandatory = false`, plus the standard optional-key split in the mapped type.

2. **`defineEntity({ modifiable, generated })`** — takes **two** validator buckets and derives:
   - `Modifiable = InferType<modifiable>`, `Generated = InferType<generated>`
   - `dbType   = Modifiable & Generated & DB_Object`
   - `uiType   = Modifiable & Partial<Generated> & Partial<DB_Object>`
   - `preDbType = Modifiable & Partial<Generated>`
   - `generatedProps = _keys(generated)` — **derived**, not hand-listed.

3. **Combinator algebra** (each carries runtime + type):
   `object`, `array`, `record` (for `tsValidateDynamicObject` → `{ [k]: v }`), `optional`/`optionalObject`,
   `value<const T>` (literal-union precision fix), `discriminatedUnion(key, variants)`, plus the two
   escape hatches `refine(baseV, fn)` and `custom<T>(fn)`.

---

## Validator spectrum (inferrable → opaque)

Derived from real quai-web entities (`pathway/_entity/action`, `healthcare-space/_entity/expression`).

| # | Pattern | Real example | Inferrable? | Combinator |
|---|---------|--------------|-------------|------------|
| 1 | Flat structural object | `Validator_Action_General` | YES | `object({...})` |
| 2 | Discriminated union via runtime type-switch | `Validator_Action` (dispatch on `instance.type`) | union YES (per-branch); top fn NO | `discriminatedUnion('type', {...})` |
| 3 | Nested optional object | `tsValidateNonMandatoryObject({...})` | YES | `optionalObject({...})` |
| 4 | Array of structural objects | `tsValidateArray({...})` | YES | `array(elementV)` |
| 5 | Dynamic / index-signature object | `tsValidateDynamicObject(...)` | YES | `record(keyV, valueV)` |
| 6 | Literal-union leaf | `tsValidateValue([...consts])` | only if builder is `<const T>` | `value<const T>()` |
| 7 | Cross-field / context refinement | expression `associatedVar`, `Validator_RightHand` (reads `parentObject`) | type from BASE leaf only; rule runtime-only | `refine(baseV, fn)` |
| 8 | Deep recursive imperative AST | expression `terms: Term[]` (`getExpressionValidator`) | NO — author the type by hand | `custom<T>(fn)` |

### The make-or-break case: `discriminatedUnion`

`DB_Action = DB_Action_Order | DB_Action_Interflow`; `Validator_Action` switches on `instance.type`.
The top function is opaque, but each branch is a structural `object({...})` spreading a shared
`object(General)`. Target: one declaration yields the dispatch fn **and**
`InferType = InferType<Order> | InferType<Interflow>`.

**Union distribution subtlety:** when `modifiable` is a `discriminatedUnion`,
`dbType = (Order | Interflow) & Generated & DB_Object` must **distribute** over the union →
`(Order & G & D) | (Interflow & G & D)`. The type math must get this right or `dbType` collapses.

---

## Hard boundaries (out of scope by design)

- **Version history is not inferrable.** `VersionTypes_*` are frozen historical snapshots (1.0.0 → …).
  A present validator cannot describe a past shape. Chameleon infers the **head `dbType` only**; version
  history stays hand-authored. (quai-web is `production` lifecycle — migrations matter there.)
- **Imperative cross-field logic is runtime-only.** Anything reading `parentObject` to decide validity
  (patterns 7–8, the bulk of expression's complexity) never shapes the inferred type. Same line zod draws
  with `.refine()` / `z.custom<T>()`. Stating this boundary is part of the deliverable — otherwise
  Chameleon will look like it "failed" on expression when expression is intentionally out of scope.

---

## Packaging & build

- Single `typescript-lib` at `_thunderstorm/experiment/chameleon`, importing nothing external (copies the
  minimal validator slice from `ts-common`).
- Build via `bai -up=<package-name>` (the `name` in `__package.json`, **not** the folder).
- BAI discovers units by tracing from apps; an orphan unit may not be picked up. If so, add a **throwaway
  inbound dependency edge** from an existing reachable unit for the duration of the spike, then remove it.
  (`npx tsc` is banned — type-checking must go through BAI.)
- Package-root `.gitignore` for `dist/` / `dist-test/`; tests are pure type-level assertions under `src/test/`.

---

## Open questions for implementation

- Auto-inject `DB_Object` into the `generated` bucket, or keep the explicit `...DB_Object_validator`
  spread (current convention)? Auto-inject is cleaner SSOT; explicit matches today.
- How far to push `discriminatedUnion` inference (nested discriminants, shared-base spreads).
- Whether `refine` should support narrowing the inferred type or strictly pass it through (zod's
  `.refine` passes through; `.transform` narrows — likely out of scope).
