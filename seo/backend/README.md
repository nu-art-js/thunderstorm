# @nu-art/seo-backend

`ModuleBE_SEO` serves the share-meta HTML shell and the crawler files for one registered site.

Locales come from the site's `enabledLocales`. Texts come from `ModuleBE_I18n.translator`. The module does not query locales, does not write, and does not set cookies.

## Installation and usage

Add `@nu-art/seo-backend` to the app backend `__package.json`. Add `ModulePackBE_SEO` to the Storm module pack. Register the site before `Storm.build()`:

```typescript
import {ModuleBE_SEO, ModulePackBE_SEO} from '@nu-art/seo-backend';

ModuleBE_SEO.registerSite(bookingSite, bookingPages);
ModuleBE_SEO.setDefaultConfig({env: 'local', site: 'calendar-booking', rootRedirect: true, bundle: {scripts: ['/app.js'], styles: ['/app.css']}});
```

`ModulePackBE_SEO` sets the i18n texts source. Call `setTextsSource` yourself only in tests.

RTDB config key: `ModuleBE_SEO_Class`. Fields: `env`, `site`, `bundle`, `cacheMaxAgeSec`, `rootRedirect`. Override `env` per environment so the matching `origins` entry is used. None of these are secrets.

There is no frontend module. Do not put this config in the frontend bundle.

## Key features

- `ModuleBE_SEO` — registers sites and routes.
- `ModulePackBE_SEO` — wires the i18n translator.
- `I18nSeoTextsSource` — permission-aware translator, no locale query.
- `parseAcceptLanguage` — `Accept-Language` to tags, used by the root redirect.

## API overview

`registerSite(site, pages)` checks the site, the pages, and llms.txt links, then stores them in memory. `init` serves `config.site` at:

- `GET /<locale><path>` — HTML shell
- `GET /robots.txt`
- `GET /sitemap.xml`
- `GET /site.webmanifest` — site name in the default locale
- `GET /llms.txt?lang=` and `GET /<locale>/llms.txt` when the site defines `llms`
- `GET /` — 302 to `/<locale>/` when `rootRedirect` is on (`?lang=`, then `Accept-Language`, then the default)

`init` does not touch the database. There is no project-setup task.

## Examples

Hosting must rewrite `/`, `/robots.txt`, `/sitemap.xml`, `/site.webmanifest`, `/llms.txt`, and `/<locale>/**` to this service.

See `@nu-art/seo-shared` for the site and page config, and `seo/.rules/how-to-use.mdc` for the full shape.
