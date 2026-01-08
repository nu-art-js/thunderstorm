# Issues Found During Documentation

This file tracks potential bugs, broken logic, or areas for improvement discovered while documenting the ts-common package.

## File: `src/main/core/module.ts`

### Symbol: `initiated` field

**Issue**: The `initiated` field is declared as `readonly` but is actually modified externally by ModuleManager using `@ts-ignore`. This creates a type safety issue where TypeScript thinks the field cannot be modified, but it actually is.

**Details**: The ModuleManager sets `module.initiated = true` after initialization (line 136 in module-manager.ts), but the field is declared as `readonly` in the Module class. This should either be:
- Changed to a non-readonly field with proper typing
- Or use a getter method instead of a direct field access

### Symbol: `config` field

**Issue**: The `config` field is marked as `readonly` but is actually modified by `setConfig()` and `setDefaultConfig()` methods using `@ts-ignore`.

**Details**: While the intent is to prevent external mutation, the field is modified internally. Consider using a private setter or a different pattern to maintain immutability guarantees while allowing internal updates.

### Symbol: `runAsync` method

**Issue**: The method wraps a Promise-returning function in `new Promise()`, which is redundant and can cause issues with error handling.

**Details**: The `toCall` parameter already returns a Promise, so wrapping it in `new Promise(toCall)` is unnecessary. This should be:
```typescript
protected runAsync = (label: string, toCall: () => Promise<any>) => {
  setTimeout(() => {
    this.logDebug(`Running async: ${label}`);
    toCall()
      .then(() => {
        this.logDebug(`Async call completed: ${label}`);
      })
      .catch(reason => this.logError(`Async call error: ${label}`, reason));
  }, 0);
};
```

## File: `src/main/core/module-manager.ts`

### Symbol: `modulesInterface.some()` method

**Issue**: The `some()` method returns `T` instead of `boolean`, which is incorrect. The `some()` method should return a boolean indicating whether any element matches the predicate.

**Details**: Line 44 returns `as T` but should return `as boolean`. This is a type error that could cause runtime issues if the return value is used in a boolean context.

### Symbol: `version` field

**Issue**: The `version` field is declared as `readonly` but is actually modified by `setVersion()` using `@ts-ignore`. This creates a type safety issue.

**Details**: Similar to the `initiated` and `config` issues in Module, this should either be non-readonly or use a different pattern.

### Symbol: `init()` method error handling

**Issue**: When a module's `init()` throws an error, the error is caught and logged, but `validate()` is still called on the failed module. This could lead to validation errors for modules that didn't properly initialize.

**Details**: The `initiated` flag is only set to `true` on successful initialization (line 136), but `validate()` is called on all modules regardless (line 143). Consider either:
- Skipping validation for modules that failed to initialize
- Or ensuring validation can handle uninitialized modules gracefully

### Symbol: `getEnvironment()` method

**Issue**: The base implementation returns an empty string, which may not be the intended behavior. This method should probably be abstract or throw an error if not overridden.

**Details**: Subclasses like BaseStorm override this method, but if a ModuleManager is used directly without overriding, it will return an empty string which may not be useful. Consider making it abstract or throwing a NotImplementedException.

## File: `src/main/core/logger/Logger.ts`

### Symbol: `tag` field

**Issue**: The `tag` field is declared as `readonly` but is modified by `setTag()` using `@ts-ignore`.

**Details**: Similar to other readonly fields that are modified, this creates a type safety issue. Consider using a different pattern.

### Symbol: `assertCanPrint()` methods

**Issue**: Both `assertCanPrint()` methods return `undefined` when the debug flag is not enabled, but the return type is inferred (not explicitly `boolean`). While this works (undefined is falsy), it's not ideal.

**Details**: The methods should explicitly return `false` instead of `undefined` for clarity and type safety:
```typescript
private assertCanPrint(level: LogLevel): boolean {
  if (!this._DEBUG_FLAG.isEnabled())
    return false;
  return this._DEBUG_FLAG.canLog(level);
}
```

## File: `src/main/utils/version-tools.ts`

### Symbol: `compareVersions()` method

**Issue**: The `split('\.')` pattern uses an unnecessary escape sequence. In a string literal, a backslash before a dot is not needed - `split('.')` would work correctly and is more readable.

**Details**: Lines 66-67 use `split('\.')` which should be `split('.')`. The backslash escape is only needed in regex patterns, not in string literals. While this works (the backslash is treated as a literal backslash followed by a dot, which still splits correctly), it's confusing and unnecessary.

## File: `src/main/validator/type-validators.ts`

### Symbol: `tsValidateDynamicObject()` method

**Issue**: Line 22 (now 37) has a double closing brace `}}` in the template string, which should be a single `}`.

**Details**: The line reads `Key: ${_keyRes}}\nValue: ${_valRes}` but should be `Key: ${_keyRes}\nValue: ${_valRes}`. The extra `}` is a syntax error that would cause the template string to be malformed.

## File: `src/main/mem-storage/MemStorage.ts`

### Symbol: `MemKey.merge()` method

**Issue**: The method calls `merge()` function but it's not imported.

**Details**: Line 289 calls `merge(currentValue, value)` but there's no import for the `merge` function from `../utils/merge-tools.js`. This will cause a runtime error. Should add: `import {merge} from '../utils/merge-tools.js';`

## File: `src/main/modules/CSVModuleV3.ts`

### Symbol: `fromString()` method

**Issue**: Contains console.log statements that should be removed or replaced with proper logging.

**Details**: Lines 87, 91, and 95 contain console.log statements (`console.log('HERE - data')`, `console.log('HERE - end')`, `console.log('HERE - err')`). These appear to be debug statements that should either be removed or replaced with proper logger calls using `this.logDebug()` or similar.

## File: `src/main/replacer-v2/ReplacerV2.ts`

### Symbol: `replace()` method

**Issue**: The method has unreachable code and doesn't actually perform replacement.

**Details**: The method extracts parameters but then has `return params[0]; return text;` where the second return is unreachable. The method doesn't actually replace anything in the text - it just extracts parameter names. This appears to be incomplete implementation.
