# Thunderstorm

Thunderstorm is a TypeScript ESM monorepo framework. Rules are organized into three groups: operational, contributing, and consuming.

**Start here:** [`.cursor/rules/index.mdc`](.cursor/rules/index.mdc) — routing table to all rules.
Read [`.rules/vocabulary.mdc`](.rules/vocabulary.mdc) first for the core mental model.

## Non-negotiable principles

- **API / server or client:** Use the **http** lib patterns (`ApiDef`, decorators). See index → Consuming.
- **DB / CRUD entities:** Use the **db-api** lib patterns. See index → Consuming.

## Veto

If an action violates these principles, stop and prompt the user for confirmation before proceeding.
