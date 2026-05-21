# Passkey Registration Flow

User must be authenticated (session exists). This flow binds a new credential to their account.

```mermaid
sequenceDiagram
    participant FE as Frontend JS
    participant Browser as Browser WebAuthn API
    participant SE as Secure Enclave / Keychain
    participant BE as Backend
    participant DB as DB_PasskeyCredential

    Note over FE, DB: Precondition: User is logged in (valid session JWT in headers)

    FE->>BE: POST /v1/passkey/register-options<br/>Body: {} | Headers: Authorization JWT
    Note over BE: Extracts accountId from session (MemKey_AccountId)
    BE->>DB: QUERY { accountId } → existing credentials
    Note over BE: Generates registration options:<br/>• rpName: "Newsly Local"<br/>• rpId: "localhost"<br/>• userName: account.email<br/>• attestationType: "none"<br/>• excludeCredentials: [existing credentialIds]<br/>• authenticatorSelection:<br/>  - residentKey: "required"<br/>  - userVerification: "preferred"
    Note over BE: Generates random challenge (Base64URL nonce)<br/>Stores in memory: pendingChallenges[accountId] = { challenge, createdAt }
    BE-->>FE: { options: { challenge, rp, user, pubKeyCredParams, excludeCredentials, ... } }

    FE->>Browser: startRegistration({ optionsJSON: options })
    Note over Browser: Browser validates origin matches rp.id<br/>Constructs clientDataJSON:
    Note over Browser: clientDataJSON = {<br/>  "type": "webauthn.create",<br/>  "challenge": "<Base64URL challenge>",<br/>  "origin": "https://localhost:8013",<br/>  "crossOrigin": false<br/>}

    Browser->>SE: Create credential request<br/>rpId: "localhost", user.id, algorithms
    Note over SE: User prompt: Touch ID / biometric
    SE->>SE: Generate P-256 keypair:<br/>• privateKey (never leaves enclave)<br/>• publicKey (exportable)<br/>• credentialId = random 32+ bytes
    SE->>SE: Store in Keychain:<br/>{ rpId: "localhost", credentialId, privateKey, userHandle }
    Note over SE: Build authenticatorData (binary):<br/>• rpIdHash = SHA-256("localhost") [32 bytes]<br/>• flags: UP=1, UV=1, AT=1 [1 byte]<br/>• counter: 0 [4 bytes]<br/>• attestedCredentialData:<br/>  - aaguid [16 bytes]<br/>  - credentialId length [2 bytes]<br/>  - credentialId [variable]<br/>  - publicKey in COSE format [variable]
    Note over SE: Build attestation signature:<br/>signatureBase = authenticatorData + SHA-256(clientDataJSON)<br/>attestation = sign(privateKey, signatureBase)<br/>(with attestationType "none", this is self-attestation)
    SE-->>Browser: { authenticatorData, clientDataJSON, attestationObject }

    Browser-->>FE: attestationResponse = {<br/>  id: credentialId (Base64URL),<br/>  rawId: credentialId (ArrayBuffer),<br/>  response: { clientDataJSON, attestationObject },<br/>  type: "public-key",<br/>  authenticatorAttachment: "platform"<br/>}

    FE->>BE: POST /v1/passkey/register-verify<br/>Body: { attestationResponse, label: "MacBook Pro" }<br/>Headers: Authorization JWT

    Note over BE: Extracts accountId from session
    BE->>BE: Lookup pendingChallenges[accountId] → { challenge }
    Note over BE: verifyRegistrationResponse():<br/>1. Decode clientDataJSON<br/>2. Assert type === "webauthn.create"<br/>3. Assert challenge matches stored challenge<br/>4. Assert origin === "https://localhost:8013"<br/>5. Compute rpIdHash = SHA-256("localhost")<br/>6. Assert authenticatorData.rpIdHash matches<br/>7. Assert flags: UP=1, UV=1<br/>8. Extract publicKey from attestedCredentialData<br/>9. Verify attestation signature (self-attestation)
    BE->>BE: Delete pendingChallenges[accountId]
    BE->>DB: INSERT {<br/>  accountId: "user-42",<br/>  credentialId: "abc123..." (Base64URL),<br/>  publicKey: "<Base64URL encoded COSE key>",<br/>  counter: 0,<br/>  transports: ["internal"],<br/>  label: "MacBook Pro",<br/>  backedUp: true/false<br/>}
    BE-->>FE: { credential: { _id, credentialId, label, transports, backedUp } }

    Note over FE, DB: Registration complete. Private key in Keychain, public key in DB.
```

## Key Artifacts After Registration

| Location | What's stored | Purpose |
|----------|--------------|---------|
| Secure Enclave / Keychain | privateKey + credentialId + rpId + userHandle | Sign future challenges |
| DB_PasskeyCredential | publicKey + credentialId + accountId + counter | Verify signatures, map credential → user |
| Server memory | Nothing (challenge deleted) | — |

## Cryptographic Operations

| Step | Operation | Input | Output |
|------|-----------|-------|--------|
| Challenge generation | `crypto.randomBytes` | entropy | 32-byte Base64URL nonce |
| Key generation | P-256 ECDSA | Secure Enclave RNG | { privateKey, publicKey, credentialId } |
| rpIdHash | SHA-256 | `"localhost"` (UTF-8) | 32-byte hash |
| clientDataJSON hash | SHA-256 | JSON string | 32-byte hash |
| Attestation signature | ECDSA-P256-SHA256 | `authenticatorData \|\| SHA-256(clientDataJSON)` | DER-encoded signature |
