# 2026-06-29 20:32 — Await emulator shutdown before runDirectNode returns

- **Author:** tacb0ss
- **Packages touched:** build-and-install/impl (Unit_FirebaseFunctionsApp, BaseUnit)
- **Concepts / docs:** firebase `-l` teardown, node-watch restart loop, graceful shutdown

## Why

`bai -l` of a firebase-function backend left firestore + pubsub emulators orphaned (ports held) on Ctrl-C, requiring a manual reap before the next launch.

Root cause was a teardown **race**, exposed only after the node restart loop moved from bash into TypeScript:

- The old bash version (`trap … ; while true; … node --watch …`) accidentally masked the race — the captured `$!` was the wrapper subshell, not node, so node never got the signal and the loop stayed blocked ~10s. That kept `launch()` open long enough for the emulator's clean shutdown to finish first.
- Moving the loop to TypeScript correctly captured node's pid, so node exits *fast* on SIGINT. `runDirectNode` then returned immediately, `launch()` completed, and the outer `run()` reached `process.exit(0)` **while the emulator's `export-on-exit` clean shutdown was still in flight** — killing the firebase CLI mid-reap and orphaning the two slowest emulators (firestore, pubsub).

The emulator child was fire-and-forgot (`.then()` only), so nothing held the run open for it. The node loop ending is not the end of teardown — the sibling emulator child must finish its clean shutdown too.

## What changed

- `startEmulatorsAndWait()` → **`startEmulators()`**: returns two handles — `ready` (all emulators up) and `terminated` (emulator CLI fully shut down). Previously it only signalled readiness and dropped the lifecycle promise.
- `runDirectNode()`: both exit paths route through new **`terminateNode(emulatorTerminated)`**, which `await`s the emulator's `terminated` promise before logging `NODE SERVER TERMINATED` and returning — keeping `launch()` open until the emulator is actually down.
- `BaseUnit`: `terminating` flag + `shouldStop()` + `interruptibleSleep()` (supports the TypeScript restart loop breaking promptly on `kill()`).

## Verified

Clean standalone `bai -nb -l -up=@app/beamz-backend`, Ctrl-C: `EMULATORS TERMINATED` logged before process exit; no firestore/pubsub orphan; ports 8352/8354-8360/9999 all free; no manual reap needed.
