# Passkey Login Flow

User is NOT authenticated. No session exists. Backend does not know which user is logging in.

```mermaid
sequenceDiagram
    participant FE as Frontend JS
    participant Browser as Browser WebAuthn API
    participant SE as Secure Enclave / Keychain
    participant BE as Backend
    participant DB as DB_PasskeyCredential

    Note over FE, DB: Precondition: No session. User identity unknown to server.

    FE->>BE: POST /v1/passkey/login-options<br/>Body: {} (no user identifier)
    Note over BE: generateAuthenticationOptions():<br/>• rpId: "localhost"<br/>• userVerification: "preferred"<br/>• allowCredentials: [] (empty = discoverable)
    Note over BE: Generates random challenge (Base64URL nonce, 32 bytes)<br/>challengeId = crypto.randomUUID()<br/>Stores: pendingChallenges[challengeId] = { challenge, createdAt }<br/><br/>Note: NO user binding — challenge is anonymous
    BE-->>FE: { options: { challenge, rpId, userVerification, timeout }, challengeId }

    FE->>Browser: startAuthentication({ optionsJSON: options })
    Note over Browser: Browser validates current origin is valid for rpId<br/>Constructs clientDataJSON:
    Note over Browser: clientDataJSON = {<br/>  "type": "webauthn.get",<br/>  "challenge": "<Base64URL challenge from server>",<br/>  "origin": "https://localhost:8013",<br/>  "crossOrigin": false<br/>}

    Browser->>SE: Get assertion request<br/>rpId: "localhost", allowCredentials: [] (any)
    Note over SE: Search Keychain for ALL discoverable<br/>credentials where rpId === "localhost"
    alt No credentials found
        SE-->>Browser: Error: no credentials available
        Browser-->>FE: QR code fallback (cross-device) or error
    else One or more credentials found
        Note over SE: If multiple: show picker UI<br/>If one: proceed directly
        SE->>SE: User prompt: Touch ID / biometric
        Note over SE: Selected credential:<br/>• credentialId: "abc123..."<br/>• privateKey: (hardware-bound)
        SE->>SE: Build authenticatorData (binary):<br/>• rpIdHash = SHA-256("localhost") [32 bytes]<br/>• flags: UP=1, UV=1, AT=0 [1 byte]<br/>• counter: N+1 [4 bytes] (incremented)
        SE->>SE: Compute signature:<br/>signatureBase = authenticatorData + SHA-256(clientDataJSON)<br/>signature = ECDSA_P256_SHA256(privateKey, signatureBase)
        SE-->>Browser: { authenticatorData, signature, userHandle }
    end

    Browser-->>FE: assertionResponse = {<br/>  id: "abc123..." (credentialId, Base64URL),<br/>  rawId: credentialId (ArrayBuffer),<br/>  response: {<br/>    clientDataJSON,<br/>    authenticatorData,<br/>    signature,<br/>    userHandle (accountId bytes, optional)<br/>  },<br/>  type: "public-key",<br/>  authenticatorAttachment: "platform"<br/>}

    FE->>BE: POST /v1/passkey/login-verify<br/>Body: { assertionResponse, challengeId, deviceId }

    Note over BE: Step 1: Retrieve challenge
    BE->>BE: Lookup pendingChallenges[challengeId]<br/>→ { challenge, createdAt }<br/>Assert not expired (< challengeTtlMs)

    Note over BE: Step 2: Identify user via credentialId
    BE->>DB: QUERY { credentialId: "abc123..." }
    DB-->>BE: { credentialId, publicKey, accountId: "user-42", counter: N, transports }
    Note over BE: NOW the backend knows the user is "user-42"<br/>(credentialId is the bridge from anonymous → identified)

    Note over BE: Step 3: Verify signature
    BE->>BE: verifyAuthenticationResponse():<br/>1. Decode clientDataJSON<br/>2. Assert type === "webauthn.get"<br/>3. Assert challenge === stored challenge (the "salt")<br/>4. Assert origin === "https://localhost:8013"<br/>5. Compute rpIdHash = SHA-256("localhost")<br/>6. Assert authenticatorData.rpIdHash matches<br/>7. Assert flags: UP=1<br/>8. Reconstruct signatureBase:<br/>   authenticatorData + SHA-256(clientDataJSON)<br/>9. Verify signature against publicKey using ECDSA-P256<br/>10. Assert counter > stored counter (replay protection)

    Note over BE: Step 4: Update state
    BE->>DB: UPDATE { credentialId: "abc123...", counter: N+1, lastUsedAt: now }
    BE->>BE: Delete pendingChallenges[challengeId]

    Note over BE: Step 5: Create session
    BE->>BE: MemKey_AccountId.set("user-42")<br/>Create session JWT with claims:<br/>{ accountId: "user-42", deviceId, label: "passkey-login" }
    BE-->>FE: 200 OK | Header: x-auth-token: <JWT>

    Note over FE, DB: Login complete. User identified solely via credentialId→accountId mapping.
```

## Trust Chain (Why the Backend Trusts This)

```mermaid
flowchart TD
    Sig["Signature is valid"]
    PK["Only matching privateKey<br/>could produce this signature"]
    HW["privateKey lives in<br/>Secure Enclave (hardware)"]
    BIO["Accessed only via<br/>Touch ID / biometric"]
    Challenge["Challenge is fresh<br/>(single-use, server-generated)"]
    Origin["Origin is embedded<br/>in signed payload"]
    RPID["rpIdHash is embedded<br/>in signed payload"]
    Counter["Counter incremented<br/>(no replay)"]

    Sig --> PK
    PK --> HW
    HW --> BIO
    Sig --> Challenge
    Sig --> Origin
    Sig --> RPID
    Sig --> Counter
```

## What Travels Over the Network

| Field | Direction | Sensitive? | Purpose |
|-------|-----------|-----------|---------|
| `challenge` | Server → Client | No | One-time nonce (the "salt"), prevents replay |
| `challengeId` | Server → Client → Server | No | Lookup key for stored challenge |
| `credentialId` | Client → Server | No | Maps to publicKey + accountId in DB |
| `clientDataJSON` | Client → Server | No | Contains origin + challenge for verification |
| `authenticatorData` | Client → Server | No | Contains rpIdHash + flags + counter |
| `signature` | Client → Server | No | Proves possession of privateKey |
| `deviceId` | Client → Server | No | Session metadata |
| **privateKey** | **NEVER** | **Yes** | **Never leaves Secure Enclave** |

## Cryptographic Operations During Login

| Step | Operation | Input | Output |
|------|-----------|-------|--------|
| Challenge generation (server) | `crypto.randomBytes` | entropy | 32-byte Base64URL nonce |
| clientDataJSON hash (browser) | SHA-256 | JSON string (contains challenge + origin) | 32-byte hash |
| rpIdHash (authenticator) | SHA-256 | `"localhost"` (UTF-8) | 32-byte hash embedded in authenticatorData |
| Signature (authenticator) | ECDSA-P256-SHA256 | `authenticatorData \|\| SHA-256(clientDataJSON)` | DER-encoded signature |
| Verification (server) | ECDSA-P256-SHA256 verify | publicKey + signatureBase + signature | boolean |
| Counter check (server) | Integer comparison | stored counter vs received counter | Assert received > stored |
