# @nu-art/ts-email-resend-backend

Resend adapter for `@nu-art/ts-email-backend`. `ResendAdapter` implements `EmailAdapter` and registers itself with `ModuleBE_Email` on init. `ModuleBE_ResendApi` is the external-API module (own `HttpClient`, vendor `ApiDef`, bearer key from Secret Manager).

## Setup

1. Use `ModulePackBE_EmailResend` instead of `ModulePackBE_Email` (which registers SendGrid). The last adapter to register wins.
2. Secret Manager: the Resend API key as a JSON string, default name `resend-api-key` (read through `SecretKey`).
3. Optional RTDB `_config/<plane>/ModuleBE_ResendApi`: `{"apiKeySecretName": "resend-api-key"}`.

Send with `ModuleBE_Email.send(email)` as usual. A refusal or transport error returns `{success: false, error}` with the HTTP status and Resend's message, never the key or recipients. A missing key throws.

Templates and copy stay in the app.
