# 2026-06-08 21:58 — Document backend run mode (node server vs Firebase Functions)
- **Author:** tacb0ss
- **Packages touched:** .rules/consuming
- **Concepts / docs:** Backend run mode; ModuleBE_AppModule initiates HttpServer in node mode

Added a "Run mode — node server vs Firebase Functions" section to `.rules/consuming/project-backend-setup.mdc`. Makes explicit that in **node mode** the app module (`ModuleBE_AppModule`) initiates the HTTP server (`mergeRuntimeConfig(...).init()` → `Storm.build()` → `HttpServer.startServer()`), with no `ModuleBE_ExpressFunction` / `export const api`; and that this is the mode required by MCP. Cross-linked from `_thunderstorm-ext/mcp/.rules/how-to-integrate.mdc`.
