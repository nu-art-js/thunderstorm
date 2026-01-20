# IDB Decoupling from DBProto - Analysis

## Current Dependencies

### What IDB Currently Uses from DBProto

**From `@nu-art/ts-common`:**
- `DBProto<any>` - Used as generic constraint
- `Proto['dbType']` - **ONLY property actually accessed**
- `DBIndex<T>` - Used for index definitions (separate from DBProto)
- `IndexKeys<T, K>` - Utility type for key lookups (works on any object, not DBProto-specific)

**From `@nu-art/idb-shared`:**
- `DBConfig<Proto>` - Configuration type that constrains `Proto extends DBProto<any>`

### What IDB Actually Needs

1. **A type that represents the stored object** - Currently `Proto['dbType']`
2. **Unique keys** - Already provided in `DBConfig.uniqueKeys` (not from DBProto)
3. **Index definitions** - Already provided in `DBConfig.indices` (uses `DBIndex<T>`, not DBProto-specific)

## Key Finding

**IDB only accesses `Proto['dbType']` - nothing else from DBProto!**

All other DBProto properties are unused:
- ❌ `uiType` - Not used
- ❌ `preDbType` - Not used
- ❌ `dbKey` - Not used
- ❌ `generatedPropsValidator` - Not used
- ❌ `modifiablePropsValidator` - Not used
- ❌ `uniqueKeys` - Not used (comes from DBConfig)
- ❌ `generatedProps` - Not used
- ❌ `versions` - Not used
- ❌ `indices` - Not used (comes from DBConfig)
- ❌ `uniqueParam` - Not used
- ❌ `metadata` - Not used
- ❌ `lockKeys` - Not used
- ❌ `dependencies` - Not used

## Decoupling Strategy

### Option 1: Minimal Interface (Recommended)

Replace `DBProto<any>` constraint with a minimal interface:

```typescript
// In idb-shared
type IDBProto<T = any> = {
  dbType: T;
}

export type DBConfig<T extends IDBProto = IDBProto> = {
  name: string
  group: string;
  version: string
  autoIncrement?: boolean,
  uniqueKeys: (keyof T['dbType'])[]
  indices?: DBIndex<T['dbType']>[]
  upgradeProcessor?: (store: IDBObjectStore) => void
};
```

**Pros:**
- Complete decoupling from DBProto
- IDB becomes truly independent
- Can work with any type that has `dbType`
- DBProto still works (it has `dbType` property)

**Cons:**
- Need to update all generic constraints
- Breaking change for existing code

### Option 2: Direct Type Parameter

Remove Proto abstraction entirely, use the type directly:

```typescript
export type DBConfig<T = any> = {
  name: string
  group: string;
  version: string
  autoIncrement?: boolean,
  uniqueKeys: (keyof T)[]
  indices?: DBIndex<T>[]
  upgradeProcessor?: (store: IDBObjectStore) => void
};

// Usage becomes:
class IndexedDB_Store<T = any> {
  async insert(value: T): Promise<T> { ... }
  async query(): Promise<T[] | undefined> { ... }
}
```

**Pros:**
- Simplest approach
- No abstraction layer
- Most flexible

**Cons:**
- Breaking change - loses connection to DBProto ecosystem
- Users need to pass `dbType` explicitly: `DBConfig<MyProto['dbType']>`

### Option 3: Hybrid - Support Both

Support both DBProto and direct types:

```typescript
type IDBType<T> = T extends { dbType: infer D } ? D : T;

export type DBConfig<T = any> = {
  name: string
  group: string;
  version: string
  autoIncrement?: boolean,
  uniqueKeys: (keyof IDBType<T>)[]
  indices?: DBIndex<IDBType<T>>[]
  upgradeProcessor?: (store: IDBObjectStore) => void
};
```

**Pros:**
- Backward compatible
- Works with DBProto: `DBConfig<MyProto>`
- Works with direct types: `DBConfig<MyData>`

**Cons:**
- More complex type logic
- Type inference might be less clear

## Recommendation

**Option 1 (Minimal Interface)** is recommended because:
1. Clean separation of concerns
2. IDB becomes framework-agnostic
3. DBProto still works (it has `dbType`)
4. Clear intent - IDB only cares about the stored type

## Migration Path

1. Create `IDBProto` type in `idb-shared`
2. Update `DBConfig` to use `IDBProto` instead of `DBProto`
3. Update all generic constraints in IDB classes
4. DBProto will still work because it has `dbType` property
5. Update documentation/examples

## Files to Modify

### idb-shared
- `src/main/types.ts` - Replace `DBProto` constraint with `IDBProto`

### idb-frontend
- `src/main/core/IndexedDB_Store.ts` - Update generic constraints
- `src/main/core/IndexedDB_Database.ts` - Update generic constraints  
- `src/main/core/IDBManager.ts` - Update generic constraints

### Dependencies
- Remove `DBProto` import from `@nu-art/ts-common` in idb packages
- Keep `DBIndex` and `IndexKeys` (they're not DBProto-specific)

## Impact Assessment

**Breaking Changes:**
- Type signature changes (but runtime behavior unchanged)
- Users will need to update type parameters if they were using DBProto directly

**Compatibility:**
- DBProto still works (it has `dbType` property)
- Existing code using `DBConfig<MyProto>` will continue to work
- Only the internal constraint changes
