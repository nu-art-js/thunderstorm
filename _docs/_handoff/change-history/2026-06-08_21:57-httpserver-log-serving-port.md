# 2026-06-08 21:57 — HttpServer logs the serving address at info level
- **Author:** tacb0ss
- **Packages touched:** http/server (@nu-art/http-server)
- **Concepts / docs:** HttpServer startup logging

`HttpServer.startServer` already logged the bound address, but at `logDebug` (hidden by default). Promoted it to `logInfo` and made it explicit: `Serving on <protocol>://localhost:<port>`, where protocol is derived from `config.ssl` and the port comes from the actual bound `server.address().port` (so it reports the real port even when none is configured and the OS assigns one). Benefits all consuming apps.
