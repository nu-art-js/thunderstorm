# @nu-art/ga4-frontend

Google Analytics 4 (gtag.js), gated by consent. It depends only on `ConsentSource` from `@nu-art/consent-shared`; the app passes its consent module.

```typescript
import {ModulePackFE_GA4, ModuleFE_GA4} from '@nu-art/ga4-frontend';
import {ModuleFE_Consent} from '@nu-art/consent-frontend';

.addModules(...ModulePackFE_Consent, ...ModulePackFE_GA4)
ModuleFE_GA4.setConsentSource(ModuleFE_Consent);   // the app composes the two

// config
ModuleFE_GA4: {measurementId: 'G-XXXXXXX', sendPageView: false}
```

Behaviour:
- **Before consent for `analytics`:** no script, no cookie, no `dataLayer`, no `gtag`. Events are dropped, not queued.
- **On grant:**
  - Consent Mode v2 starts with a default of all denied, then updates `analytics_storage` to granted.
  - `ad_storage`, `ad_user_data` and `ad_personalization` follow the `marketing` category.
  - The gtag script is then loaded once.
- **On withdrawal:** consent is updated to denied, `window['ga-disable-<id>'] = true` is set, `_ga*` cookies are expired, and events are dropped. The already loaded script cannot be unloaded.
- `event(name, params)` and `pageView(params)` return false when dropped.

`Ga4Controller` holds the logic with an injectable environment (`global`, `loadScript`, `deleteCookies`) and is what the tests cover.
