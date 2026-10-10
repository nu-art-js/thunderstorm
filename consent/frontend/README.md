# @nu-art/consent-frontend

- `ModuleFE_Consent`: a localStorage-backed `ConsentStore` that implements `ConsentSource`.
  - Config: `privacyPolicyUrl` (required), `categories`, `policyVersion`, `maxAgeMs` (default 365 days), `storageKey`.
  - `openSettings()` re-opens the banner, e.g. from a "Cookie settings" footer link.
- `Component_ConsentBanner`: a small bottom-right card (bottom-left in RTL).
  - Accept all and Reject all are equal buttons on the first layer, with a "Choose" button for per-category choice and a link to the privacy policy.
  - Non-blocking. Text comes in through `texts` (translated by the app), with English defaults.
  - Themed via `--ts-consent-*` CSS variables.

GDPR / Dutch AP (Autoriteit Persoonsgegevens) points this covers:
- No pre-ticked boxes.
- Rejecting is as easy as accepting.
- The privacy policy is reachable from the banner.
- Consent can be withdrawn as easily as given (`openSettings`, `withdraw`).
- The choice expires and is asked again.

"Nothing loaded before consent" is the job of each consumer: it must load only after `isGranted(...)` or `subscribe(...)` says so. See `@nu-art/ga4-frontend`.
