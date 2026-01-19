# Issues Found During Documentation

This file tracks potential bugs, broken logic, architectural concerns, or areas for improvement discovered while documenting the commando package.

## Package Structure

### Multiple Contexts

**Issue**: This package contains multiple distinct contexts that could be separate packages.

**Details**: 
- **Context 1: CLI Parameter Resolution** - Located in `src/main/cli-params/`
  - Purpose: Parses and resolves command-line arguments with type safety
  - Main export: `CLIParamsResolver` class
  - Dependencies: Only depends on `@nu-art/ts-common` for utilities
  - Use case: Standalone CLI argument parsing for any Node.js application

- **Context 2: Shell Command Execution** - Located in `src/main/shell/`
  - Purpose: Executes shell commands with interactive and simple modes, plugin system
  - Main exports: `Commando`, `CommandoInteractive`, `BaseCommando`, plugins, services
  - Dependencies: Only depends on `@nu-art/ts-common` for utilities
  - Use case: Building shell scripts programmatically, executing commands

**Rationale**: 
- These two contexts have minimal coupling - CLI params can be used without shell execution, and shell execution doesn't require CLI params
- Different use cases: CLI params is for parsing arguments, shell execution is for running commands
- Could be independently versioned and maintained
- Different consumers might only need one or the other

**Recommendation**: Consider splitting into:
- `@nu-art/cli-params` - CLI parameter resolution and parsing
- `@nu-art/commando` - Shell command execution framework

This would improve modularity, allow independent versioning, and reduce bundle size for consumers who only need one feature.
