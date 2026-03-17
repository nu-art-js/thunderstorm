---
name: thunderstorm-add-rule
description: >-
  Add or author a new thunderstorm rule. Use when creating a new .mdc rule under
  _thunderstorm/.rules/, adding a lib-level how-to-use, or registering a rule
  in the thunderstorm index.
---
# Adding a Thunderstorm Rule

Thunderstorm rules live under `_thunderstorm/.rules/` (and per-lib under `<lib>/.rules/`). The routing table is `_thunderstorm/.cursor/rules/index.mdc`. Agents discover rules via the index; Cursor only auto-discovers rules under `.cursor/rules/` (the index lives there and points to `.rules/` content).

## Rule file format

Rules are `.mdc` files with YAML frontmatter:

```markdown
---
description: One-line description (used for discovery; be specific)
alwaysApply: false
---
# Title

Body...
```

- **description** — Required. Short summary so the index and agents can match intent. Prefer "When to use" or "What this covers" phrasing.
- **alwaysApply** — Default `false`. Set `true` only for rules that must load every message (e.g. lighthouse veto). Prefer `false` and discovery via index.
- **globs** — Optional. Use only if the rule should apply when specific files are open (e.g. `_thunderstorm/thunderstorm/**/*`).

## Where the rule belongs

### Central rules (`_thunderstorm/.rules/`)

| Group | When to use | Location |
|-------|-------------|----------|
| **operational** | BAI, project structure, package layout, dependencies, how to run things | `.rules/operational/<name>.mdc` |
| **contributing** | Package standard, exports, license, docs, tests, fixtures | `.rules/contributing/<name>.mdc` or `.rules/contributing/tests/<name>.mdc` |
| **consuming** | Patterns for using thunderstorm in app code (e.g. editable-item) | `.rules/consuming/<name>.mdc` |

Do not create new top-level categories; add new files under one of these three.

### Lib-level how-to-use (`<lib>/.rules/how-to-use.mdc`)

Every thunderstorm **lib** that exposes a public API should have a single how-to-use at the **lib root**:

- Path: `_thunderstorm/<lib-name>/.rules/how-to-use.mdc`
- Content: One file per lib. Include a short overview, a "domain matrix" (which packages for which scenario: full-stack / backend-only / frontend-only), then one section per domain (shared, backend, frontend — or client, server). Each section should be readable on its own; do not assume the other end exists.
- Do **not** add per-package how-to-use under `shared/`, `backend/`, `frontend/` — keep one entry point at the lib root.

## Register in the index

After adding or moving a rule, add or update a row in the routing table:

- File: `_thunderstorm/.cursor/rules/index.mdc`
- Sections: **Operational**, **Contributing**, **Consuming**
- Each row: intent phrase ("Want to…") and path (relative to project root), e.g. `_thunderstorm/.rules/operational/bai-cli.mdc` or `_thunderstorm/db-api/.rules/how-to-use.mdc`

Use the same intent phrasing style as existing rows so the table stays scannable.

## Checklist

- [ ] Rule is under `.rules/` (central or `<lib>/.rules/`) with correct group
- [ ] Frontmatter has `description` and `alwaysApply` (and `globs` only if needed)
- [ ] Index has a new or updated row in the right section with a clear "Want to…" and correct path
- [ ] For a new lib: single `how-to-use.mdc` at lib root with overview + domain matrix + per-domain sections
