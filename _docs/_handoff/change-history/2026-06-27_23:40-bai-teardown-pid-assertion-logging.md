# 2026-06-27 23:40 — bai teardown: PID-assertion instrumentation (diagnostic, no semantic change)

## What changed
- `commando/src/main/interactive/InteractiveShell.ts`
  - After `spawn('/bin/bash', { detached: true … })`: log `commando shell spawned: shell.pid=<pid> (detached session/group leader, PGID=<pid>)`.
  - Added `getShellPid()` accessor exposing the detached shell (leader) pid for correlation.
  - `killSubprocess` log → `killSubprocess target pid=<pid> signal=<sig> (single-pid; shell.pid/leader=<leader>)`.
  - `killGroup` log → `killGroup target PGID=<pid> (signaling whole group via -<pid>) signal=SIGTERM`.
- `commando/src/main/interactive/CommandoInteractive.ts`
  - In `appendAsync`, at the `$!` capture point: log `appendAsync captured pid=<$!> (inner subshell = $!) shell.pid=<leader> (group leader) cmd="<first 80>"` — captured-pid vs leader-pid side by side.
- `build-and-install/impl/src/main/units/base/BaseUnit.ts`
  - `executeAsyncCommando`: made `createTerminatable` optional (nullish-default to the same `() => cmd.killGroup()` factory — behavior identical) so the registered strategy is detectable; logs `unit=… teardown=group-kill|custom/graceful cmd=…` at registration and `captured async pid=<pid>` when `$!` fires.
- `build-and-install/impl/src/main/units/implementations/firebase/Unit_FirebaseFunctionsApp.ts`
  - `gracefulEmulatorTerminatable`: log `signaling firebase CLI $!=<pid> signal=SIGINT graceMs=<n>` before signalling.

No teardown semantics were changed in this pass: `killGroup` still SIGTERM, `BaseUnit` default still group-kill, the `node --watch` wrapper is untouched. Instrumentation only.

## Why
The first-pass fix freed ports but the user reported the **backend** still died with raw exit 143 (not graceful). Before changing teardown behavior again, we needed to make visible — in the real environment — exactly which OS process bai records for each async child, because the registered terminatable targets that recorded pid. A real standalone `bai -nb -l -up=@app/beamz-backend` run with this instrumentation proved the hypothesis:

- Backend group PGID 85542: leader `85542 bash` → inner subshell `85888 bash` (= bai's captured `$!`) → `85889 node --watch` → `85890 node dist/index.js` (the real 8352/9999 listener). bai records the **inner subshell (85888)**, two levels above the listener — so `killSubprocess(capturedPid)` never reached the app, and `killGroup`/SIGTERM hit the app raw → exit 143.
- Emulator group PGID 84908: leader `84908 bash` → `85253 node firebase.js` (= bai's captured `$!`, the CLI itself, no wrapper subshell). SIGINT to it triggers firebase's graceful export-on-exit — which is why the emulator was always fine.

This instrumentation is the evidence base for the next (separate) pass that will actually fix the backend's signal/grace contract. Full captured logs + ps tree + mapping table: `beamz/.cursor/scratch/bai-pid-assertion-2026-06-27.md`.
