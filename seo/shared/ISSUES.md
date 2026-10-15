# Issues

## File: `src/main/render.ts`

### Symbol: `seoKeys()`

**Issue**: JSON-LD builders can close over i18n keys that `seoKeys` does not list.

**Details**: `seoJsonLdWebPage`, `seoJsonLdWebSite`, and `seoJsonLdOrganization` only read keys already on the site or page. `seoJsonLdBreadcrumb` takes extra label keys. Register those keys at the call site so the CI completeness check sees them.

## File: `src/main/types.ts`

### Symbol: `SeoPageDef.path`

**Issue**: Paths are static. A route with a parameter (`/book/:host`) cannot be registered.

**Details**: The shell, sitemap, and hreflang set need a concrete path. A parameterized public page has to be rendered by the app, which can still call `renderSeoShell` with a concrete path for that request.
