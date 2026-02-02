# Separation concept — thoughts for review

Companion to `todo.md`. Options, dilemmas, open questions, and notes so you can pick up where we left off.

---

## What’s working well (reference)

- **db-api** is a good template: shared types (CrudTypes, query-types, api-defs), BE that depends on shared + http-server + firebase, FE that depends on shared. Thunderstorm consumes it; no thunderstorm types inside db-api.
- **Shared “only both FE+BE”** is clear: shared has no FE-only or BE-only code and no dependency on FE/BE packages. That keeps the dependency graph acyclic and reuse sane.
- **Isolate → duplicate → recreate → test** avoids big-bang breakage; you can validate each feature in a dedicated package before cutting over.

---

## Options (when breaking a feature)

| Decision | Option A | Option B | Notes |
|----------|----------|----------|--------|
| **Generic vs app-specific** | Library is generic (e.g. “sync manager”), app wires implementation (Firestore, S3, etc.). | Library is built for one stack (e.g. Firebase-only). | db-api chose generic (CrudQuery, CrudTypes); BE uses Firestore. Same pattern fits Sync Manager, Sync Env, Backup. |
| **Stub vs shallow recreate** | Stub: minimal interface so thunderstorm keeps compiling; real logic stays in thunderstorm until migration. | Shallow recreate: copy minimal logic into the new package so it’s self-contained sooner. | Stub = less code move, more “glue” in thunderstorm. Shallow = more code in new package, clearer ownership. Depends how much the feature is still evolving. |
| **Move two features together** | Extract feature A + B in one go (e.g. Sync Manager + Sync Env) if they’re tightly coupled. | Extract A, then B; accept temporary adapters. | “Move together” reduces churn if the boundary between A and B is fuzzy; separate moves give smaller, clearer steps. |
| **Inline util vs new package** | Small, pure util used only by this feature → inline or copy into the new package. | Put util in a tiny shared util package. | Inline/copy avoids new packages for one-off helpers; shared util package pays off when 3+ packages need it. |

---

## Dilemmas

1. **Shared types vs “shared + FE/BE extensions”**  
   Shared holds only what both sides need. When one side needs an extra type (e.g. BE-only config), do we: (a) keep it in BE and never put it in shared, or (b) put a “base” in shared and extend in BE?  
   Prefer (a) unless the base is genuinely part of the contract (e.g. API request/response). Avoid shared types that only one side uses.

2. **Integration points “in thunderstorm” vs “in the new package”**  
   Sync Manager / Sync Env “integration points we need to discuss”: should the *caller* live in thunderstorm (orchestrating the new lib) or inside the new package (orchestrating thunderstorm via a thin adapter)?  
   Caller in thunderstorm = new package stays a “tool”. Caller in new package = new package owns the flow; thunderstorm just provides DB/server. Worth deciding per feature.

3. **Order of extraction**  
   Todo order: Sync Manager → Backup → Sync Env → Editable item → Action Processor → …  
   If Sync Manager and Sync Env share a lot (e.g. “move data between BE and FE / between envs”), doing one right after the other might reuse the same patterns and types. Backup being BE-only is a simpler slice.

4. **“Shallow recreate” and duplication**  
   If we shallow-recreate a function in the new package, we temporarily have two implementations. Need a clear rule: (1) deprecate the thunderstorm one and route to the new package, or (2) remove from thunderstorm as soon as the new package is wired. Otherwise the duplicate stays forever.

5. **Tests that span FE + BE**  
   “Some tests will span across the entire lib and will require e2e” — those tests need a runner and environment (e.g. real or emulated backend). Open: do they live in thunderstorm (integration tests that use the new packages) or in a dedicated e2e/workspace that pulls in thunderstorm + all extracted libs?

---

## Open questions

- **Sync Manager / Sync Env**  
  What exactly are the “integration points we need to discuss and handle”? (e.g. who starts sync, who owns the schedule, how does FE cache hook into Sync Manager?) Listing them in the todo or here would make the next session concrete.

- **Backup “visual FE” later**  
  “Should have shared/be packages” when FE exists: should we introduce a shared *contract* (e.g. API shapes, types) now so the future FE just implements against it, or keep everything in BE until the FE is actually built?

- **Action Processor, App config, Archiving, Routing, UI**  
  No bullets yet. Next step could be: for each, write 2–3 lines (what it does, what touches FE vs BE, what it currently depends on in thunderstorm). Then pick the next extraction target.

- **MISC**  
  Is this a bucket for “small extractions” or “things we might not extract”? Defining it avoids MISC growing into a second monolith.

- **Dependency direction**  
  Rule: “this feature would be isolated and not use any @nu-art/thunderstorm-(fe/be/shared)”. So thunderstorm may depend on the new packages; new packages must not depend on thunderstorm. Confirm: is it acceptable for thunderstorm to re-export or wrap the new packages for backward compatibility during the transition?

- **Versioning**  
  When a feature lives in its own package (e.g. db-api), do we version it with thunderstorm (one version for the whole repo) or independently? Independent helps other projects reuse it; single version simplifies the monorepo.

---

## Suggested next steps (when you’re back)

1. Flesh out Sync Manager / Sync Env integration points (and optionally Backup) in a few bullets each.
2. Decide for the next 1–2 features: stub vs shallow recreate, and where the “caller” lives (thunderstorm vs new package).
3. Add a short “current deps / coupling” line for Action Processor, App config, Archiving, Routing, UI (and optionally MISC) in the todo.
4. Optionally add a “Decisions” section to the todo (or here) so we don’t re-debate the same options (e.g. “Sync Manager: generic library, app wires Firestore + HTTP”).

Safe flight — you can continue from here when you land.
