# @nu-art/seo-shared

Site and per-route SEO config, and the pure renderers for the HTML share-meta shell, `robots.txt`, `sitemap.xml`, `site.webmanifest`, and `llms.txt`.

Text is an i18n key. The renderers call a `SeoTranslate` you supply. There is no database and no cookie.

## Installation and usage

Add `@nu-art/seo-shared` to the consuming package's `__package.json`. Apps that only serve HTTP can depend on `@nu-art/seo-backend` instead and import types from this package.

Define one `SeoSiteDef` per public host and one `SeoPageDef` per public route in app code. Pass them to `ModuleBE_SEO.registerSite` (backend) or to the render functions directly. A single site may omit `hosts`. Two sites (Beamz admin and org portal) each list exact or wildcard hosts. A page path may include `:param`, or a `resolve` function may turn a query (`/book?slug=`) into the canonical path and the i18n params.

Do not put the site def in frontend runtime config. Origins, colors, and icon paths are public, but this config is not a frontend config object and must not be merged into one that holds secrets.

## Key features

- `SeoSiteDef` — site name, origin per env, optional hosts, publisher Organization, 1200×630 share image, theme color, color scheme, icons, Twitter card, enabled locales from the i18n locale enum.
- `SeoPageDef` — static or `:param` path, title and description keys, `og:type`, optional 1200×630 image, robots flag, sitemap flag, `resolve`, `sitemapEntries`, JSON-LD builders.
- `seoJsonLdWebPage`, `seoJsonLdWebSite`, `seoJsonLdOrganization`, `seoJsonLdBreadcrumb` — typed JSON-LD builders.
- `renderSeoShell`, `renderRobotsTxt`, `renderSitemapXml`, `renderWebManifest`, `renderLlmsTxt` — string renderers.
- `assertSeoSite`, `assertSeoPages`, `assertSeoLinks`, `assertSeoHosting` — registration checks.
- `selectSeoSite`, `resolveSiteOrigin`, `matchSeoPage`, `collectSitemapPaths` — host selection, tenant origin, path match, sitemap paths.
- `seoKeys` — i18n keys declared on the site and pages.
- `siteOrigin`, `localizedPath`, `localeFromUrlSegment` — origin and locale URL helpers.

## API overview

`renderSeoShell` emits, for one route and one enabled locale: title, description, canonical, hreflang for every enabled locale plus `x-default`, `og:*` including `og:locale` and alternates, `og:image` with `secure_url` (https only), type, width, height, and alt, `twitter:*` (`summary_large_image`), `html lang` and `dir`, JSON-LD, favicon, apple touch, manifest, `theme-color`, and `meta robots`.

`renderSitemapXml` emits one `<url>` per concrete path per locale, with `xhtml:link` hreflang alternates. `collectSitemapPaths` drops `noindex`, `sitemap: false`, and patterns that have no `sitemapEntries`. `renderRobotsTxt` disallows each `noindex` path in every enabled locale and points at `/sitemap.xml`. Share images are 1200×630, with `og:image:width` and `og:image:height`.

## Examples

```typescript
import {i18nBrand, i18nRegister} from '@nu-art/i18n-shared';
import {seoJsonLdOrganization, seoJsonLdWebPage, type SeoPageDef, type SeoSiteDef} from '@nu-art/seo-shared';

const siteName = i18nRegister(i18nBrand('booking.site.name'), {context: 'Share meta site name'});
const title = i18nRegister(i18nBrand('booking.home.title'), {context: 'Public booking page title'});
const description = i18nRegister(i18nBrand('booking.home.description'), {context: 'Public booking page description'});
const imageAlt = i18nRegister(i18nBrand('booking.share.alt'), {context: 'Default share image description'});

export const bookingSite: SeoSiteDef = {
	key: 'calendar-booking',
	siteName,
	origins: {local: 'http://localhost:5173', prod: 'https://book.example.com'},
	publisher: {name: siteName},
	image: {src: '/og.png', type: 'image/png', width: 1200, height: 630, alt: imageAlt},
	themeColor: '#0f766e',
	colorScheme: 'light dark',
	icons: {
		favicon: {src: '/favicon.ico', type: 'image/x-icon', sizes: '32x32'},
		appleTouch: {src: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180'},
		manifest: [{src: '/icon-512.png', type: 'image/png', sizes: '512x512'}],
	},
	twitter: {card: 'summary_large_image'},
	enabledLocales: ['en_US', 'nl_NL'] as const,
	defaultLocale: 'en_US',
};

export const bookingPages: SeoPageDef[] = [{
	key: 'home',
	path: '/',
	title,
	description,
	ogType: 'website',
	jsonLd: [seoJsonLdOrganization, seoJsonLdWebPage],
}];
```
