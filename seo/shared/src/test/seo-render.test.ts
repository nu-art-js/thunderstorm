/*
 * @nu-art/seo-shared - Site and page SEO config and share-meta rendering
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {createI18nTranslator, i18nBrand, type I18nLocaleCode} from '@nu-art/i18n-shared';
import {
	assertSeoLinks,
	assertSeoPages,
	assertSeoSite,
	jsonForScript,
	localeFromUrlSegment,
	localizedPath,
	renderLlmsTxt,
	renderRobotsTxt,
	renderSeoShell,
	renderSitemapXml,
	renderWebManifest,
	seoJsonLdBreadcrumb,
	seoJsonLdOrganization,
	seoJsonLdWebPage,
	seoJsonLdWebSite,
	seoKeys,
	siteOrigin,
	type LlmsTxtDef,
	type SeoImage,
	type SeoPageDef,
	type SeoSiteDef,
} from '../main/index.js';

const k = {
	title: i18nBrand('seo.pricing.title'),
	description: i18nBrand('seo.pricing.description'),
	heading: i18nBrand('seo.pricing.heading'),
	body: i18nBrand('seo.pricing.body'),
	org: i18nBrand('seo.org.description'),
	siteName: i18nBrand('seo.site.name'),
	publisher: i18nBrand('seo.publisher.name'),
	imageAlt: i18nBrand('seo.image.alt'),
	logoAlt: i18nBrand('seo.logo.alt'),
	pageImageAlt: i18nBrand('seo.page.image.alt'),
	crumb: i18nBrand('seo.crumb.home'),
	llmsTitle: i18nBrand('llms.title'),
	llmsSummary: i18nBrand('llms.summary'),
	llmsDetail: i18nBrand('llms.detail'),
	llmsDocs: i18nBrand('llms.docs'),
	llmsApi: i18nBrand('llms.api'),
	llmsApiDesc: i18nBrand('llms.api.description'),
	llmsPricingDesc: i18nBrand('llms.pricing.description'),
};

const texts = (locale: string) => createI18nTranslator(locale, {
	overrides: locale === 'nl_NL' ? {[k.title]: 'Prijzen <beste> & "goedkoop"', [k.siteName]: 'Voorbeeld'} : {},
	defaults: {
		[k.title]: 'Pricing', [k.description]: 'Plans for {who}', [k.heading]: 'Plans', [k.body]: 'Pick one.',
		[k.org]: 'We </script><script>alert(1)</script>', [k.siteName]: 'Example', [k.publisher]: 'Example Org',
		[k.imageAlt]: 'Share image', [k.logoAlt]: 'Logo', [k.pageImageAlt]: 'Page image', [k.crumb]: 'Home',
		[k.llmsTitle]: 'Example', [k.llmsSummary]: 'Example\nsummary.',
		[k.llmsDetail]: 'More details.', [k.llmsDocs]: 'Docs', [k.llmsApi]: 'API [v1]', [k.llmsApiDesc]: 'The API.', [k.llmsPricingDesc]: 'Prices.',
	},
}).t;

const image = (alt: SeoImage['alt'], src = '/og.png'): SeoImage => ({src, type: 'image/png', width: 1200, height: 630, alt});

const llms: LlmsTxtDef = {
	title: k.llmsTitle, summary: k.llmsSummary, details: [k.llmsDetail],
	sections: [{title: k.llmsDocs, links: [{page: 'pricing', description: k.llmsPricingDesc}, {url: 'https://example.com/api docs', title: k.llmsApi, description: k.llmsApiDesc}]}],
};

const site: SeoSiteDef = {
	key: 'calendar-booking',
	siteName: k.siteName,
	origins: {local: 'http://localhost:5173/', prod: 'https://example.com'},
	publisher: {name: k.publisher, url: '/', logo: image(k.logoAlt, '/logo.png'), sameAs: ['https://example.com/about']},
	image: image(k.imageAlt),
	themeColor: '#0f766e',
	colorScheme: 'light dark',
	icons: {
		favicon: {src: '/favicon.ico', type: 'image/x-icon', sizes: '32x32'},
		appleTouch: {src: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180'},
		manifest: [{src: '/icon-512.png', type: 'image/png', sizes: '512x512'}],
	},
	twitter: {card: 'summary_large_image', site: '@example'},
	enabledLocales: ['en_US', 'nl_NL', 'he_IL'],
	defaultLocale: 'en_US',
	llms,
};

const pricing: SeoPageDef = {
	key: 'pricing', path: '/pricing', title: k.title, description: k.description, ogType: 'website',
	sections: [{heading: k.heading, body: k.body}], mounts: ['pricing-table'],
	jsonLd: [seoJsonLdOrganization, seoJsonLdWebPage, ({t, url}) => ({'@type': 'WebPage', url, description: t(k.org)})],
};

const shell = (locale: I18nLocaleCode, page: SeoPageDef = pricing, origin = 'https://example.com') => renderSeoShell({
	site, page, t: texts(locale), locale, origin, bundle: {scripts: ['/app.js'], styles: ['/app.css']},
});

describe('seo - locale URLs', () => {
	it('maps enum codes to segments and back (enabled only)', () => {
		expect(localizedPath('en_US', '/pricing')).to.equal('/en-us/pricing');
		expect(localizedPath('nl_NL', '/')).to.equal('/nl-nl/');
		expect(localeFromUrlSegment('EN-US', ['en_US', 'nl_NL'])).to.equal('en_US');
		expect(localeFromUrlSegment('nl-nl', ['en_US', 'nl_NL'])).to.equal('nl_NL');
		expect(localeFromUrlSegment('nl', ['en_US', 'nl_NL'])).to.equal(undefined);
		expect(localeFromUrlSegment('de-de', ['en_US', 'nl_NL'])).to.equal(undefined);
		expect(localeFromUrlSegment('ab-cd', ['ab_CD'])).to.equal(undefined);
	});

	it('resolves the origin for the active env', () => {
		expect(siteOrigin(site.origins, 'prod', site.key)).to.equal('https://example.com');
		expect(siteOrigin(site.origins, 'local', site.key)).to.equal('http://localhost:5173');
		expect(() => siteOrigin(site.origins, 'dev', site.key)).to.throw(/dev/);
	});
});

describe('seo - site config', () => {
	it('accepts a site whose locales are in the i18n enum', () => {
		expect(() => assertSeoSite(site)).to.not.throw();
		expect(() => assertSeoPages([pricing])).to.not.throw();
		expect(() => assertSeoLinks(site, [pricing])).to.not.throw();
	});

	it('rejects text, a non-enum locale, the wrong share size, and a path origin', () => {
		expect(() => assertSeoSite({...site, siteName: 'Example' as typeof k.siteName})).to.throw(/i18n key/);
		expect(() => assertSeoSite({...site, enabledLocales: ['nl' as I18nLocaleCode], defaultLocale: 'nl' as I18nLocaleCode})).to.throw(/locale enum/);
		expect(() => assertSeoSite({...site, enabledLocales: ['en_US', 'en_US']})).to.throw(/twice/);
		expect(() => assertSeoSite({...site, defaultLocale: 'de_DE'})).to.throw(/not enabled/);
		expect(() => assertSeoSite({...site, image: {...site.image, width: 800, height: 400}})).to.throw(/1200x630/);
		expect(() => assertSeoSite({...site, origins: {prod: 'https://example.com/app'}})).to.throw(/origin/);
		expect(() => assertSeoSite({...site, twitter: {card: 'summary_large_image', site: 'example'}})).to.throw(/@handle/);
		expect(() => assertSeoPages([{...pricing, path: '/en-us/pricing'}])).to.throw(/locale segment/);
		expect(() => assertSeoLinks(site, [])).to.throw(/unknown page/);
	});
});

describe('seo - HTML shell', () => {
	it('renders head share meta, icons, and hreflang from i18n keys', () => {
		const html = shell('en_US');
		expect(html).to.contain('<html lang="en-US" dir="ltr">');
		expect(html).to.contain('<title>Pricing</title>');
		expect(html).to.contain('<meta name="description" content="Plans for {who}">');
		expect(html).to.contain('<meta name="robots" content="index,follow">');
		expect(html).to.contain('<meta name="theme-color" content="#0f766e">');
		expect(html).to.contain('<meta name="color-scheme" content="light dark">');
		expect(html).to.contain('<link rel="canonical" href="https://example.com/en-us/pricing">');
		expect(html).to.contain('<link rel="alternate" hreflang="nl-NL" href="https://example.com/nl-nl/pricing">');
		expect(html).to.contain('<link rel="alternate" hreflang="he-IL" href="https://example.com/he-il/pricing">');
		expect(html).to.contain('<link rel="alternate" hreflang="x-default" href="https://example.com/en-us/pricing">');
		expect(html).to.contain('<meta property="og:site_name" content="Example">');
		expect(html).to.contain('<meta property="og:locale" content="en_US">');
		expect(html).to.contain('<meta property="og:locale:alternate" content="nl_NL">');
		expect(html).to.contain('<meta property="og:image" content="https://example.com/og.png">');
		expect(html).to.contain('<meta property="og:image:secure_url" content="https://example.com/og.png">');
		expect(html).to.contain('<meta property="og:image:type" content="image/png">');
		expect(html).to.contain('<meta property="og:image:width" content="1200">');
		expect(html).to.contain('<meta property="og:image:height" content="630">');
		expect(html).to.contain('<meta property="og:image:alt" content="Share image">');
		expect(html).to.contain('<meta name="twitter:card" content="summary_large_image">');
		expect(html).to.contain('<meta name="twitter:site" content="@example">');
		expect(html).to.contain('<link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="32x32">');
		expect(html).to.contain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">');
		expect(html).to.contain('<link rel="manifest" href="/site.webmanifest">');
		expect(html).to.contain('<section><h2>Plans</h2><p>Pick one.</p></section>');
		expect(html).to.contain('<div data-ts-embed="pricing-table"></div>');
		expect(html).to.contain('<script type="module" src="/app.js"></script>');
	});

	it('uses a page image and omits secure_url on an http origin', () => {
		const page = {...pricing, image: image(k.pageImageAlt, '/page.png')};
		const html = shell('en_US', page, 'http://localhost:5173');
		expect(html).to.contain('<meta property="og:image" content="http://localhost:5173/page.png">');
		expect(html).to.contain('<meta property="og:image:alt" content="Page image">');
		expect(html).to.not.contain('og:image:secure_url');
	});

	it('overrides win and every text is escaped', () => {
		const html = shell('nl_NL');
		expect(html).to.contain('<title>Prijzen &lt;beste&gt; &amp; &quot;goedkoop&quot;</title>');
		expect(html).to.contain('<meta property="og:title" content="Prijzen &lt;beste&gt; &amp; &quot;goedkoop&quot;">');
		expect(html).to.contain('<meta property="og:site_name" content="Voorbeeld">');
		expect(html).to.not.contain('<beste>');
	});

	it('JSON-LD cannot close its script tag', () => {
		const html = shell('en_US');
		const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(match => match[1]);
		expect(scripts.length).to.equal(3);
		expect(scripts.every(script => !script.includes('<'))).to.equal(true);
		const nodes = scripts.map(script => JSON.parse(script));
		expect(nodes[0]).to.include({'@type': 'Organization', name: 'Example Org', logo: 'https://example.com/logo.png'});
		expect(nodes[2]).to.deep.equal({'@context': 'https://schema.org', '@type': 'WebPage', url: 'https://example.com/en-us/pricing', description: 'We </script><script>alert(1)</script>'});
		expect(jsonForScript('\u2028')).to.equal('"\\u2028"');
	});

	it('builds a breadcrumb list and a website node from i18n keys', () => {
		const context = {t: texts('en_US'), locale: 'en_US' as const, url: 'https://example.com/en-us/pricing', origin: 'https://example.com', site, page: pricing};
		const node = seoJsonLdBreadcrumb([{name: k.crumb, path: '/'}, {name: k.title, path: '/pricing'}])(context);
		expect(node.itemListElement).to.deep.equal([
			{'@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com/en-us/'},
			{'@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://example.com/en-us/pricing'},
		]);
		expect(seoJsonLdWebSite(context)).to.include({'@type': 'WebSite', name: 'Example', url: 'https://example.com'});
	});

	it('RTL locales get dir=rtl; noindex pages say so; a locale outside the site is refused', () => {
		expect(shell('he_IL')).to.contain('<html lang="he-IL" dir="rtl">');
		expect(shell('en_US', {...pricing, noindex: true})).to.contain('<meta name="robots" content="noindex,nofollow">');
		expect(() => shell('de_DE')).to.throw(/not enabled/);
	});
});

describe('seo - files', () => {
	const hidden: SeoPageDef = {key: 'hidden', path: '/hidden', title: k.title, description: k.description, sitemap: false};
	const secret: SeoPageDef = {key: 'secret', path: '/secret', title: k.title, description: k.description, noindex: true};
	const pages = [pricing, hidden, secret];

	it('sitemap lists indexable pages with hreflang and x-default', () => {
		const xml = renderSitemapXml(site, 'https://example.com', pages);
		expect(xml).to.contain('<loc>https://example.com/nl-nl/pricing</loc>');
		expect(xml).to.contain('hreflang="he-IL" href="https://example.com/he-il/pricing"');
		expect(xml).to.contain('hreflang="x-default" href="https://example.com/en-us/pricing"');
		expect(xml).to.not.contain('/hidden');
		expect(xml).to.not.contain('/secret');
	});

	it('robots.txt disallows noindex routes and points at the sitemap', () => {
		expect(renderRobotsTxt(site, 'https://example.com', pages)).to.equal([
			'User-agent: *',
			'Disallow: /en-us/secret',
			'Disallow: /nl-nl/secret',
			'Disallow: /he-il/secret',
			'Sitemap: https://example.com/sitemap.xml',
			'',
		].join('\n'));
	});

	it('webmanifest uses the translated site name, theme, and default locale direction', () => {
		const manifest = JSON.parse(renderWebManifest(site, texts('en_US')));
		expect(manifest).to.include({name: 'Example', theme_color: '#0f766e', lang: 'en-US', dir: 'ltr', start_url: '/en-us/'});
		expect(manifest.icons).to.deep.equal([{src: '/icon-512.png', sizes: '512x512', type: 'image/png'}]);
		expect(JSON.parse(renderWebManifest({...site, defaultLocale: 'he_IL'}, texts('he_IL'))).dir).to.equal('rtl');
	});
});

describe('seo - llms.txt', () => {
	it('renders llmstxt.org structure from i18n, per locale', () => {
		expect(renderLlmsTxt({def: llms, t: texts('nl_NL'), locale: 'nl_NL', origin: 'https://example.com', pages: [pricing]})).to.equal([
			'# Example', '', '> Example summary.', '', 'More details.', '', '## Docs', '',
			'- [Prijzen <beste> & "goedkoop"](https://example.com/nl-nl/pricing): Prices.',
			'- [API \\[v1\\]](https://example.com/api%20docs): The API.', '',
		].join('\n'));
	});

	it('refuses links to unknown pages', () => {
		const bad: LlmsTxtDef = {...llms, sections: [{title: k.llmsDocs, links: [{page: 'nope'}]}]};
		expect(() => renderLlmsTxt({def: bad, t: texts('en_US'), locale: 'en_US', origin: 'https://example.com', pages: [pricing]})).to.throw();
	});

	it('lists every key the definitions use', () => {
		expect(seoKeys(site, [pricing])).to.have.members([
			k.siteName, k.publisher, k.imageAlt, k.logoAlt, k.title, k.description, k.heading, k.body,
			k.llmsTitle, k.llmsSummary, k.llmsDetail, k.llmsDocs, k.llmsApi, k.llmsApiDesc, k.llmsPricingDesc,
		]);
	});
});
