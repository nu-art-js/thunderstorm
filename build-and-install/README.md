# @nu-art/build-and-install

A build system for monorepos that orchestrates building, testing, and deploying units with dependency-aware phase execution.

## Overview

Build-and-install is a sophisticated build orchestration system designed for TypeScript monorepos. It discovers units (packages/apps) in your workspace, resolves their dependencies, and executes phases (prepare, compile, test, deploy, etc.) in the correct order.

## Key Features

- **Unit Discovery**: Automatically scans workspace and discovers units (NodeLib, NodeProject, Firebase, etc.)
- **Dependency Resolution**: Builds dependency tree and executes units in correct order
- **Phase Execution**: Runs phases (prepare, compile, test, lint, deploy) with parallel execution where possible
- **Resume Support**: Can resume from last completed step with `--continue` flag
- **Selective Execution**: Work on specific units with `--use-package` flag
- **Dry Run**: Preview execution plan without running phases

## Quick Start

```typescript
import {BuildAndInstall} from '@nu-art/build-and-install';

const bai = new BuildAndInstall();
await bai.build();  // Discover units, resolve dependencies
await bai.run();    // Execute phases
```

## Core Concepts

### Units

Units are discovered packages/projects in your workspace:
- **BaseUnit**: Generic unit base class
- **ProjectUnit**: Units with file paths and dependencies
- **Unit Types**: NodeProject, NodeLib, FirebaseHosting, FirebaseFunction, etc.

### Phases

Phases are execution steps that units can implement:
- **Prepare**: Setup and preparation
- **Compile**: Build TypeScript/JavaScript
- **Test**: Run tests
- **Lint**: Lint code
- **Deploy**: Deploy to production
- **Terminating**: Cleanup operations

### Workspace

The `Workspace` class manages all units:
- **Scanned Units**: All units discovered from file system
- **Active Units**: Units selected for execution
- **Project Units**: Active units + their transitive dependencies

### Phase Manager

The `PhaseManager` orchestrates phase execution:
- Calculates execution plan (which phases run on which units)
- Executes phases in dependency order
- Handles errors and aggregates exceptions
- Supports graceful shutdown (SIGINT)

## CLI Parameters

Common runtime parameters (see `AllBaiParams` for complete list):

- `--use-package <pattern>`: Work on specific units (regex pattern)
- `--build-tree`: Include transitive dependencies in active units
- `--continue`: Resume from last completed step
- `--dry-run`: Log execution plan without running
- `--install`: Run `pnpm install` on all units
- `--clean`: Delete output folders
- `--purge`: Delete node_modules and clean
- `--debug`: Enable debug logging
- `--verbose`: Enable verbose logging

## Architecture

### Build Process

1. **Initialization**: Set up logging, CLI params, workspace
2. **Discovery**: Scan workspace for units using UnitsMapper
3. **Dependency Resolution**: Build dependency tree
4. **Unit Selection**: Derive active/project units based on runtime params
5. **Context Setup**: Provide runtime context to all units
6. **Execution Planning**: Calculate which phases run on which units
7. **Phase Execution**: Execute phases in dependency order

### Execution Model

- **Phase Groups**: Phases that can run in parallel
- **Unit Layers**: Units grouped by dependency level (dependencies first)
- **Steps**: Combinations of phase groups × unit layers
- **Parallel Execution**: Units in same layer run phases in parallel

## Unit Types

### NodeProject

Root project unit (monorepo root). Discovers child units and manages workspace.

### NodeLib

TypeScript library unit. Implements compile, test, lint phases.

### FirebaseHosting

Firebase hosting app unit. Implements deploy phase.

### FirebaseFunction

Firebase function unit. Implements deploy phase.

## Extension Points

### Custom Units

Extend `ProjectUnit` or `BaseUnit` to create custom unit types:

```typescript
export class MyCustomUnit extends ProjectUnit<MyConfig> {
  async compile() {
    // Custom compile logic
  }
}
```

### Custom Phases

Add custom phases to phase groups:

```typescript
const customPhase: Phase = {
  key: 'my-phase',
  name: 'My Phase',
  method: 'myPhase',
  unitCategory: 'active'
};

bai.setPhases([...DefaultPhases, [[customPhase]]]);
```

### Custom Unit Mappers

Create custom unit discovery rules:

```typescript
export class MyUnitMapper extends UnitMapper_Base<MyUnit> {
  async resolveUnit(path: string, projectRoot: string): Promise<MyUnit | undefined> {
    // Custom discovery logic
  }
}

bai.prepareUnitsMapper(mapper => {
  mapper.addRules(MyUnitMapper);
});
```

## Configuration

### BAI Config

Create `bai-config.json` in project root:

```json
{
  "units": [],
  "phases": []
}
```

### Version File

Create `version-app.json` in project root:

```json
{
  "version": "1.0.0"
}
```

## Error Handling

- **UnitPhaseException**: Thrown when a phase fails on a unit
- **PhaseAggregatedException**: Aggregates multiple phase errors
- **BadImplementationException**: Thrown for configuration errors

## State Persistence

Execution state is saved to `.trash/output/running-status.json`:
- Current step index
- Completed units
- Runtime parameters

Use `--continue` to resume from saved state.

## License

Apache-2.0

