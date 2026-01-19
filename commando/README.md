# @nu-art/commando

Shell command execution framework with interactive sessions, CLI parameter resolution, and a plugin system for building and executing shell scripts programmatically.

## Overview

`commando` provides two main capabilities:

1. **Shell Command Execution**: Build and execute shell commands with a fluent API, supporting both simple one-shot execution and interactive persistent sessions
2. **CLI Parameter Resolution**: Type-safe parsing and validation of command-line arguments

## Installation

```bash
npm install @nu-art/commando
```

## Quick Start

### Simple Shell Execution

```typescript
import { Commando } from '@nu-art/commando';

const commando = Commando.create();

await commando
  .append('echo "Hello World"')
  .append('ls -la')
  .execute((stdout, stderr, exitCode) => {
    console.log('Output:', stdout);
    console.log('Exit code:', exitCode);
  });
```

### Interactive Shell

```typescript
import { CommandoInteractive } from '@nu-art/commando';

const commando = CommandoInteractive.create();

await commando
  .append('cd /tmp')
  .append('pwd')
  .append('ls')
  .execute((stdout, stderr, exitCode) => {
    console.log('Commands executed in same shell session');
  });

commando.kill(); // Clean up
```

### CLI Parameter Parsing

```typescript
import { CLIParamsResolver } from '@nu-art/commando';

const resolver = CLIParamsResolver.create(
  {
    keys: ['--name', '-n'],
    keyName: 'name',
    type: 'string',
    description: 'Your name',
    defaultValue: 'Anonymous'
  },
  {
    keys: ['--count'],
    keyName: 'count',
    type: 'number',
    description: 'Count',
    defaultValue: 1
  }
);

const params = resolver.resolveParamValue();
// params.name: string, params.count: number
```

### Using Plugins

```typescript
import { CommandoInteractive } from '@nu-art/commando';
import { Commando_Git, Commando_Basic } from '@nu-art/commando';

const commando = CommandoInteractive.create(Commando_Git, Commando_Basic);

await commando
  .git().clone('https://github.com/user/repo.git', { branch: 'main' })
  .cd('repo', (cli) => {
    cli.ls();
    cli.git().status();
  })
  .execute();
```

## Key Features

### Shell Execution

- **Simple Mode**: One-shot command execution via `Commando` and `SimpleShell`
- **Interactive Mode**: Persistent shell sessions via `CommandoInteractive` and `InteractiveShell`
- **Plugin System**: Extend functionality with plugins (Git, NVM, PNPM, Python, etc.)
- **Command Building**: Fluent API with indentation support for readable scripts
- **Error Handling**: Structured error handling with `CliError` and exit codes

### CLI Parameter Resolution

- **Type Safety**: TypeScript-first parameter definitions with type inference
- **Multiple Keys**: Support for aliases (e.g., `['--help', '-h']`)
- **Validation**: Option validation, type checking, required/optional params
- **Dependencies**: Set other params based on current param values
- **Arrays**: Collect multiple values for array parameters
- **Defaults**: Initial values and default values support

### Plugins

- **Commando_Basic**: File system operations (cd, ls, mkdir, rm, echo, etc.)
- **Commando_Programming**: Control flow (if/else, for, while, functions)
- **Commando_Git**: Git operations (clone, checkout, commit, push, etc.)
- **Commando_NVM**: Node Version Manager operations
- **Commando_PNPM**: PNPM package manager operations
- **Commando_Python3**: Python virtual environment operations

## Architecture

### Core Components

- **BaseCommando**: Base class with command building and plugin merging
- **CommandBuilder**: Builds shell commands with indentation
- **SimpleShell**: One-shot command execution
- **InteractiveShell**: Persistent shell session management
- **CLIParamsResolver**: Type-safe CLI argument parsing

### Plugin System

Plugins use class merging to combine multiple classes into one instance. This allows:
- Mixing functionality from multiple plugins
- Type-safe method access
- Flexible composition

## Package Exports

- **Main Export** (`@nu-art/commando`): All core exports
- **Wildcard** (`@nu-art/commando/*`): Direct file access (for backward compatibility)

## Documentation

For detailed API documentation, see the TypeDoc generated documentation.

## License

Apache-2.0

## Author

TacB0sS (Adam van der Kruk)

## Repository

https://github.com/nu-art-js/thunderstorm

