# @nu-art/logger

Flexible logging infrastructure with multiple output targets, debug flags, and log rotation support. This package provides a comprehensive logging system that allows you to route log messages to multiple destinations simultaneously (console, file, browser, memory buffers, etc.) with fine-grained control over log levels and filtering.

## Installation and Usage

Add the package as a dependency in your `__package.json`:

```json
{
  "dependencies": {
    "@nu-art/logger": "?"
  }
}
```

### Entry points

- **`@nu-art/logger`** (default) – Shared API: works in Node and browser. Exposes `Logger`, `BeLogged`, `LogClient_Terminal`, `LogClient_MemBuffer`, `LogClient_Function`, `LogClient_ConsoleProxy`, `LogClient_BaseRotate`, types, debug-flags, utils.
- **`@nu-art/logger/node`** – Default API plus Node-only clients (e.g. `LogClient_File`). Use in backend/Node apps.
- **`@nu-art/logger/browser`** – Default API plus browser-only clients (`LogClient_Browser`, `LogClient_BrowserGroups`). Use in frontend apps that need styled/grouped console output.

Import and use the logger in your code:

```typescript
import {Logger, BeLogged, LogClient_Terminal} from '@nu-art/logger';

// Create a logger instance
class MyService extends Logger {
  constructor() {
    super('MyService');
  }

  doSomething() {
    this.logInfo('Processing started');
    this.logDebug('Debug details');
    this.logError('Error occurred', error);
  }
}

// Add a log client to output to terminal
const terminalClient = new LogClient_Terminal();
BeLogged.addClient(terminalClient);
```

## Key Features

### Core Components

- **`Logger`** - Base logging class that provides structured logging with debug flag integration. Extend this class to create loggers for your services.
- **`BeLogged`** - Central logging manager singleton that distributes log messages to all registered log clients.
- **`LogClient`** - Base class for all log output destinations. Implement this to create custom log clients.

### Log Clients

Multiple built-in log clients for different output destinations:

- **`LogClient_Terminal`** - Outputs logs to terminal/console with ANSI color formatting (default entry)
- **`LogClient_Browser`** - Outputs logs to browser console with CSS styling (`@nu-art/logger/browser`)
- **`LogClient_BrowserGroups`** - Browser console with automatic grouping by log level (`@nu-art/logger/browser`)
- **`LogClient_File`** - Writes logs to files on disk (`@nu-art/logger/node` only)
- **`LogClient_MemBuffer`** - Stores logs in memory buffers (useful for testing) (default entry)
- **`LogClient_Function`** - Routes logs to a custom function callback
- **`LogClient_ConsoleProxy`** - Proxies logs to native console methods
- **`LogClient_BaseRotate`** - Base class for log rotation support

### Debug Flags

- **`DebugFlag`** - Controls logging per logger tag with enable/disable and minimum log level filtering
- **`DebugFlags`** - Singleton manager for all debug flags, allows enabling/disabling flags by name

### Utilities

- **`getLogStyle()`** - Generates CSS style strings for console.log() formatting
- **`LogLevel`** - Enum for log levels: Verbose, Debug, Info, Warning, Error
- **`LogPrefixComposer`** - Type for custom log prefix formatters

## API Overview

### Logger Class

The main logging class that you extend to create loggers:

```typescript
class Logger {
  readonly tag: string;
  constructor(tag?: string);
  setMinLevel(minLevel: LogLevel): void;
  logVerbose(...toLog: LogParam[]): void;
  logDebug(...toLog: LogParam[]): void;
  logInfo(...toLog: LogParam[]): void;
  logWarning(...toLog: LogParam[]): void;
  logError(...toLog: LogParam[]): void;
  // ... bold variants for each level
}
```

### BeLogged Singleton

Central dispatcher for all log messages:

```typescript
const BeLogged = {
  addClient(client: LogClient): void;
  removeClient(client: LogClient): void;
  removeAllClients(): void;
  log(tag: string, level: LogLevel, bold: boolean, ...toLog: LogParam[]): void;
}
```

### DebugFlags

Manager for debug flags that control logging:

```typescript
const DebugFlags = {
  createFlag(key: string, minLogLevel?: LogLevel): DebugFlag;
  getFlag(key: string): DebugFlag | undefined;
  enable(key: string): void;
  disable(key: string): void;
  setMinLevel(key: string, level: LogLevel): void;
}
```

## Examples

### Basic Logger Usage

```typescript
import {Logger} from '@nu-art/logger';

class UserService extends Logger {
  constructor() {
    super('UserService');
  }

  async createUser(userData: any) {
    this.logInfo('Creating user', userData);
    try {
      // ... create user logic
      this.logInfo('User created successfully');
    } catch (error) {
      this.logError('Failed to create user', error);
      throw error;
    }
  }
}
```

### Multiple Log Clients

```typescript
import {BeLogged, LogClient_Terminal, LogClient_File} from '@nu-art/logger/node';

// Add terminal output
const terminal = new LogClient_Terminal();
BeLogged.addClient(terminal);

// Add file output (Node only)
const fileClient = new LogClient_File('app', '/var/log/app', 10, 1024);
BeLogged.addClient(fileClient);

// Now all logs go to both terminal and file
```

### Debug Flag Control

```typescript
import {DebugFlags, LogLevel} from '@nu-art/logger';

// Enable logging for a specific tag
DebugFlags.enable('MyService');

// Set minimum log level
DebugFlags.setMinLevel('MyService', LogLevel.Warning);

// Disable logging for a tag
DebugFlags.disable('MyService');
```

### Memory Buffer for Testing

```typescript
import {BeLogged, LogClient_MemBuffer} from '@nu-art/logger';

const buffer = new LogClient_MemBuffer('test');
BeLogged.addClient(buffer);

// ... perform operations that log

// Check captured logs
const logs = buffer.buffers[0];
console.log('Captured logs:', logs);
```

### Custom Log Client

```typescript
import {LogClient, LogLevel, LogParam} from '@nu-art/logger';

class CustomLogClient extends LogClient {
  init() {
    // Initialize your client
  }

  log(tag: string, level: LogLevel, bold: boolean, ...toLog: LogParam[]) {
    // Custom logging logic
    // e.g., send to remote service, write to database, etc.
  }

  stop() {
    // Cleanup
  }
}

const customClient = new CustomLogClient();
BeLogged.addClient(customClient);
```

### Static Logger (No Instance)

```typescript
import {StaticLogger} from '@nu-art/logger';

// Use static methods without creating an instance
StaticLogger.logInfo('MyTag', 'This is an info message');
StaticLogger.logError('MyTag', 'Error occurred', error);
```
