# Issues

## File: `src/main/ModuleBE_SEO.ts`

### Symbol: `ModuleBE_SEO_Class`

**Issue**: Enabled locales are the site config list, not the locale documents' `enabled` flag.

**Details**: The module does not query the locale collection. A code listed on the site is served even if that locale document is disabled, and a locale enabled only in the database is not served. The app should keep `enabledLocales` aligned with the locales it actually enables. This is deliberate: the module stores nothing and does not seed on start.
