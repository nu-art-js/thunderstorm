# Thunder RTDB Config Pipeline

Thunder modules receive runtime configuration from Firebase Realtime Database (RTDB). This document explains the full pipeline, covers both module-author and project-bootstrap concerns, and serves as the reference for the cursor rule at `_thunderstorm/.rules/consuming/thunder-config-pipeline.mdc`.

## How it works

### Frontend

1. **`__package.json`** declares a `configUrl` per environment under `unitConfig.envs.<env>.config`:
   ```json
   {
     "unitConfig": {
       "envs": {
         "local": {
           "config": {
             "configUrl": "http://127.0.0.1:8004/_config/frontend/manager.json?ns=<projectId>"
           }
         }
       }
     }
   }
   ```
   The URL points to a path in the Firebase RTDB (served by the emulator locally, or the real RTDB in deployed envs).

2. **`Thunder.fetchConfig()`** (in `thunder-core`) runs as a pre-build action. It fetches the JSON from `configUrl` (and optionally `defaultConfigUrl`), merges them, and stores the result as `this.config`.

3. **`ModuleManager`** distributes config slices to each registered module. The key is the **module class name** (the constructor name of the singleton). For example, if you register `ModuleFE_App` (an instance of `ModuleFE_App_Class`), Thunder looks for `config["ModuleFE_App"]` — but because of how `Module` resolves config, the key in RTDB must match the class name used for config resolution (typically the `_Class` suffix name's config key, which is the class name without `_Class`... in practice, use the **exact string that appears as the key in the RTDB seed** and verify it matches).

4. Each module's `init()` runs with `this.config` populated from its RTDB slice.

### Backend

1. **`config.ts`** (generated or hand-written in `app/backend/src/main/`) declares the RTDB paths:
   ```typescript
   export const Environment = {
     "envKey": "local",
     "pathToDefaultConfig": "/_config/default",
     "pathToEnvOverrideConfig": "/_config/local"
   };
   ```

2. The backend `Storm` (or equivalent module manager) fetches config from RTDB at these paths, merges default with env-override, and distributes per-module config by class name — same principle as frontend.

3. Each backend module gets its config slice from `_config/default/<ClassName>` merged with `_config/<envKey>/<ClassName>`.

## RTDB seed file

The emulator loads RTDB data from an export file:

```
app/backend/.trash/data/database_export/<projectId>.json
```

### Structure

```json
{
  "_config": {
    "default": {
      "ModuleBE_AlertEngine": {},
      "ModuleBE_SomeOther": {
        "key": "value"
      },
      "label": "local"
    },
    "frontend": {
      "manager": {
        "ModuleFE_App": {
          "serverUrl": "http://localhost:8002"
        },
        "label": "Local Manager"
      }
    }
  }
}
```

- `_config/default/` — Backend module configs (shared across envs).
- `_config/<envKey>/` — Backend env-specific overrides (merged on top of default).
- `_config/frontend/<appLabel>/` — Frontend module configs. The `<appLabel>` segment (e.g. `manager`) corresponds to the URL path segment in `configUrl`.

### Key naming

The key under each path **must be the module's class name** as it appears in the module manager. For a module declared as:

```typescript
export class ModuleFE_App_Class
  extends Module<Config> { ... }

export const ModuleFE_App = new ModuleFE_App_Class();
```

The RTDB key is `ModuleFE_App` (the config key is resolved from the class name; verify by checking what key `ModuleManager` looks up — typically the class name without `_Class`).

## Adding config for a new module

1. Define the Config type, defaults, and validator in the module — see [how-to-use-module-config.md](_thunderstorm/ts-common/_docs/how-to-use-module-config.md) for the full pattern.

2. Add the config entry to the RTDB seed file under the correct path (key must match the module class name minus `_Class`):
   ```json
   {
     "_config": {
       "frontend": {
         "manager": {
           "ModuleFE_MyModule": {
             "serverUrl": "http://localhost:8002"
           }
         }
       }
     }
   }
   ```

3. Register the module in the app's module list (e.g. `index.tsx` for frontend, `index.ts` for backend).

4. Restart the emulator (or re-seed) so the new config is picked up.

## Bootstrapping a new project

A brand-new Thunder project requires:

1. **RTDB seed file** — Create `app/backend/.trash/data/database_export/<projectId>.json` with at least:
   ```json
   {
     "_config": {
       "default": {
         "label": "<env-label>"
       },
       "frontend": {
         "manager": {
           "label": "<frontend-label>"
         }
       }
     }
   }
   ```

2. **Frontend `__package.json`** — Add `configUrl` under `unitConfig.envs.<env>.config` pointing to the RTDB path. The URL format for the local emulator is:
   ```
   http://127.0.0.1:<rtdb-port>/_config/frontend/<appLabel>.json?ns=<projectId>
   ```

3. **Backend `config.ts`** — Declare `pathToDefaultConfig` and `pathToEnvOverrideConfig`.

4. **Firebase emulator config** — Ensure `firebase.json` includes the database emulator and points to the export data directory.

Without these, Thunder's `fetchConfig()` fails (or returns empty), and every module initializes with no config.

## Common pitfalls

- **Missing RTDB entry** — Module silently initializes with `undefined` config. No error is thrown; things just don't work.
- **Wrong key name** — The RTDB key must match the class name exactly. A typo means the module gets no config.
- **Emulator not seeded** — The emulator must load the export data on startup. If the seed file is missing or the emulator isn't configured to use it, RTDB is empty.
- **Frontend `serverUrl` missing** — Without `serverUrl` in `ModuleFE_App`'s config, `HttpClient` has no default origin and all API calls fail.
