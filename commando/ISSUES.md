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

## File: `src/main/shell/core/CliError.ts`

### Symbol: `CommandoException` constructor

**Issue**: The constructor incorrectly passes `CliError` as the exception type instead of `CommandoException`.

**Details**: Line 28 calls `super(CliError, message)` but should be `super(CommandoException, message)`. This causes the exception type checking to be incorrect.

## File: `src/main/cli-params/consts.ts`

### Symbol: `DefaultProcessor_Boolean`

**Issue**: The boolean processor always returns `true` regardless of input, which is incorrect behavior.

**Details**: The processor should return `true` if the flag is present, `false` if absent, or use the defaultValue. Currently it ignores both input and defaultValue and always returns `true`, making boolean flags always true.

## File: `src/main/shell/core/BaseCommando.ts`

### Symbol: `builder` field

**Issue**: The `builder` field is marked `readonly` but is actually modified via `@ts-ignore` in `_create()`.

**Details**: Line 19 uses `@ts-ignore` to set the readonly field. This is a type safety issue. Consider making it non-readonly or using a different initialization pattern.

## File: `src/main/shell/plugins/git.ts`

### Symbol: `git_resetHard()` method

**Issue**: Uses single quotes instead of template literal, so `${tag}` won't be interpolated.

**Details**: Line 132 uses `'git reset --hard ${tag}'` but should use backticks: `` `git reset --hard ${tag}` ``. The variable won't be substituted with single quotes.

### Symbol: `git_getCurrentBranch()` method

**Issue**: Incomplete sed command - missing the replacement pattern.

**Details**: Line 136 has `sed -E "s` which is incomplete. The sed command is missing the pattern and replacement parts. This will cause a syntax error when executed.

### Symbol: `git_pull()` method

**Issue**: Uses single quotes instead of template literal, so `${params}` won't be interpolated.

**Details**: Line 140 uses `'git pull ${params}'` but should use backticks: `` `git pull ${params}` ``.

### Symbol: `git_createBranch()` method

**Issue**: Multiple syntax errors in the command.

**Details**: 
- Line 148: `git checkout - b` has space before `b` (should be `-b`)
- Line 149: `git push-- set` missing space (should be `git push --set`)

### Symbol: `git_gsui()` method

**Issue**: Uses single quotes instead of template literal, so `${modules}` won't be interpolated.

**Details**: Line 153 uses `'git submodule update --recursive --init ${modules}'` but should use backticks: `` `git submodule update --recursive --init ${modules}` ``.

## File: `src/main/shell/services/nvm.ts`

### Symbol: `uninstall()` method

**Issue**: Log message incorrectly says "Uninstalling PNPM" instead of "Uninstalling NVM".

**Details**: Line 101 has a copy-paste error - the log message is from the PNPM service. Should say "Uninstalling NVM".

### Symbol: `install()` method

**Issue**: Uses `echo` commands in RC file configuration instead of directly writing export statements.

**Details**: Lines 69-71 use `echo` commands to write to .bashrc, which is unusual. Typically you'd write the export statements directly. This might be intentional but seems like an odd pattern.

