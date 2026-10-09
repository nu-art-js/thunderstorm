## File: `src/main/ModuleBE_RateLimit.ts`

### Symbol: `ModuleBE_RateLimit_Class.hit()`

**Issue**: Uses `query.uniqueUnmanipulated` to read the bucket.

**Details**: Buckets are infra counters keyed by a server-side digest and shared by all callers (e.g. one bucket per IP). A caller's document-access context must not hide or fork them. `uniqueUnmanipulated` is documented as sanctioned for internal self-loads; this needs an explicit OK. The write (`set.item`) still runs the pre-write interceptors, so on authenticated routes the permissions interceptor would stamp/assert `__access` with the caller's groups. Until there is a sanctioned service context for infra writes, register the rate-limit middleware before the session/permissions middleware.

### Symbol: `ModuleBE_RateLimit_Class.purgeExpired()`

**Issue**: Manual trigger only; no scheduler wiring. Expiry is not decided yet. Each bucket carries `expiresAtTtl` (a Date, stored as a Firestore Timestamp) so a Firestore TTL policy can be enabled per project without code changes:
`gcloud firestore fields ttls update expiresAtTtl --collection-group=rate-limit--buckets --enable-ttl`. Firestore TTL deletes within ~24h of expiry, which is fine because an expired bucket counts as empty. The lib does not configure it.

## Package: `@nu-art/firebase-backend` (not changed by this package)

### Symbol: `FirestoreWrapperBE.runTransaction()` (lost updates under contention)

**Issue**: When Firestore retries a contended transaction, the retry can read the previous attempt's uncommitted write, so concurrent read-modify-write transactions lose updates.

**Details**: The Firestore SDK passes the same `Transaction` object to every attempt. Each attempt re-binds `originSet`/`originGet`/... from the already-wrapped methods of the previous attempt, so the retry's `get` goes through the previous attempt's `transactionUpdates` mock and returns that attempt's pending write. `postTransactionActions` is also declared outside the callback, so post-transaction hooks queued by failed attempts run too. Reproduced on the Firestore emulator with 6 concurrent `consume()` calls against `limit: 3`: all 6 were allowed. Restoring the SDK's original methods at the start of each attempt (an experiment in node_modules only, not committed) made all 6 transactions behave (3 allowed, 3 rejected). This affects every db-api transaction, not only rate limiting. The fix is an existing-source change and needs approval; until then the `concurrent hits cannot exceed the limit` test is skipped and a burst of concurrent requests from one subject can exceed the limit.
