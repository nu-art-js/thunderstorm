# Passkey Login Flow

User is NOT authenticated. Backend does not know which user is logging in.

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant Browser as Browser / Keychain
    participant BE as Backend
    participant DB as DB_PasskeyCredential

    FE->>BE: POST /login-options (empty body, no user info)
    BE->>BE: challenge = randomBytes(32)<br/>store(challengeId → challenge)
    BE-->>FE: { options: { challenge, rpId }, challengeId }

    FE->>Browser: startAuthentication(options)
    Browser->>Browser: Search Keychain for rpId="localhost"
    alt No credentials found
        Browser-->>FE: QR code fallback / error
    else Credential found
        Browser->>Browser: Touch ID prompt
        Browser->>Browser: sign(privateKey, authData + sha256(clientDataJSON))
        Browser-->>FE: { id: credentialId, signature, authData, clientDataJSON }
    end

    FE->>BE: POST /login-verify { assertionResponse, challengeId, deviceId }
    BE->>BE: Retrieve stored challenge by challengeId
    BE->>DB: QUERY { credentialId } → { publicKey, accountId, counter }
    BE->>BE: verify(publicKey, signature, authData + sha256(clientDataJSON))
    BE->>BE: Assert: challenge matches, origin matches, counter > stored
    BE->>DB: UPDATE counter
    BE->>BE: Create session for accountId
    BE-->>FE: 200 + JWT
```

## What Gets Signed

```
signatureBase = authenticatorData + SHA-256(clientDataJSON)
```

- `authenticatorData`: rpIdHash + flags + counter
- `clientDataJSON`: `{ type, challenge, origin }`

## What Travels Over the Network

| Field | Sensitive? | Purpose |
|-------|-----------|---------|
| challenge | No | One-time nonce (the "salt") |
| credentialId | No | Lookup key → publicKey + accountId |
| signature | No | Proves private key possession |
| clientDataJSON | No | Binds origin + challenge into signed payload |
| **privateKey** | **Yes** | **Never leaves device** |
