# Issues Found During Documentation

This file tracks potential bugs, broken logic, architectural concerns, or areas for improvement discovered while documenting the build-and-install package.

## File: `src/main/build-and-install-v3.ts`

### Symbol: `nodeProjectUnit` and `phaseManager` fields

**Issue**: Fields are marked `readonly` but are set via `@ts-ignore` in `build()` method.

**Details**: 
- Line 46: `readonly nodeProjectUnit!: Unit_NodeProject;`
- Line 49: `readonly phaseManager!: PhaseManager;`
- Lines 147-148 and 192-193: Fields are set using `@ts-ignore` to bypass readonly

**Recommendation**: Consider making these fields non-readonly, or use a different initialization pattern (e.g., lazy getters, builder pattern).

## File: `src/main/build-and-install.ts`

### Symbol: Exit code on error

**Issue**: Main entry point exits with code 0 even on error.

**Details**: Line 9 calls `process.exit(0)` in the catch handler, which should probably be `process.exit(1)` to indicate failure to calling processes.

## File: `src/main/v3/PhaseManager.ts`

### Symbol: `mapStep()` method - unit lookup

**Issue**: Unit lookup iterates through all layers, which could be inefficient for large workspaces.

**Details**: Lines 206-211 iterate through all unit layers to find a unit by key. Consider using a lookup map for O(1) access instead of O(n) iteration.

## File: `src/main/v3/units/Unit_NodeProject.ts`

### Symbol: `watch()` method - status setting

**Issue**: Uses `@ts-ignore` to set readonly status field.

**Details**: Line 154-155 uses `@ts-ignore` to set unit status. The status field appears to be readonly but is modified. Consider making it non-readonly or using a different pattern.

## File: `src/main/v3/units/Unit_TypescriptLib.ts`

### Symbol: `prepare()` method - publish method deletion

**Issue**: Uses `@ts-ignore` to delete publish method for private packages.

**Details**: Line 211-212 uses `@ts-ignore` to set `this.publish = undefined` for private packages. This is a workaround - consider a better pattern (e.g., conditional phase implementation).

