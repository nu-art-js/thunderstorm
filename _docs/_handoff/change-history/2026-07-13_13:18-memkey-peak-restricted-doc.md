# 2026-07-13 13:18 — MemKey.peak documented as restricted
- **Author:** tacb0ss
- **Packages touched:** `ts-common`
- **Concepts / docs:** MemStorage, fail-fast, peak vs get

## Why

`peak()` intentionally bypasses fail-fast — it returns `undefined` instead of throwing when a key is unset, which silently hides missing-context bugs. Consumers were reaching for it as a default read (e.g. an active-session claim), where `get()` (throws on absence) is the correct, safer choice. The method carried no warning steering callers toward `get()`, so the restriction was invisible at the call site.

## What changed

- **`MemStorage.ts`** — expanded the `peak` JSDoc with a prominent restriction: use only with explicit permission, only when a genuinely-absent value is an expected/handled branch (optional claim on open APIs, transient override); prefer `get()` everywhere else. No behavior change.
