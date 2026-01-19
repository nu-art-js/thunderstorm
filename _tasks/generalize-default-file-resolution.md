# Generalize Default File Resolution with Fallback Chain

## Status
Pending

## Description
Create a reusable utility for resolving default files (like Dockerfile) with a fallback chain mechanism. This will replace the current ad-hoc file resolution logic in `Unit_FirebaseFunctionsApp.ts` and can be reused across the codebase.

## Requirements

### Fallback Chain Priority
The utility should check for files in the following order:
1. **Unit config** - `containerDeployment.dockerfile` (or equivalent per file type)
2. **Runtime config** - `runtimeContext.runtimeConfig?.docker?.dockerfile` (or equivalent)
3. **BAI config** - `baiConfig.files?.docker?.dockerfile` (or equivalent)
4. **BAI default config** - Default templates provided by the build system

### Core Functionality
The utility must handle:
- **Template parameter substitution** - Apply template params when copying files
- **File generation in .trash folder** - Never pollute workspace, always generate in `.trash`
- **Fallback chain resolution** - Automatically check each level of the fallback chain
- **Template copying with params** - Use `FileSystemUtils.file.template.copy()` for template files

## Current Implementation
Located in: `_thunderstorm/build-and-install/src/main/units/implementations/firebase/Unit_FirebaseFunctionsApp.ts:236-249`

Currently simplified to throw an error if Dockerfile doesn't exist, but needs the full fallback chain implementation.

## Use Cases
- Dockerfile resolution for container builds
- Cloud Build config files
- Other generated configuration files that may have templates

## Related Files
- `_thunderstorm/build-and-install/src/main/units/implementations/firebase/Unit_FirebaseFunctionsApp.ts`
- `_thunderstorm/build-and-install/src/main/config/types/project-config.ts` (BAI_Config type)

