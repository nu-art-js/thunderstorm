# How to use SecretKey

`SecretKey<T>` is a typed wrapper for reading and writing secrets in GCP Secret Manager.
Values are stored as JSON, so the type parameter `T` must extend `AnyPrimitive` (string, number, boolean, or arrays/objects of primitives).

## Prerequisites

1. **Register `ModuleBE_SecretManager`** in your module pack so the singleton is initialized:

```typescript
import {ModuleBE_SecretManager} from '@nu-art/google-services-backend';

export const ModulePackBE_MyFeature: Module[] = [
	ModuleBE_SecretManager,
	// ... your modules
];
```

1. **GCP project ID** must be available via one of:
  - `GCP_PROJECT_ID` environment variable
  - `GCLOUD_PROJECT` environment variable
  - Explicit `projectId` parameter in the constructor
2. **IAM permissions** for a secret that already exists: `roles/secretmanager.secretAccessor` (`secretmanager.versions.access`). Writing a new version of an existing secret also needs `secretmanager.versions.add` (`roles/secretmanager.secretVersionAdder`). Creating a secret that does not exist yet needs `secretmanager.secrets.create` on the project. See [Auto-generated secrets](#auto-generated-secrets).

## Creating a SecretKey

```typescript
import {SecretKey} from '@nu-art/google-services-backend';

// Uses GCP_PROJECT_ID or GCLOUD_PROJECT from env
const apiToken = new SecretKey<string>('my-api-token');

// Explicit project ID
const apiToken = new SecretKey<string>('my-api-token', 'my-gcp-project-id');

// Typed — arrays, numbers, etc.
const signingKeys = new SecretKey<string[]>('jwt-signing-keys');
```

## Reading a secret

```typescript
// Returns undefined if the secret doesn't exist
const token = await apiToken.get();

// With fallback: if the secret doesn't exist, creates it with the fallback value and returns it
const token = await apiToken.get('default-value');
```

- Values are deserialized via `JSON.parse()`, so secrets stored in GCP must be valid JSON
- A string value must be stored as `"my-value"` (with quotes), not bare `my-value`

## Writing a secret

```typescript
await apiToken.set('new-token-value');
```

This creates a new version of the secret. Previous versions remain accessible.

## Auto-generated secrets

A secret that is only a random value is declared with `GeneratedSecret`. Construction does not call Secret Manager. The first `get()` reads the latest version and caches it. When the secret is missing, that call generates 32 random bytes (64 hex chars), creates the secret, and stores the value as version 1.

If another instance creates the secret first, this call reads that value instead of writing a second one.

```typescript
import {GeneratedSecret} from '@nu-art/google-services-backend';

const signingKey = new GeneratedSecret('embed-signing-key');

// later, on the request that needs the key — not during module init
const key = await signingKey.get();
```

Externally provided secrets (API keys, webhook secrets) stay on `SecretKey`. `get()` with no fallback returns `undefined` when the secret is missing, and a permission error is thrown. They are not created.

```typescript
const apiKey = await new SecretKey<string>('resend-api-key').get();
if (!apiKey)
	throw new ImplementationMissingException('Missing Resend API key');
```

An existing payload is kept. A raw string is returned as-is. A payload stored as a JSON string (the rate-limit pepper) is unwrapped. New values are stored raw.

### IAM for auto-generated secrets

The runtime service account needs, on the project:

| Permission | Why |
|---|---|
| `secretmanager.versions.access` | Read the value. Already granted by `roles/secretmanager.secretAccessor`. |
| `secretmanager.secrets.create` | Create the secret the first time it is used. |
| `secretmanager.versions.add` | Store version 1. |

`secretmanager.secrets.create` can only be granted on the project (the secret does not exist yet). `roles/secretmanager.secretVersionAdder` has `secretmanager.versions.add` but cannot create a secret. `roles/secretmanager.editor` has both create and add, and also delete and destroy, and it does **not** include `secretmanager.versions.access`.

Grant `roles/secretmanager.secretAccessor` plus a custom role with `secretmanager.secrets.create` and `secretmanager.versions.add`. A permission error is not treated as "missing": the call fails and nothing is created.

## Lazy resolution pattern (recommended)

For secrets that are expensive to fetch or needed repeatedly, resolve once and cache:

```typescript
export class MyModule_Class extends Module<Config> {
	private secretKey!: SecretKey<string>;
	private cachedValue?: string;

	protected init() {
		super.init();
		if (this.config?.secretId)
			this.secretKey = new SecretKey<string>(this.config.secretId);
	}

	private async resolveSecret(): Promise<string | undefined> {
		if (this.cachedValue)
			return this.cachedValue;

		return this.cachedValue = await this.secretKey.get();
	}
}
```

- Use definite assignment (`!`) on the `SecretKey` field — if `init` sets it, it's guaranteed
- Cache with a single assign-and-return expression — no intermediate checks

```

## Reading previous versions

```typescript
// Get the version before the latest
const previousToken = await apiToken.previous();

// Get N versions back (0 = latest, 1 = previous, 2 = two back, ...)
const olderToken = await apiToken.previous(2);
```

## Checking when a secret was last modified

```typescript
const lastModifiedMs = await apiToken.modifiedTimestamp();
```

Returns Unix milliseconds of the latest version's creation time. Useful for rotation logic.

## Secret rotation pattern

See `ModuleBE_JWT` in `@nu-art/user-account-backend` for a complete rotation example:

```typescript
const secret = new SecretKey<string[]>(config.secretKey, config.projectId);

// Read or create with fallback
const keys = await secret.get([generateHex(32)]);

// Rotate: prepend new key, trim to max
const rotated = [generateHex(32), ...keys];
rotated.length = Math.min(rotated.length, maxSecrets);
await secret.set(rotated);
```

## Storing secrets via gcloud CLI

```bash
# Create a new secret (value must be valid JSON)
echo -n '"my-secret-value"' | gcloud secrets create my-secret-name \
  --replication-policy="automatic" \
  --data-file=-

# Add a new version to an existing secret
echo -n '"new-value"' | gcloud secrets versions add my-secret-name \
  --data-file=-

# Read the latest version
gcloud secrets versions access latest --secret=my-secret-name
```

**Important:** Since `SecretKey` uses `JSON.parse()`, string values must be JSON-encoded (wrapped in double quotes). Arrays and objects should be valid JSON.