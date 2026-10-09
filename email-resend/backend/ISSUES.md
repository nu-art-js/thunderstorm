## File: `src/main/ModuleBE_EmailResend.ts`

### Raw secret read

**Issue**: `SecretKey<T>.get()` JSON-parses the secret, so the raw Resend key is read with `ModuleBE_SecretManager.tryGetSecretValue({key, projectId, version: 'latest'})`. A raw-string accessor on `SecretKey` (e.g. `getRaw()`) would remove the duplicated project-id lookup; that is an existing-source change and needs approval.

### Attachments, batch, scheduled send

**Issue**: Not exposed yet. Add when an app needs them.
