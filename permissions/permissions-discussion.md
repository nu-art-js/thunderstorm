# Permissions Concept — Discussion Notes

**Context**: Companion to `todo.md`. Options, dilemmas, thoughts, and open questions for review (e.g. offline / in-flight). No decisions locked in—explore and refine later.

---

## 1. Current Implementation — Quick Recap

- **Model**: Project → Domains → Access Levels (numeric); Groups carry domain→level; Users carry group refs; APIs are registered with required domain→level.
- **Session**: On login/session load, permission user is resolved by `accountId`, groups loaded, `domainToValueMap` computed (max level per domain), stored in session.
- **Assertion**: Per request, middleware resolves `projectId` (and optional custom fields), looks up `DB_PermissionAPI` by **path + projectId**, gets required levels, compares to `MemKey_UserPermissions` (session’s `domainToValueMap`). Sync filter uses same idea to hide DB modules the user can’t access.
- **API binding**: Permissions are bound to **HTTP path** (and project). DB-API routes get levels via `defaultLevelsRouteLookupWords` (e.g. last path segment: `query`→Read, `patch`→Write). Custom APIs can be registered explicitly with path + domain + level.
- **Lifecycle**: New account → `OnNewUserRegistered` creates permission user (same `_id` as account), empty groups. Project setup creates projects, domains, levels, groups, and **APIs** by scanning `ModuleBE_BaseApi_Class` and route names.

**Good**: Clear domain/level model, session-based so no DB hit per request for assertion, sync filtering, project scoping, strict mode for “unknown path = 403”.

**Bad/Ugly**: Binding is by **route path**, not by “this function” or “this capability”. One path = one permission config; no first-class notion of “this handler needs X and Y permissions”. Route-word lookup is magic and fragile (depends on naming). Hard to express “same route, different required level by context” or “permission that isn’t an API”.

---

## 2. Permissions on “Function / Capability” vs “API Path”

**Todo**: *“bind dedicated permissions types to a function call rather than an api”*

**Options**

- **A. Keep path-based, enrich metadata**  
  Continue keying `DB_PermissionAPI` by path (and project). Add optional metadata (e.g. required level set, custom keys) so that “what this route needs” is explicit in DB, not only inferred from `defaultLevelsRouteLookupWords`. Assertion stays path-based; middleware unchanged.  
  *Pro*: Small change, backward compatible. *Con*: Still tied to HTTP route, not to “function” or “capability”.

- **B. Permission as a capability / symbol**  
  Introduce a first-class “permission” or “capability” type (e.g. string or enum) that a **handler** declares it needs (e.g. via decorator or options in `ApiHandler`). Registry maps capability → required domain/level (or domain/level set). Middleware: resolve route → handler → capability(ies) → required levels → assert.  
  *Pro*: Same handler can be exposed on different routes with different caps; non-API code can “assert capability” without a path. *Con*: Need a clear story for “how does path still get a permission record?” (e.g. path → handler → capability, or path + capability both stored).

- **C. Decorator on handler with required level/domain**  
  e.g. `@RequirePermission(domainId, level)` or `@RequirePermission(capabilityId)`. Registration (project setup) either scans decorator metadata to create/update `DB_PermissionAPI` by path, or we move to “assert by capability” and keep path only for routing.  
  *Pro*: Declarative at call site; no magic from path substring. *Con*: Coupling handler to permissions package; need convention for “domain” (e.g. from module/package).

- **D. Hybrid**  
  Path still used for registration and for “which API record” in DB. Handler (or ApiHandler options) can **override** or **attach** explicit permission requirement (capability or domain+level). Assertion: if handler has explicit requirement, use it; else fall back to path-based lookup.  
  *Pro*: Incremental; existing APIs keep working; new code can be precise. *Con*: Two ways to define “required permission” to document and maintain.

**Dilemma**: “Function” could mean (1) the TypeScript function that handles the request, (2) a logical “capability” (e.g. “can manage billing”), or (3) an API path. Aligning these (and with project setup that scans routes) needs a clear choice: path as key vs capability as key vs both with a clear precedence.

**Open question**: Should “permission” be something that **only** protects HTTP endpoints, or also a primitive that any backend code can call (e.g. `assertPermission(capability)` for internal workflows, cron, etc.)?

---

## 3. Centralized Identity / Cross-Project and Cross-App

