# @nu-art/cli-params

Type-safe CLI parameter resolver and parser for command-line applications. Parses `process.argv` into typed objects with validation, type conversion, defaults, and dependencies.

## Overview

`cli-params` provides a type-safe way to parse and validate command-line arguments in Node.js applications. It converts raw `process.argv` input into strongly-typed objects based on parameter definitions, with support for aliases, validation, defaults, and complex dependencies.

## Installation

Add the package as a dependency in your `__package.json`:

```json
{
  "dependencies": {
    "@nu-art/cli-params": "?"
  }
}
```

## Quick Start

### Basic Usage

```typescript
import { CLIParamsResolver } from '@nu-art/cli-params';

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

### With Validation

```typescript
const resolver = CLIParamsResolver.create(
  {
    keys: ['--env'],
    keyName: 'env',
    type: 'string',
    description: 'Environment',
    options: ['dev', 'staging', 'prod'] // Only allow these values
  }
);

const params = resolver.resolveParamValue(['--env=dev']); // ✅ Valid
// const params = resolver.resolveParamValue(['--env=invalid']); // ❌ Throws error
```

### Array Parameters

```typescript
const resolver = CLIParamsResolver.create(
  {
    keys: ['--file', '-f'],
    keyName: 'files',
    type: 'string[]',
    description: 'Files to process',
    isArray: true
  }
);

const params = resolver.resolveParamValue(['--file=a.txt', '--file=b.txt']);
// params.files: ['a.txt', 'b.txt']
```

### Dependencies

```typescript
const resolver = CLIParamsResolver.create(
  {
    keys: ['--verbose'],
    keyName: 'verbose',
    type: 'boolean',
    description: 'Enable verbose logging'
  },
  {
    keys: ['--log-level'],
    keyName: 'logLevel',
    type: 'string',
    description: 'Log level',
    dependencies: [
      {
        param: {
          keys: ['--verbose'],
          keyName: 'verbose',
          type: 'boolean',
          description: 'Verbose'
        },
        value: (currentValue) => currentValue === 'debug' ? true : false
      }
    ]
  }
);
```

## Key Features

### Type Safety
- TypeScript-first design with full type inference
- Compile-time type checking for parameter definitions
- Type-safe resolved parameter objects

### Parameter Definition
- **Multiple Keys/Aliases**: Support for multiple CLI flags (e.g., `['--help', '-h']`)
- **Type Validation**: Built-in support for `string`, `number`, `boolean`, and arrays
- **Options Validation**: Restrict parameter values to specific options
- **Default Values**: Initial values and default values support
- **Array Support**: Collect multiple values for array parameters
- **Dependencies**: Set other params based on current param values

### Processing
- **Quoted Strings**: Automatic handling of quoted string values
- **Type Conversion**: Automatic conversion from string to number/boolean
- **Error Handling**: Clear error messages for validation failures

## API Overview

### CLIParamsResolver

Main class for resolving CLI parameters.

**Methods:**
- `static create<T>(...params: T)`: Creates a new resolver instance
- `resolveParamValue(inputParams?)`: Resolves parameters from input array (defaults to `process.argv.slice(2)`)

### BaseCliParam

Type definition for parameter configuration.

**Required Fields:**
- `keys`: Array of CLI keys/aliases
- `keyName`: Unique key name for resolved object
- `type`: Type string representation
- `description`: Human-readable description

**Optional Fields:**
- `name`: Optional parameter name (defaults to keyName)
- `options`: Array of allowed values (validates input)
- `initialValue`: Initial value if param not provided
- `defaultValue`: Default value if param provided but empty
- `process`: Custom processor function (defaults by type)
- `isArray`: Whether this param accepts multiple values
- `group`: Optional grouping for help/validation
- `dependencies`: Parameters that depend on this one

## Examples

### Simple CLI Tool

```typescript
import { CLIParamsResolver } from '@nu-art/cli-params';

const resolver = CLIParamsResolver.create(
  {
    keys: ['--input', '-i'],
    keyName: 'input',
    type: 'string',
    description: 'Input file path',
    defaultValue: 'input.txt'
  },
  {
    keys: ['--output', '-o'],
    keyName: 'output',
    type: 'string',
    description: 'Output file path'
  },
  {
    keys: ['--verbose', '-v'],
    keyName: 'verbose',
    type: 'boolean',
    description: 'Enable verbose output'
  }
);

const params = resolver.resolveParamValue();
console.log(`Processing ${params.input} -> ${params.output}`);
```

### Complex Validation

```typescript
const resolver = CLIParamsResolver.create(
  {
    keys: ['--mode'],
    keyName: 'mode',
    type: 'string',
    description: 'Operation mode',
    options: ['read', 'write', 'delete'],
    defaultValue: 'read'
  },
  {
    keys: ['--files'],
    keyName: 'files',
    type: 'string[]',
    description: 'Files to process',
    isArray: true
  }
);
```

## Package Exports

- **Main Export** (`@nu-art/cli-params`): All exports including `CLIParamsResolver`, types, and constants

## License

Apache-2.0

## Author

TacB0sS (Adam van der Kruk)

## Repository

https://github.com/nu-art-js/thunderstorm
