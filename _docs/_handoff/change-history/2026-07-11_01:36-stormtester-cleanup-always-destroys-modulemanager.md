# 2026-07-11 01:36 — stormTester always tears down ModuleManager
- **Author:** tacb0ss
- **Packages touched:** storm-testalot, ts-common
- **Concepts / docs:** ModuleManager singleton, firebase test harness

## Why

`stormTester` ran test `after` hooks and `ModuleManager.destroy()` in one `finally` block. When `after` threw (e.g. Mongo topology already closed during collection cleanup), cleanup never ran and the singleton leaked — every subsequent test in the same Mocha process failed with `Already have one instance of ModuleManager`. Deploy gate `@app` firebase tests went 0/12. Teardown must be unconditional; module `destroy()` failures must not block clearing the singleton.

## What changed

- `StormTest.ts` — nested `finally` so `cleanup()` runs even when `after` throws.
- `module-manager.ts` — `destroy()` uses `Promise.allSettled` before clearing `_modules` and deleting `instance`.