**Todo**: *“how we do this across projects and apps, like a centralized identity provider”*

**Thoughts**

- Today: permission user is per (this) app, keyed by `accountId`. Projects and groups are per app (or per deployment). No built-in “one identity, many apps” or “one IdP, many backends”.
- Centralized identity usually means: one place that issues tokens and (optionally) one place that stores/returns “roles” or “permissions”. Apps either trust that and map to local model, or call a shared “permissions service” by identity.

**Options**

- **A. Keep app-local permissions, IdP only for identity**  
  IdP gives you `accountId` (and maybe coarse claims). This app’s permissions package still owns PermissionUser, groups, projects. No cross-app permission store.  
  *Pro*: Simple, no new service. *Con*: No “assign once, use in many apps”.

- **B. Shared permission service**  
  One backend (or BFF) holds projects/groups/APIs; multiple apps call it to “resolve permissions for this account” or “assert(path, accountId)”. Session in each app could cache that result.  
  *Pro*: Single place to manage who can do what. *Con*: Latency, dependency, and need to define “project” and “API” in a global way (e.g. appId + path).

- **C. IdP + coarse roles, app-local fine-grained**  
  IdP (or token) carries e.g. “admin”, “support”, “customer”. App maps those to local groups or levels; fine-grained (domain/level/API) stays in this app’s permissions DB.  
  *Pro*: Central “who is this” and coarse access; fine-grained stays where the app lives. *Con*: Two layers to keep in sync conceptually.

**Open questions**: Do you need “one permission user record” shared across multiple apps (same accountId, same groups in all)? Or is it enough that each app has its own permission user for that accountId, and “central” only means “same accountId from IdP”? What is the “project” in a multi-app world—per app or global?

---

## 4. Relation to User Account and “Dedicated” Permission User / Group

**Todo**: *“keep the relation to the user account id”*, *“when a new user is introduced, create a dedicated permissions user and a dedicated permissions group”*, *“permissions user serves as a user groups holder”*, *“permissions group serves as user dedicated overrides and permissions.. (no one else can see or assign it to another user)”*, *“permissions groups need to have a type”*

**Current state**: Permission user `_id === accountId`; it holds `groups: User_Group[]` (groupId refs). Groups are shared (e.g. “Permissions Editor”, “Accounts Viewer”). No “per-user private group” or “group type” yet.

**Interpretation of “dedicated”**

- **Permission user**: Already 1:1 with account; “dedicated” = keep that and ensure it’s created on first login/registration. Clear.
- **Dedicated permission group**: A **private** group that only exists for that user: overrides and user-specific grants. Not assignable to others; not even visible in “assign group” UIs for other users. So: two kinds of groups—
  - **Shared groups**: “Permissions Editor”, “Accounts Viewer”, etc.—assignable, visible in admin UIs.
  - **User-dedicated group (per-user override)**: One per permission user, e.g. `type: 'user-dedicated'`, used for overrides and extra grants. Only that user’s record references it; creation with new user.

**Options**

- **A. Add group type + dedicated group per user**  
  `DB_PermissionGroup` gets e.g. `type: 'shared' | 'user-dedicated'`. On create permission user, also create one group with `type: 'user-dedicated'` and link it only to that user. Assignment UI and “list groups” only show `type: 'shared'`.  
  *Pro*: Clear semantics; overrides and user-specific grants don’t pollute shared groups. *Con*: Need rules: can user-dedicated group grant more than shared? Same domain/level model?

- **B. Dedicated group as “virtual” or computed**  
  No separate DB entity; “effective” permissions = shared groups + a per-user override map (e.g. domain → level) stored on permission user. UI shows “overrides” instead of “dedicated group”.  
  *Pro*: Simpler schema. *Con*: Less uniform (groups vs override map); if later you want “user-dedicated” to look like a group (e.g. for auditing), you’d refactor.

- **C. Only shared groups for now, design “dedicated” later**  
  Keep current model; document “dedicated group” as a future type and reserve the relation (e.g. permission user has `dedicatedGroupId` optional).  
  *Pro*: No immediate schema change. *Con*: Overrides and user-specific grants stay unspecified.

**Open question**: Should “user-dedicated” group be able to grant **anything** (including permissions management), or be restricted to a subset of domains (e.g. no PermissionsDefine/PermissionsAssign)?

