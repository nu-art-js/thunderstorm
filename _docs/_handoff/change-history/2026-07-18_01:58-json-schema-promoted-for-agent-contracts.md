# 2026-07-18 01:58 — Promote JSON_Schema to ts-common for agent wire contracts
- **Author:** tacb0ss
- **Packages touched:** ts-common, ts-agents/tools/backend
- **Concepts / docs:** JSON_Schema, branded string wire collapse, jsonSchemaUniqueId

## Why

Agent tool/router capabilities need a type-strict JSON Schema object that can live outside agent-tools-only packages. Keeping `JSON_Schema` in ts-agent-tools forced mcp-router (and entity packages) into the wrong dependency. Branded ids (`DB_UniqueId`) also broke assignment into `JSON_Schema` property slots unless callers cast — wire schemas must treat string brands as plain strings so one `jsonSchemaUniqueId` helper works without `as unknown as`.

## What changed

- Added `ts-common` `JSON_Schema<T>` (object `properties` `-?`, optional keys via `NonNullable`, null/void, string-brand collapse).
- Exported `jsonSchemaUniqueId` beside it.
- ts-agent-tools re-exports / consumes from ts-common instead of a private duplicate.
