# @nu-art/idb-frontend

IndexedDB infrastructure for frontend applications.

## Overview

This package provides a complete IndexedDB infrastructure implementation for browser-based applications. It offers a high-level API for managing IndexedDB databases, stores, and data operations.

**Note**: This implementation is based on the V4 architecture from the thunderstorm framework, providing database grouping, version management, and store registration features.

## Features

- **Database Management**: Group multiple stores into databases with automatic version control
- **Store Operations**: Full CRUD operations with query, filter, and reduce capabilities
- **Version Control**: Automatic database versioning based on store schema changes
- **Type Safety**: Full TypeScript support with generic types
- **Storage Utilities**: Helper functions for cleaning and managing IndexedDB storage

## Installation

```bash
npm install @nu-art/idb-frontend
```

## Dependencies

- `@nu-art/idb-shared` - Shared types and definitions
- `@nu-art/ts-common` - Core types and utilities

## Usage

### Basic Setup

```typescript
import { IDBManager, DBConfig } from '@nu-art/idb-frontend';
import { DBProto } from '@nu-art/ts-common';

// Define your data type
type MyData = {
  _id: string;
  name: string;
  value: number;
};

// Define your database prototype
type MyProto = DBProto<{
  type: MyData;
  dbKey: 'my-db-key';
  generatedKeys: '_id';
  versions: { current: '1.0.0' };
  uniqueKeys: '_id';
}>;

// Configure your store
const dbConfig: DBConfig<MyProto> = {
  name: 'my-store',
  group: 'my-database-group',
  version: '1.0.0',
  autoIncrement: false,
  uniqueKeys: ['_id'],
  indices: [
    {
      id: 'name-index',
      keys: 'name',
      params: { unique: false }
    }
  ]
};

// Register the store
const store = IDBManager.register<MyProto>(dbConfig, async () => {
  console.log('Database opened');
});
```

### Data Operations

```typescript
// Insert data
await store.insert({ _id: '1', name: 'Item 1', value: 100 });

// Upsert data
await store.upsert({ _id: '1', name: 'Item 1 Updated', value: 200 });

// Get by primary key (default store access)
const item = await store.get({ _id: '1' });

// Get all, then filter/map in-memory or use an index
const all = await store.getAll();
const limited = all.slice(0, 10);
const filtered = all.filter(item => item.value > 50);

// Or query via typed index (preferred when querying by a key)
const byCategory = store.createIndex('by-category', 'category');
const itemsInCategory = await byCategory.getAll('electronics');

// Delete
await store.delete({ _id: '1' });
```

### Utilities

```typescript
import { cleanIDBStorage, indexedDBAsyncCheckLog } from '@nu-art/idb-frontend';

// Check IndexedDB async behavior (for debugging)
indexedDBAsyncCheckLog();

// Clean all IndexedDB databases
await cleanIDBStorage();
```

## Architecture

This package implements the V4 architecture which includes:

- **Database Grouping**: Multiple stores can be grouped into a single database
- **Automatic Versioning**: Database versions are automatically incremented when store schemas change
- **Store Registration**: Stores are registered before database opening, allowing for proper schema initialization
- **Version Hash**: A hash of store configurations is used to detect schema changes

## API Reference

### IDBManager

Main manager singleton for registering stores and managing databases.

- `register<Proto>(config: DBConfig<Proto>, onDBOpenCallback?: AsyncVoidFunction): IndexedDB_Store<Proto>`

### IndexedDB_Store

Store-level operations for data manipulation.

- `insert(value): Promise<Proto['dbType']>`
- `upsert(value): Promise<Proto['dbType']>`
- `get(key): Promise<Proto['dbType'] | undefined>`
- `query(query): Promise<Proto['dbType'][] | undefined>`
- `queryFilter(filter, query?): Promise<Proto['dbType'][]>`
- `queryFind(filter): Promise<Proto['dbType'] | undefined>`
- `queryReduce(reducer, initialValue, filter?, query?): Promise<ReturnType>`
- `delete(key): Promise<Proto['dbType']>`
- `clearStore(): Promise<void>`

### IndexedDB_Database

Database-level operations (typically accessed through IDBManager).

- `open(): Promise<void>`
- `clearDB(): Promise<void>`
- `registerStore(config, onDBOpenCallback?): void`

## License

Apache-2.0

## Author

TacB0sS (Adam van der Kruk)