---

## 5. Permissions Gating Permissions (Meta)

**Todo**: *“permissions may and will be used to gate permissions granting and changing”*

**Thoughts**: You already have domains like PermissionsAssign and PermissionsDefine; assigning a group to a user is an operation that should require the right level on PermissionsAssign (and maybe PermissionsDefine for “who can create groups/APIs”). So “gate granting and changing” is largely “ensure those APIs and UIs are protected by the same assertion model.”

**Options**

- **A. No extra machinery**  
  “Assign permissions” and “define projects/domains/APIs” are just APIs with required levels; middleware asserts them like any other route. Only risk: bootstrap (first SuperAdmin) and making sure no path is accidentally unprotected.  
  *Pro*: One model for everything. *Con*: Must be disciplined with route registration and strict mode.

- **B. Explicit “meta” rules**  
  e.g. “user can only assign groups whose max level ≤ their own level in that domain”. Enforced in the “assign permissions” handler, not only “can you call this API”.  
  *Pro*: Prevents “read-only” permission admin from granting “admin” by mistake. *Con*: More logic and possibly more DB reads (resolve group levels before allowing assign).

**Open question**: Do you want “can assign only up to my own level” enforced in backend, or is “can hit assign API” enough for v1?

---

## 6. Assertions — How Permissions “Assert Themselves”

**Todo**: *“we need to think about assertions, and how permissions will assert themselves”*

**Current**: Assertion is “middleware before handler”: load session permissions, resolve API by path (+ projectId), compare required levels to user’s `domainToValueMap`. Sync filter asserts by “user’s level for this API’s path”.

**Possible extensions**

- **Where to assert**: (1) Only at HTTP boundary (current). (2) Also inside services: e.g. `PermissionsAssert.assertCapability('billing:write')` or `assertDomainLevel(domainId, level)` for code paths that aren’t a single API (or to double-check inside an API that does several things).
- **What to assert**: (1) Only “domain + level” (current). (2) Plus “capability” or “scope” (e.g. “this resource”, “this org”) — might need resource-bound assertions later (e.g. “can edit this project” not just “can edit any project”).
- **Who drives it**: (1) Middleware only (path → API → levels). (2) Handler declares requirement (decorator or options); middleware or a small helper runs the same assertion logic with that requirement.

**Dilemma**: If we add “assert inside handler”, we need a consistent primitive (e.g. “required levels” or “required capability”) so that both “path-based” and “handler-declared” use the same check and the same session data.

**Open question**: Is “assert only at HTTP boundary” enough for the next 1–2 years, or do you want an explicit `assertPermission(...)` (or similar) for use inside backend code?

---

## 7. Queries and Data Access (Filtering by Permission)

**Todo**: *“how queries can be manipulated using permissions”*

**Current**: Sync filter hides entire DB modules (collections) the user doesn’t have “query” level for. No row-level or field-level filtering; no “query rewrite” (e.g. inject `where orgId in userOrgs`).

**Options**

- **A. Keep collection-level only**  
  Permission = “can you see this collection at all” (read/write/delete by route). No automatic query manipulation.  
  *Pro*: Simple, matches current. *Con*: Multi-tenant or “see only my org” must be done in each API (e.g. base query by `accountId` or `orgId`).

- **B. Query constraints from permissions**  
  e.g. “user has org-scoped access” → before running query, inject constraint (e.g. `orgId in (user’s orgs)`). Requires a way to express “this collection is scoped by X” and “user’s scope for X” from session or permission user.  
  *Pro*: Central place to enforce “see only what you’re allowed”. *Con*: Complex; need clear contract for “injectable” constraints and performance (indexes).

- **C. Explicit “scope” in session**  
  Session carries not only `domainToValueMap` but e.g. `allowedOrgIds`, `allowedProjectIds`. Handlers (or a shared query helper) add `where` clauses from that. Permissions package only provides “what scope does this user have”; doesn’t rewrite queries itself.  
  *Pro*: Clear separation; app controls how scope is used. *Con*: Every query that must be scoped has to use the helper.

**Open question**: Is the main use case “hide whole collections” (current) or “same collection, different rows per user/org”? That drives whether we ever need query manipulation or scoped session data.

---

## 8. User Groups (Teams, Orgs, 3rd Party, etc.)

