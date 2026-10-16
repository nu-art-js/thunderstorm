# Issues

## File: `src/main/render.ts`

### Symbol: `seoKeys()`

**Issue**: JSON-LD builders can close over i18n keys that `seoKeys` does not list.

**Details**: `seoJsonLdWebPage`, `seoJsonLdWebSite`, and `seoJsonLdOrganization` only read keys already on the site or page. `seoJsonLdBreadcrumb` takes extra label keys. Register those keys at the call site so the CI completeness check sees them.
