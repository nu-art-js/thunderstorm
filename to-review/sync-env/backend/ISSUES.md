# Issues — @nu-art/sync-env-backend

Track type safety, logic, quality, missing/wrong imports, and follow-ups here. One block per file/symbol as needed.

## Current

### File: `src/main/ModuleBE_SyncEnv.ts`

**Issue**: TS6133 — `HttpServer` is declared but its value is never read.

**Details**: Remove unused import or use the symbol. Fix to unblock build.