**Todo**: *“how we manage ‘user groups’ (multiple accounts associated with a context, team, companies, organizations, 3rd party clients users, etc.)”*

**Current**: “Group” in permissions = a set of domain→level assignments (a role). Not “a set of users” (team/org). So “user groups” in the todo likely means: **groups of users** (teams, companies, orgs, 3rd party) and how they interact with permissions.

**Interpretation**

- **Teams / orgs / companies**: Entities that contain multiple accounts; permission might be “this team can access this project” or “this org has this role”. So we need a notion of “subject” that can be either (1) a user (account) or (2) a collective (team, org, company). Then “assign permission” could be “assign this role to this team” and “resolve user’s permissions” = user’s own groups + all teams’ groups the user is in.
- **3rd party clients**: Could be “another app” (client_id) or “another org’s users”; again, a different “subject” type and possibly a different project or scope.

**Options**

- **A. Keep subject = user only for now**  
  Permissions stay “per accountId”. Teams/orgs are an app-level concept (e.g. org membership in another collection); app code resolves “user’s org” and then e.g. passes `orgId` as custom field for permission or does its own data filtering.  
  *Pro*: No change to permissions package. *Con*: “Assign role to team” and “user gets team’s permissions” not in this package.

- **B. Introduce “collective” as a subject**  
  e.g. PermissionSubject = User | Team | Organization. PermissionUser becomes “PermissionSubject” for users; add Team/Org entities that also have “groups”. User’s effective permissions = user’s groups + groups of all teams/orgs they belong to. Assignment UI can “assign to team” or “assign to user”.  
  *Pro*: Single place for “who has what” including teams. *Con*: Membership (user-in-team, user-in-org) must live somewhere (here or user-account); more entities and resolution logic.

- **C. External “membership” only**  
  Permissions package still only has “user + groups”. Another package or app holds “user ↔ team/org” and “team/org ↔ role”. When resolving session permissions, a dispatcher or callback provides “extra groups for this user” (e.g. from team membership). So permissions package stays simple; “user groups” (teams) are implemented by feeding group IDs from outside.  
  *Pro*: Minimal change; teams/orgs can evolve independently. *Con*: “Assign role to team” might mean “create a group and attach it to a team entity elsewhere”; resolution contract must be clear.

**Open question**: Is “user groups” in the todo primarily “multiple accounts in a context” (e.g. “these 5 users are the billing team”) or “one user in multiple contexts” (e.g. “this user is in Org A and Org B with different roles”)? Both might be needed; the first is more about “subject = team”, the second about “user has many roles per context”.

---

## 9. Tests

**Todo**: *“needless to say we have to test the mother of this package!”*

- **Unit**: Domain/level comparison, “user passes required levels”, session shape, default level derivation.
- **Integration**: Create project → create permission user → assign group → login → assert path (allowed/forbidden); strict mode on/off; sync filter.
- **Edge cases**: No permission user for account (e.g. first login), no groups, unknown path (strict vs non-strict), multiple groups (max level wins), user-dedicated group once it exists.

No new options here—just flag that any change (decorators, capability, dedicated group, query scope) should add or extend tests in the same package so the “mother” stays well covered.

---

## 10. Summary Table (for quick scan)

| Topic | Main options | Open question |
|-------|--------------|----------------|
| Function vs API binding | Path-only vs capability/symbol vs decorator vs hybrid | Permission only for HTTP vs also internal `assertPermission()`? |
| Centralized identity | App-local vs shared permission service vs IdP roles + local fine-grained | One shared permission user across apps or per-app with same accountId? |
| Dedicated user/group | Add group type + dedicated group vs override map vs defer | Can user-dedicated group grant any domain? |
| Meta (gate granting) | Same assertion only vs “can assign only up to my level” | Enforce “assign ≤ my level” in backend? |
| Assertions | HTTP only vs also in-handler assert | Need `assertPermission()` in backend code? |
| Queries | Collection-level vs query constraints vs scope in session | Main case: hide collections or same collection different rows? |
| User groups (teams/orgs) | Subject = user only vs collective (team/org) vs external membership | “User groups” = many users in context or one user in many contexts? |

---

*Document written for offline review. When you’re back, we can pick one or two threads (e.g. “function vs API” and “dedicated group”) and turn them into concrete design + tasks.*
