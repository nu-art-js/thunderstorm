## File: `src/main/ModuleBE_RateLimit.ts`

### Symbol: `ModuleBE_RateLimit_Class.purgeExpired()`

**Issue**: Reads the whole `buckets` node, then deletes expired buckets one transaction at a time.

**Details**: `FirebaseRef` has no query API (`orderByChild('expiresAt').endAt(now)`), so the purge cannot select only expired buckets. That is fine while the node is small, because touched keys clean themselves up. A query on `FirebaseRef` would be an existing-source change and needs approval. There is no scheduler wiring; the app calls `purgeExpired` periodically.

## Package: `@nu-art/firebase-backend` (not changed by this package)

### Symbol: `FirestoreWrapperBE.runTransaction()` (lost updates under contention)

**Issue**: Found while this lib used Firestore (it now uses the Realtime Database). When Firestore retries a contended transaction, the retry can read the previous attempt's uncommitted write, so concurrent read-modify-write transactions lose updates.

**Details**: The Firestore SDK passes the same `Transaction` object to every attempt. Each attempt re-binds `originSet`/`originGet`/... from the already-wrapped methods of the previous attempt, so the retry's `get` returns that attempt's pending write. `postTransactionActions` is declared outside the callback, so post-transaction hooks queued by failed attempts run too. Reproduced on the Firestore emulator: 6 concurrent read-modify-write transactions against a limit of 3 all committed. This affects every db-api transaction. The fix is an existing-source change and needs approval.
