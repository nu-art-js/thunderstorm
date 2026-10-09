# @nu-art/email-resend-backend

Transactional email through [Resend](https://resend.com). Standalone: no dependency on `@nu-art/ts-email*`.

`ModuleBE_EmailResend.send(email)` maps a `ResendEmail` (from/to/cc/bcc/replyTo, subject, html/text, headers, tags, idempotency key) onto the Resend SDK.

## Setup

1. Add `ModulePackBE_EmailResend` to the backend module packs.
2. Secret Manager: the Resend API key stored **raw** (plain text, not JSON), default secret name `resend-api-key`. Read through `ModuleBE_SecretManager.tryGetSecretValue`, using `GCP_PROJECT_ID` / `GCLOUD_PROJECT`.
3. Optional RTDB `_config/<plane>/ModuleBE_EmailResend`: `{"apiKeySecretName": "resend-api-key", "defaultFrom": {"email": "noreply@example.com", "name": "Example"}}`.

## Behaviour

- Nothing is read and no SDK client exists until the first `send`; then the client is reused. A failed key read is not cached.
- A Resend refusal returns `{success: false, error}` with the status and Resend's message, never the key or recipients. A missing key throws.
- Display names are quoted and stripped of line breaks, so they cannot inject addresses or headers.
- The module log level is capped at Info.

Templates and copy stay in the app.
