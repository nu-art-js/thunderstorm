# 2026-06-27 21:10 — bai teardown kills the whole process group, freeing ports

- **Author:** tacb0ss
- **Packages touched:** @nu-art/commando, @nu-art/build-and-install
- **Concepts / docs:** InteractiveShell process-group lifecycle, BaseUnit terminatable, firebase emulator graceful shutdown

## Why

On Ctrl-C / process interrupt, `bai` left the actual listening processes alive, so relaunch failed with `EADDRINUSE` on `8352` (http) and `9999` (MCP WS).

Root cause: `executeAsyncCommando` registered `() => commando.killSubprocess(pid)` where `pid` is the **inner** subshell (`$!`), and `killSubprocess` sends `SIGINT` to that single pid only. The watch wrapper's `trap 'exit 0'` exits the subshell while bash defers the trapped signal during its foreground `node --watch` child — so `node --watch` and the app survive, orphaned, holding the ports. The single-pid signal can never reach them.

The shell is spawned `detached: true`, making `this.shell.pid` the **process-group leader** (PGID). The backend tree (both bash wrappers + `node --watch` + app) shares that group, so killing the **group** reaps everything in one shot. This is the correct teardown unit for the backend/node path.

The firebase emulator path is deliberately **excluded** from group-kill: the firestore/database/pubsub Java emulators reparent into their **own** process groups, so a group `SIGKILL` cannot reach them — they are reaped only by the firebase CLI's own `cleanShutdown`, which also performs `--export-on-exit`. firebase-tools treats `SIGTERM == SIGINT` (one handler). So the emulator must get a single graceful signal to the CLI and a generous wait, with a group-`SIGKILL` straggler sweep only on timeout. A fixed short grace + unconditional group-kill would kill the CLI mid-export and orphan the Java emulators — bricking the next launch.

## What changed

- `commando/src/main/interactive/InteractiveShell.ts` — new `killGroup(graceMs = 5000)`: `SIGTERM` the detached group (`process.kill(-pid, …)`), poll liveness, then `SIGKILL` stragglers. Private `signalGroup` (swallows `ESRCH`) and `isGroupAlive` helpers. `killSubprocess`/`kill` left unchanged (single-pid semantics; async tests depend on them).
- `commando/src/main/interactive/CommandoInteractive.ts` — `killGroup(graceMs?)` delegate; `killSubprocess` now forwards an optional `timeout` to the shell.
- `build-and-install/.../units/base/BaseUnit.ts` — `executeAsyncCommando` default terminatable is now `() => commando.killGroup()` (also removes the latent race where `pid` was undefined if interrupt arrived before `$!` was echoed). New optional `createTerminatable` factory (`TerminatableFactory`) lets specific units override the teardown.
- `build-and-install/.../units/implementations/firebase/Unit_FirebaseFunctionsApp.ts` — `gracefulEmulatorTerminatable`: `SIGINT` the firebase CLI `$!` then wait `emulatorShutdownGraceMs` (default `Default_EmulatorShutdownGraceMs = 20s`, configurable via unit config); on overrun, sweep the group with `killGroup(0)`. Wired into both emulator callers (`startEmulatorsAndWait`, `runEmulator`). The `node --watch` wrapper was also rewritten to forward `SIGTERM` to its child (defense-in-depth) while preserving the break-on-0/130/143 restart loop.

## Verified

- Build: `bai -up='commando|build-and-install'` — clean.
- Tests: `bai -t -tt=pure -up=commando` — 50 passing (single-pid SIGINT/SIGTERM/SIGKILL tests stay green).
- Backend symptom (isolated harness driving the built `CommandoInteractive`): old `killSubprocess(innerPid)` → timed out after 10s, `8352`/`9999` still held, 2 orphan node procs survived; new `killGroup()` → returned in ~100ms, both ports freed, 0 orphans.
- Emulator regression (isolated firestore emulator, exact `gracefulEmulatorTerminatable` logic): graceful teardown in ~0.9s, `firebase-export-metadata.json` + `firestore_export` written, Java emulator reaped by the CLI (0 orphans), CLI exited cleanly, port freed.
