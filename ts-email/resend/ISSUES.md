## Package: `@nu-art/ts-email-backend` (not changed by this package)

### Symbol: `SendGridAdapter_Class.init()`

**Issue**: The Secret Manager read is commented out and the SendGrid key is set to the literal string `"apiKey"`.

**Details**: `ModulePackBE_Email` therefore registers a SendGrid adapter that cannot send. This package avoids it by shipping `ModulePackBE_EmailResend`. Fixing SendGrid is an existing-source change and needs approval.

### Missing LICENSE files

**Issue**: `ts-email/shared` and `ts-email/backend` have no `LICENSE` file, unlike the package standard.

### `Email` type

**Issue**: No `replyTo`, `cc`/`bcc`, headers, tags or idempotency key. Resend supports all of them; adding them is a `ts-email-shared` change and needs approval.
