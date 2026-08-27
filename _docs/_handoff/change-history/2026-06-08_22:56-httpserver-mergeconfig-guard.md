# 2026-06-08 22:56 — HttpServer.mergeRuntimeConfig guards against empty config wipe
- **Author:** tacb0ss
- **Packages touched:** http/server (@nu-art/http-server), .rules/consuming
- **Concepts / docs:** node-mode HttpServer init; config establishment assertions

`mergeRuntimeConfig(partial)` called `merge(this.config, partial, true)`, and `merge(x, undefined)` returns `undefined` — so an app module passing an absent config (`ModuleBE_AppModule` with no RTDB `httpServer`) wiped a config the entry point had already set, crashing at `HttpServer.init` (`reading 'baseUrl'`) / `createServer` (`reading 'ssl'`).

Fix: `mergeRuntimeConfig(partial?)` now returns `this` unchanged when the partial is missing/empty (no-op, never a wipe). Documented the config-establishment assertion checks in `.rules/consuming/project-backend-setup.mdc` → Run mode → node mode.
