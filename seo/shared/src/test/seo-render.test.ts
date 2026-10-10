import {expect} from 'chai';
import {createI18nTranslator, i18nBrand} from '@nu-art/i18n-shared';
import {
	jsonForScript,
	localeFromUrlSegment,
	localizedPath,
	renderLlmsTxt,
	renderSeoShell,
	seoKeys,
	type LlmsTxtDef,
	type SeoPageDef
} from '../main/index.js';

const k = {
	title: i18nBrand('seo.pricing.title'),
	description: i18nBrand('seo.pricing.description'),
	heading: i18nBrand('seo.pricing.heading'),
	body: i18nBrand('seo.pricing.body'),
	org: i18nBrand('seo.org.description'),
	llmsTitle: i18nBrand('llms.title'),
	llmsSummary: i18nBrand('llms.summary'),
	llmsDetail: i18nBrand('llms.detail'),
	llmsDocs: i18nBrand('llms.docs'),
	llmsApi: i18nBrand('llms.api'),
	llmsApiDesc: i18nBrand('llms.api.description'),
	llmsPricingDesc: i18nBrand('llms.pricing.description'),
};

const texts = (locale: string) => createI18nTranslator(locale, {
	overrides: locale === 'nl' ? {[k.title]: {other: 'Prijzen <beste> & "goedkoop"'}} : {},
	defaults: {
		[k.title]: 'Pricing', [k.description]: 'Plans for {who}', [k.heading]: 'Plans', [k.body]: 'Pick one.',
		[k.org]: 'We </script><script>alert(1)</script>', [k.llmsTitle]: 'Example', [k.llmsSummary]: 'Example\nsummary.',
		[k.llmsDetail]: 'More details.', [k.llmsDocs]: 'Docs', [k.llmsApi]: 'API [v1]', [k.llmsApiDesc]: 'The API.', [k.llmsPricingDesc]: 'Prices.',
	},
}).t;

const pricing: SeoPageDef = {
	key: 'pricing', path: '/pricing', title: k.title, description: k.description, ogImage: '/og.png',
	sections: [{heading: k.heading, body: k.body}], mounts: ['pricing-table'],
	jsonLd: ({t, url}) => ({'@type': 'Organization', url, description: t(k.org)}),
};

const shell = (locale: string, page = pricing) => renderSeoShell({
	page, t: texts(locale), locale, locales: ['en_US', 'nl', 'he'], defaultLocale: 'en_US',
	baseUrl: 'https://example.com/', bundle: {scripts: ['/app.js'], styles: ['/app.css']}, siteName: 'Example',
});

describe('seo - locale URLs', () => {
	it('maps codes to segments and back (enabled only)', () => {
		expect(localizedPath('en_US', '/pricing')).to.equal('/en-us/pricing');
		expect(localizedPath('nl', '/')).to.equal('/nl/');
		expect(localeFromUrlSegment('EN-US', ['en_US', 'nl'])).to.equal('en_US');
		expect(localeFromUrlSegment('de', ['en_US', 'nl'])).to.equal(undefined);
	});
});

describe('seo - HTML shell', () => {
	it('title, description, canonical, hreflang (+x-default), OG and twitter, all from i18n', () => {
		const html = shell('en_US');
		expect(html).to.contain('<html lang="en-US" dir="ltr">');
		expect(html).to.contain('<title>Pricing</title>');
		expect(html).to.contain('<meta name="description" content="Plans for {who}">');
		expect(html).to.contain('<link rel="canonical" href="https://example.com/en-us/pricing">');
		expect(html).to.contain('<link rel="alternate" hreflang="nl" href="https://example.com/nl/pricing">');
		expect(html).to.contain('<link rel="alternate" hreflang="he" href="https://example.com/he/pricing">');
		expect(html).to.contain('<link rel="alternate" hreflang="x-default" href="https://example.com/en-us/pricing">');
		expect(html).to.contain('<meta property="og:image" content="https://example.com/og.png">');
		expect(html).to.contain('<meta property="og:locale" content="en_US">');
		expect(html).to.contain('<meta name="twitter:card" content="summary_large_image">');
		expect(html).to.contain('<section><h2>Plans</h2><p>Pick one.</p></section>');
		expect(html).to.contain('<div data-ts-embed="pricing-table"></div>');
		expect(html).to.contain('<script type="module" src="/app.js"></script>');
	});

	it('overrides win (single resolution path) and every text is escaped', () => {
		const html = shell('nl');
		expect(html).to.contain('<title>Prijzen &lt;beste&gt; &amp; &quot;goedkoop&quot;</title>');
		expect(html).to.contain('<meta property="og:title" content="Prijzen &lt;beste&gt; &amp; &quot;goedkoop&quot;">');
		expect(html).to.not.contain('<beste>');
	});

	it('JSON-LD cannot close its script tag', () => {
		const html = shell('en_US');
		const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1];
		expect(ld).to.not.contain('<');
		expect(JSON.parse(ld)).to.deep.equal({'@context': 'https://schema.org', '@type': 'Organization', url: 'https://example.com/en-us/pricing', description: 'We </script><script>alert(1)</script>'});
		expect(jsonForScript('\u2028')).to.equal('"\\u2028"');
	});

	it('RTL locales get dir=rtl; noindex pages say so; unknown locales are refused', () => {
		expect(shell('he')).to.contain('<html lang="he" dir="rtl">');
		expect(shell('en_US', {...pricing, noindex: true})).to.contain('<meta name="robots" content="noindex">');
		expect(() => shell('de')).to.throw();
	});
});

describe('seo - llms.txt', () => {
	const def: LlmsTxtDef = {
		title: k.llmsTitle, summary: k.llmsSummary, details: [k.llmsDetail],
		sections: [{title: k.llmsDocs, links: [{page: 'pricing', description: k.llmsPricingDesc}, {url: 'https://example.com/api docs', title: k.llmsApi, description: k.llmsApiDesc}]}],
	};

	it('renders llmstxt.org structure from i18n, per locale', () => {
		expect(renderLlmsTxt({def, t: texts('nl'), locale: 'nl', baseUrl: 'https://example.com', pages: [pricing]})).to.equal([
			'# Example', '', '> Example summary.', '', 'More details.', '', '## Docs', '',
			'- [Prijzen <beste> & "goedkoop"](https://example.com/nl/pricing): Prices.',
			'- [API \\[v1\\]](https://example.com/api%20docs): The API.', '',
		].join('\n'));
	});

	it('refuses links to unknown pages', () => {
		const bad: LlmsTxtDef = {...def, sections: [{title: k.llmsDocs, links: [{page: 'nope'}]}]};
		expect(() => renderLlmsTxt({def: bad, t: texts('en_US'), locale: 'en_US', baseUrl: 'https://example.com', pages: [pricing]})).to.throw();
	});

	it('lists every key the definitions use', () => {
		expect(seoKeys([pricing], def)).to.have.members([k.title, k.description, k.heading, k.body, k.llmsTitle, k.llmsSummary, k.llmsDetail, k.llmsDocs, k.llmsApi, k.llmsApiDesc, k.llmsPricingDesc]);
	});
});
