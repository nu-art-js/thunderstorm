# @nu-art/ts-common

Core TypeScript infrastructure library for building modular applications with lifecycle management, logging, validation, and comprehensive utilities.

## Overview

`ts-common` provides the foundational building blocks for TypeScript applications in the nu-art ecosystem. It includes:

- **Module System**: Lifecycle management for application components
- **Logging**: Flexible logging infrastructure with multiple output targets
- **Validation**: Type-safe validation system with extensible validators
- **Utilities**: Comprehensive collection of utility functions
- **Database Types**: Type definitions and utilities for database operations
- **Testing**: Testing utilities and helpers

## Installation

```bash
npm install @nu-art/ts-common
```

## Quick Start

### Basic Module Usage

```typescript
import { Module, ModuleManager } from '@nu-art/ts-common';

class MyModule_Class extends Module<{ apiKey: string }> {
  protected init() {
    super.init();
    // Initialize your module
  }
}

const MyModule = new MyModule_Class();

class MyApp extends ModuleManager {
  constructor() {
    super();
    this.addModulePack([MyModule]);
    this.setConfig({
      MyModule: { apiKey: 'your-api-key' }
    });
  }
}

const app = new MyApp();
app.init();
```

### Logging

```typescript
import { Logger, LogClient_Terminal, BeLogged } from '@nu-art/ts-common';

class MyService extends Logger {
  doSomething() {
    this.logInfo('Processing...');
    this.logError('Something went wrong');
  }
}

// Add log clients
BeLogged.addClient(LogClient_Terminal);
```

### Validation

```typescript
import { ValidatorTypeResolver, tsValidateString } from '@nu-art/ts-common';

const validator = new ValidatorTypeResolver({
  name: tsValidateString,
  age: (value: any) => typeof value === 'number' && value > 0
});

const result = validator.validate({ name: 'John', age: 30 });
```

## Key Features

### Module System
- **Lifecycle Management**: Automatic initialization and validation sequence
- **Configuration Injection**: Type-safe configuration management
- **Module Discovery**: Automatic module registration and resolution
- **Dependency Management**: Built-in dependency resolution

### Logging
- **Multiple Output Targets**: Terminal, browser, file, memory buffer, and custom clients
- **Log Levels**: Verbose, Debug, Info, Warning, Error
- **Debug Flags**: Conditional logging based on feature flags
- **Log Rotation**: Automatic rotation for file and memory buffers

### Validation
- **Type-Safe Validators**: TypeScript-first validation system
- **Extensible**: Create custom validators easily
- **Comprehensive Types**: Validators for strings, numbers, arrays, objects, enums, and more
- **Integration**: Seamless integration with Module configuration

### Utilities
- **Array Tools**: Advanced array manipulation and filtering
- **Object Tools**: Deep cloning, merging, and comparison
- **String Tools**: String manipulation and formatting
- **Date/Time Tools**: Timeout management and date utilities
- **Crypto Tools**: Password hashing, JWT encoding/decoding
- **Promise Tools**: Concurrency control and promise utilities
- **File System**: Async file and folder operations
- **And More**: Queue management, debouncing, version comparison, URL manipulation, etc.

## Package Exports

The package provides logical export points:

- **Main Export** (`@nu-art/ts-common`): All core exports
- **Core** (`@nu-art/ts-common/core`): Module system, logging, exceptions
- **Utils** (`@nu-art/ts-common/utils`): Utility functions
- **Validator** (`@nu-art/ts-common/validator`): Validation system
- **DB** (`@nu-art/ts-common/db`): Database types and utilities
- **Modules** (`@nu-art/ts-common/modules`): Reusable module implementations
- **Testing** (`@nu-art/testalot`): Testing utilities

## Documentation

For detailed API documentation, see the TypeDoc generated documentation.

## License

Apache-2.0

## Author

TacB0sS (Adam van der Kruk)

## Repository

https://github.com/nu-art-js/ts-common
