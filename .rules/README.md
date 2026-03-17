# Thunderstorm rules

This directory holds the organized rule set for Thunderstorm: operational, contributing, and consuming rules, plus vocabulary and a routing index.

## Layout

- **`vocabulary.mdc`** — Core mental model (packages, libs, BAI, naming). Read this first.
- **`operational/`** — How to operate in a thunderstorm project: BAI, project structure, package layout, dependencies.
- **`contributing/`** — How to work ON thunderstorm packages: package standard, exports, license, docs, tests.
- **`consuming/`** — How to work WITH thunderstorm in application code: patterns like EditableItem.
- **`SKILL.md`** — Meta-skill: how to add a new rule and register it in the index.

Per-lib how-to-use rules live next to each lib, e.g.:

- `_thunderstorm/db-api/.rules/how-to-use.mdc`
- `_thunderstorm/http/.rules/how-to-use.mdc`

## Discovery

Cursor only auto-discovers rules under `.cursor/rules/`. The **routing index** lives at:

**`_thunderstorm/.cursor/rules/index.mdc`**

It is the single Cursor-discoverable entry and points to all rules under `.rules/` and to lib-level how-to-use files. Agents and users should open the index to find the right rule by intent (Operational / Contributing / Consuming).

## Adding a new rule

1. Add the `.mdc` file under the correct group (`operational/`, `contributing/`, or `consuming/`) or under `<lib>/.rules/how-to-use.mdc` for a lib.
2. Use the frontmatter format described in `SKILL.md` (description, alwaysApply, optional globs).
3. Add or update a row in `_thunderstorm/.cursor/rules/index.mdc` in the appropriate section.

See **`SKILL.md`** in this directory for the full process and conventions.
