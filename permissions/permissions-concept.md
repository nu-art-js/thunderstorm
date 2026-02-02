# Permissions: Codable Entities and No Manual UIDs

**Problem**: Today we (1) provide UIDs to many entities and generate them manually → bad DX and error-prone; (2) use random/free-form strings as permission keys → not scalable and no single source of truth; (3) have no mechanism to **connect codable entities** so that backend and frontend hook the same permission without duplicating strings and IDs.

**Goal**: A single **codable permission definition** that: indicates the safeguard (what the permission allows), allows the UI to hook BE and FE without suffering, and avoids manual UIDs + free-form string keys.

---

## Current Pain (Concrete)

1. **Manual UIDs**
   - `Domain_Pathway._id = '6fde2805529c729fcbeeb72ac7ae1fbb'` — must generate and paste; easy to collide or typo.
   - `pathwayEditorBaseKey = 'permission-editor-base-key'` — seed for `generateDomainDefaults`; must be unique and never change; copy-paste risk.

2. **String keys as the only contract**
   - Shared: `PermissionKey_PathwayView = 'pathway-view'`.
   - Backend: `new PermissionKey_BE(PermissionKey_PathwayView, resolver)`.
   - Frontend: `PermissionKey_FE.generatePermissionKeysByLevels(PathwayCollectionPermissionKeys)` and components use the same string.
   - If someone types `'pathwy-view'` in one place, no type error; runtime permission mismatch.

3. **No single codable entity**
   - The “permission” is defined in three places: shared (strings + namespaces), backend (PermissionKey_BE + domain with _id), frontend (same strings). Adding a permission = touch all three; no one object that both BE and FE reference by identity.

---

## Direction: One Definition, Derived IDs, Typed Hooks

- **Single definition**: One codable object (or manifest) that describes “this feature’s permissions” (domain, collection keys, editor keys, levels). Backend **registers** from it; frontend **references** the same object for UI gating.
- **Derived IDs**: No manual UIDs. Domain id, permission key id, group id are derived from a **stable seed** (e.g. package name + feature name + key path). Same seed → same id everywhere; no paste, no collision.
- **Typed hooks**: UI and BE use the **same export** (e.g. `PathwayPermissions.collection.view`). TypeScript enforces “this permission exists”; no string duplication in component code. The runtime “key” (for session/API) can be the derived id or a stable string produced from the definition.
- **Safeguard**: The definition carries “what this allows” (domain, level). Same definition used for registration, UI gating, and (optionally) docs/assertion.

---

## Options

### A. definePermissionBundle() in shared — single object, derived ids

- **Where**: Shared (or one permissions module per feature).
- **Shape**: One call that takes a stable **seed** (e.g. `'pathway'`, `'pathway/editor'`) and a **schema** (domain namespace, collection/editor keys and levels). Returns a single object:
  - `domainId`, `domainNamespace`
  - `collection: { view: PermissionDef, edit: PermissionDef, delete: PermissionDef }`
  - `editor: { [levelName]: PermissionDef }` (or whatever structure you use)
- **IDs**: All ids derived from seed + key path: e.g. `domainId = md5(seed)`, `permissionKeyId = md5(seed + '/collection/view')`. No manual UIDs.
- **BE**: Imports the bundle; registers domain + PermissionKey_BE for each entry using the derived ids and levels from the bundle.
- **FE**: Imports the same bundle; `<PermissionsComponent permission={PathwayPermissions.collection.view} />`. Component accepts `PermissionDef` (or a symbol/key from the bundle), resolves to derived key for session lookup.
- **Safeguard**: Each `PermissionDef` carries `domainId`, `level` (or level name); optional `label`. One place that defines “what this permission allows”.

**Pros**: One source of truth; no manual UIDs; FE and BE share the same object; typo = compile error.  
**Cons**: Shared (or permission module) must depend on a small “permission definition” runtime that can derive ids and expose PermissionDef type; existing DB may need a one-time migration if current ids differ from derived ones.

### B. Symbol or branded key — reference identity, string only for serialization

