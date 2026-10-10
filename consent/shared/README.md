# @nu-art/consent-shared

Framework-free consent state: category definitions, the stored choice, and `ConsentStore` with a per-category subscribe API.

- `DefaultConsentCategories`: necessary (required, always granted), functional, analytics, marketing. Apps add their own (`{key: 'video-embeds'}`).
- `ConsentStore`: `isGranted`, `hasDecided`, `acceptAll`, `rejectAll`, `decide(granted)`, `withdraw`, `subscribe(category, listener) => unsubscribe`, `onChange`.
  - Nothing optional is granted before an explicit decision.
  - The stored choice is dropped (asked again) on a policy-version bump, after `maxAgeMs`, or when corrupt or future-dated.
  - A category added later starts as not granted.
- `ConsentSource`: the read-only interface (`isGranted`, `subscribe`) that consent-aware libraries depend on, so they never import a consent implementation.
