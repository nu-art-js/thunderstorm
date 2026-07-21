# 2026-07-21 17:17 — registerTool casts into heterogeneous tools map
- **Author:** tacb0ss
- **Packages touched:** ts-agents/tools/backend
- **Concepts / docs:** TS_AgentTool registry erasure

## Why

`ModuleBE_AgentTools` stores every tool in one `Record<string, TS_AgentTool<any, any>>`. Callers register concrete `TS_AgentTool<T, V>` values; assigning those into the erased map is not type-correct without an explicit boundary cast. After the shared `JSON_Schema` promotion (stricter tool typing), that assignment needed to be stated at the registry edge — not by weakening caller generics or inventing a second map type.

## What changed

- `registerTool` — drop redundant `V extends any`; assign with `tool as TS_AgentTool<any, any>` into the internal map.
