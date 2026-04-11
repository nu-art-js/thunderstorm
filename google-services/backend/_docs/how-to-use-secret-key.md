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
2. **IAM permissions**: the service account needs `roles/secretmanager.secretAccessor` (read) and optionally `roles/secretmanager.secretVersionManager` (write/create).

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