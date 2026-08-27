# 2026-07-05 15:37 — Port scan captures stdout via log-level filter, not a consuming processor
- **Author:** tacb0ss
- **Packages touched:** _thunderstorm/build-and-install/impl
- **Concepts / docs:** BAI firebase test harness, Commando log processors vs log-level filter

## Why

The mongo/emulator port scan (added across the 14:31–15:00 handoffs) never actually detected a busy port. `bai -t -tt=firebase -up=organization-backend` failed at container start with `Bind for 0.0.0.0:27019 failed: port is already allocated` even though the scan was supposed to skip 27019 (held by dev `mongo-emu--app-beamz-backend` / `com.docker.backend`) and move to 27020.

Root cause is Commando log-processor **ordering**. `describeHostPortListeners` suppressed console noise with `.addLogProcessor(() => false)`. That processor is registered *before* `execute()`, which then inserts its own capture processor (`stdLogProcessor`) at the **end** of the chain. Per-message processing stops at the first processor that returns `false`, so `() => false` consumed every `printf` data line before the capture processor ran → captured stdout was always empty → `describeHostPortListeners` returned `[]` → every port looked free. The whole port-scan feature is uncommitted WIP, so it had never worked.

Suppressing output by *consuming* the message is the wrong lever: it competes with capture. The right lever is the **log-level filter**, which downgrades a line's level (hiding it at the normal Info console threshold) without consuming it — so `execute()`'s capture processor still sees the line.

## What changed

- **`Unit_PackageJson.describeHostPortListeners`:** replaced `.addLogProcessor(() => false)` with `.setLogLevelFilter((_log, std) => std === 'err' ? undefined : LogLevel.Verbose)`. stdout lines are downgraded to Verbose (hidden in normal runs, still captured); stderr falls through to the default filter. Added `LogLevel` to the `@nu-art/ts-common` import.

Manual verify (dev stack up, mongo on 27019): scan now logs `Port 27019 in use (... com.docker.backend); skipping` → `Port 27019 in use; using 27020`, `mongo-test--app-organization-backend` starts on 27020, emulators take 8004–8006, and the firebase suite runs. Validated by user.
