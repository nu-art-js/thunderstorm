# @nu-art/idb-shared

Shared types and definitions for IndexedDB infrastructure.

## Overview

This package provides shared TypeScript types and definitions for IndexedDB operations. These types can be used across frontend and backend codebases for type safety and consistency.

**Note**: This package contains only type definitions. For the actual IndexedDB implementation, use `@nu-art/idb-frontend`.

## Installation

```bash
npm install @nu-art/idb-shared
```

## Dependencies

- `@nu-art/ts-common` - Core types and utilities

## Usage

```typescript
import { DBConfig, IndexDb_Query, ReduceFunction } from '@nu-art/idb-shared';
import { DBProto } from '@nu-art/ts-common';

// Use types in your shared code
type MyProto = DBProto<{...}>;
const config: DBConfig<MyProto> = {...};
const query: IndexDb_Query = {...};
```

## Exported Types

- `DBConfig<Proto>` - Configuration for an IndexedDB store
- `IndexDb_Query` - Query parameters for IndexedDB operations
- `ReduceFunction<ItemType, ReturnType>` - Reducer function type for query operations

## License

Apache-2.0

## Author

TacB0sS (Adam van der Kruk)
