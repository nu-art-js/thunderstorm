# @nu-art/build-and-install

A **graph-driven build and execution engine** for large TypeScript monorepos.

Build-and-install (BAI) discovers executable units from the filesystem, builds a dependency graph between them, and executes lifecycle phases in a deterministic, dependency-aware order.

It replaces ad-hoc scripts and linear pipelines with a **single, consistent execution model** for build, test, deploy, and publish workflows.

---

## What BAI is (and isn’t)

**BAI is:**
- a dependency-graph–based execution engine
- phase-oriented, not script-oriented
- deterministic and resumable
- parallel where safe, ordered where required

**BAI is not:**
- a simple build script
- a task runner
- a fixed pipeline definition

Execution behavior is always *derived*, never hard-coded.

---

## Core model

BAI operates on four primitives:

```
Units + Dependencies + Phases + Runtime Intent
```

Everything else is an implementation detail.

---

## Mental model

```
Filesystem
   ↓
Unit discovery
   ↓
Dependency graph
   ↓
Active / project unit selection
   ↓
Phase filtering
   ↓
Execution plan
   ↓
Parallel, dependency-safe execution
```

---

## Units

A **unit** is an executable node discovered from the workspace.

Examples include:
- Node libraries
- Applications
- Firebase hosting projects
- Firebase functions

Units:
- are discovered automatically
- declare dependencies on other units
- may implement lifecycle methods (e.g. `prepare`, `compile`, `test`, `lint`, `deploy`, `publish`)

A unit participates in a phase **only if it implements the phase method**.

---

## Dependency graph

BAI builds a directed dependency graph between all discovered units.

This graph is the single source of truth used to:
- compute transitive dependencies
- derive execution layers
- enforce safe execution order
- enable parallelism without race conditions

---

## Active vs project units

At runtime, units are divided into:

- **Project units**  
  The full dependency closure of the workspace.

- **Active units**  
  Units explicitly targeted by the current run.

Some phases operate only on active units, while others require the full project set.

This distinction enables fast, targeted execution without sacrificing correctness.

---

## Phases

A **phase** is a declarative lifecycle step.

Each phase defines:
- a unique key
- a method name units must implement
- optional runtime filters
- optional dependencies on other phases
- the unit category it applies to (`active` or `project`)

Phases are grouped:
- phase groups run sequentially
- phases within a group run in parallel
- units within a phase run in dependency order

---

## Workspace & execution engine

The workspace manages all discovered units and their relationships:
- **Scanned units**: all units discovered from the filesystem
- **Active units**: execution targets derived from runtime intent
- **Project units**: active units plus their transitive dependencies

The execution engine:
- calculates an execution plan from phases × dependency layers
- executes units in a dependency-safe order
- supports graceful interruption and resumption

---

## CLI-driven execution

The CLI expresses **intent**, not execution logic.

Common capabilities include:
- selecting specific units (`--use-package`, `--application`)
- including dependency trees (`--build-tree`)
- resuming failed runs (`--continue`)
- simulating execution (`--dry-run`)
- cleaning or purging outputs
- enabling debug or verbose logging

Execution behavior is always derived from:

```
Units + Dependencies + Phases + Runtime Parameters
```

---

## Embedding (advanced)

BAI can also be embedded programmatically:

```ts
import { BuildAndInstall } from '@nu-art/build-and-install';

const bai = new BuildAndInstall();
await bai.build();
await bai.run();
```

This is intended for advanced orchestration or tooling scenarios.

---

## Extensibility

BAI is designed to be extended via:
- custom unit types
- custom phases
- custom unit discovery rules

Extensions integrate naturally into the dependency graph and execution model.

---

## State & recovery

Execution state is persisted to allow safe recovery after failures or interruptions.

Using `--continue`, BAI can resume execution from the last completed step without re-running successful work.

---

## When to use BAI

- Large monorepos
- Multi-package dependency graphs
- Unified build / test / deploy workflows
- Deterministic and resumable execution

## When not to use BAI

- Single-package projects
- Linear, one-off scripts
- Projects without meaningful dependencies

---

## License

Apache-2.0
