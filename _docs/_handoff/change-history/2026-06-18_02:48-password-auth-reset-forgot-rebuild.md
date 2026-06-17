# 2026-06-18 02:48 — Rebuild Component_ResetPassword & Component_ForgotPassword on framework widgets
- **Author:** tacb0ss
- **Packages touched:** @nu-art/password-auth-frontend
- **Concepts / docs:** password-auth UI; ts-account authenticate styling

## Why

`Component_ResetPassword` and `Component_ForgotPassword` were crude raw-HTML stubs (`<input>`/`<button>`/`<h2>` with unstyled `.reset-password` / `.forgot-password` classes) while their siblings `Component_Login` / `Component_Register` were already built on framework widgets and themed via tokens. A Beamz consumer (`@app/common-frontend` auth screens, #554) composes all four into one branded flow, so the two raw-HTML screens would have rendered visibly broken and unthemed next to the polished login/register. This rebuild brings them up to the same quality bar — framework widgets, submitting/error states, token-driven styling — without changing their module binding or public props.

The reset-component rebuild was the explicitly approved infra change; the forgot-component rebuild is the identical defect on its twin in the same flow, so the same approved pattern was carried through for consistency rather than leaving one broken screen.

## What changed

- **Component_ResetPassword** — rewritten from a `useState` raw-HTML form into a `ComponentSync` mirroring `Component_Login`: `TS_PropRenderer.Vertical` + `TS_Input` fields, `Button` with `actionInProgress`, password-match validation, error container, success message. Props (`token`, `onSuccess?`) and binding (`ModuleFE_PasswordAuth.executeReset`) unchanged.
- **Component_ForgotPassword** — same rebuild against `ModuleFE_PasswordAuth.requestReset`; gained an optional `onSubmitted?` callback (was previously prop-less; no existing consumers).
- **Component_Authenticate.scss** (new) — extracted the shared `.ts-account__authenticate` block (form layout, error container, password-rules) into one partial as the SSOT, plus a `.ts-account__message` rule for the success/info states. `Component_Login.scss` now `@use`s it instead of inlining; the rebuilt reset/forgot components `@use` it too.

## Verified

- `bash build-and-install.sh -i` — green (password-auth-frontend compiled via tsc; both consuming apps built).
- No existing consumers of the two components outside this package (usage search) — signature change on ForgotPassword is safe.