- **Where**: Shared exports **symbols** or **branded types** (e.g. `PathwayView = createPermissionRef('pathway', 'collection', 'view', Read)`). The “key” for DB/session is a string derived inside `createPermissionRef` (e.g. md5 of path); the **export** is the ref object (or symbol) so that TS enforces “this permission exists”.
- **BE**: Registers PermissionKey_BE using the **string** produced by the same `createPermissionRef` (or a registry that maps ref → string).
- **FE**: Uses the same ref; PermissionsComponent(resolution) accepts ref and looks up by the internal string when talking to session/API.
- **IDs**: Domain id still needs a seed; could be `createDomainRef('pathway')` → derived domain id. No manual UIDs.

**Pros**: Reference identity; no string in component code.  
**Cons**: Symbols don’t serialize; need a registry (ref → string) for API/session; slightly more machinery.

### C. Codegen / manifest — single source, generated code

- **Where**: One manifest (YAML/JSON or typed TS object) that lists feature, domain, permission keys and levels. Build step generates: shared constants (with derived ids), BE registration code, FE type and key map.
- **IDs**: Generated from manifest path + key; deterministic.
- **BE/FE**: Consume generated code; no manual UIDs; no free-form strings in hand-written code.

**Pros**: Single source; no manual IDs; clear contract.  
**Cons**: Build step; may be overkill if option A is enough.

---

## Recommended Path: A + small runtime

1. **Add a tiny “permission definition” helper** (in thunderstorm permissions or pathway shared):
   - `definePermissionBundle(seed, config)` where `config` has `namespace`, `collection: { [key]: levelName }`, optional `editor: { ... }`, optional `customApis`.
   - Returns an object: `{ domainId, namespace, collection: { view: Def, ... }, editor: { ... }, permissionKeys: string[] }` where each `Def` has `id` (derived), `level`, `key` (for backward compat if needed).
   - All ids from `md5(seed + path)` (or similar); **no manual UIDs**.

2. **Shared**: Replace current string constants and `generateKeyNamesByAccessLevel` with one call:
   - `PathwayPermissions = definePermissionBundle('pathway', { namespace: 'Pathway', collection: { view: 'Read', edit: 'Write', delete: 'Delete' }, editor: { ... } })`.
   - Export `PathwayPermissions`. Backend and frontend both import this.

3. **Backend**: Register domain and PermissionKey_BE from `PathwayPermissions` (domainId, permissionKeys, levels). No `Domain_Pathway._id` or `pathwayEditorBaseKey` in source; both come from the bundle. For `generateDomainDefaults`-style UI domains, either extend the bundle shape or keep a second call that uses the same seed so ids stay derived.

4. **Frontend**: Use `PathwayPermissions.collection.view` (and similar) in `ModuleFE_DefaultPermissions` and in `<PermissionsComponent permission={PathwayPermissions.collection.view} />`. PermissionKey_FE / PermissionsComponent resolve the **definition’s id** when checking session. No string literals in UI.

5. **Safeguard**: The bundle **is** the safeguard: it lists exactly what each key allows (domain + level). UI and BE both hook this; no second source of truth.

6. **Migration**: If existing DB already has different ids, either: (a) one-time migration to derived ids, or (b) allow a short transition where “key” can be old string or new derived id until all clients use the new definition.

---

## Open Points

- **Seed stability**: Seed (e.g. `'pathway'`, `'pathway/editor'`) must never change for the same feature; document that. Prefer a single seed per feature and derive all ids from it.
- **Where the helper lives**: In thunderstorm permissions (reusable) vs pathway shared (app-specific). If more apps need this, put the helper in thunderstorm and keep only the bundle config in app shared.
- **Backward compat**: Existing PermissionKey_FE / PermissionsComponent today take a **string** key. They need to accept either string (legacy) or PermissionDef (or ref) and resolve to the key used in session. Same for BE registration.
- **UI “editor” domains**: You have both collection permissions (view/edit/delete) and editor permissions (UI levels). The same bundle can expose both: `collection` and `editor` (or `ui`); BE registers both; FE uses the same object for both. No extra UIDs.

---

## Summary

| Issue | Today | Target |
|-------|--------|--------|
| UIDs | Manual paste of domain _id, base keys | Derived from stable seed + key path |
| Keys | Free-form strings in 3 places | Single codable object; BE/FE import same ref |
| Safeguard | Scattered (domain, level, key) | One definition carries “what this allows” |
| UI hook | String in component | `permission={PathwayPermissions.collection.view}` |

The core fix is: **one codable permission definition per feature, with derived ids and typed refs**, so that you never hand-write UIDs or permission strings, and the UI hooks the same entity the backend registers.
