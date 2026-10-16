/*
 * @nu-art/seo-backend - Per-locale HTML shells and SEO files through the i18n translator
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import request from 'supertest';
import {HttpServer} from '@nu-art/http-server';
import {createI18nTranslator, i18nBrand} from '@nu-art/i18n-shared';
import type {SeoPageDef, SeoSiteDef} from '@nu-art/seo-shared';
import {ModuleBE_SEO_Class, parseAcceptLanguage} from '../main/ModuleBE_SEO.js';
import type {SeoTextsSource} from '../main/texts-source.js';

const title = i18nBrand('seo.home.title');
const description = i18nBrand('seo.home.description');
const siteName = i18nBrand('seo.site.name');
const publisher = i18nBrand('seo.publisher.name');
const imageAlt = i18nBrand('seo.image.alt');
const llmsTitle = i18nBrand('llms.title');
const llmsSummary = i18nBrand('llms.summary');
const llmsSection = i18nBrand('llms.section');

const image = {src: '/og.png', type: 'image/png' as const, width: 1200, height: 630, alt: imageAlt};

const site: SeoSiteDef = {
	key: 'calendar-booking',
	hosts: ['example.com'],
	siteName,
	origins: {local: 'http://localhost:5173', prod: 'https://example.com'},
	publisher: {name: publisher},
	image,
	themeColor: '#0f766e',
	colorScheme: 'light dark',
	icons: {
		favicon: {src: '/favicon.ico', type: 'image/x-icon', sizes: '32x32'},
		appleTouch: {src: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180'},
		manifest: [{src: '/icon-512.png', type: 'image/png', sizes: '512x512'}],
	},
	twitter: {card: 'summary_large_image'},
	enabledLocales: ['en_US', 'nl_NL'],
	defaultLocale: 'en_US',
	llms: {title: llmsTitle, summary: llmsSummary, sections: [{title: llmsSection, links: [{page: 'home'}, {page: 'about'}]}]},
};

const other: SeoSiteDef = {...site, key: 'other', hosts: ['*.other.example'], llms: undefined};

class FakeTexts
	implements SeoTextsSource {
	reads: string[] = [];

	async translator(locale: string) {
		this.reads.push(locale);
		return createI18nTranslator(locale, {
			overrides: {},
			defaults: locale === 'nl_NL'
				? {[title]: 'Welkom', [description]: 'Boek snel', [siteName]: 'Voorbeeld', [publisher]: 'Org', [imageAlt]: 'Deel', [llmsTitle]: 'Voorbeeld', [llmsSummary]: 'Kort.', [llmsSection]: 'Pagina\'s'}
				: {[title]: 'Welcome', [description]: 'Book fast', [siteName]: 'Example', [publisher]: 'Org', [imageAlt]: 'Share', [llmsTitle]: 'Example', [llmsSummary]: 'Short.', [llmsSection]: 'Pages'},
		}).t;
	}
}

const home: SeoPageDef = {key: 'home', path: '/', title, description};
const about: SeoPageDef = {key: 'about', path: '/about', title, description};
const secret: SeoPageDef = {key: 'secret', path: '/secret', title, description, noindex: true};
const quiet: SeoPageDef = {key: 'quiet', path: '/quiet', title, description, sitemap: false};
const booking: SeoPageDef = {
	key: 'booking', path: '/book', title, description,
	resolve: request => request.query.slug ? {path: `/book?slug=${request.query.slug}`, params: {host: request.query.slug}} : undefined,
};
const hostPage: SeoPageDef = {key: 'host', path: '/h/:slug', title, description};

const createSeo = () => {
	const seo = new ModuleBE_SEO_Class();
	const texts = new FakeTexts();
	seo.setTextsSource(texts);
	seo.setDefaultConfig({
		env: 'prod', cacheMaxAgeSec: 300, rootRedirect: true,
		bundles: {
			'calendar-booking': {scripts: ['/app.js'], styles: []},
			other: {scripts: [], styles: []},
		},
	});
	seo.registerSite(site, [home, about, secret, quiet, booking, hostPage]);
	seo.registerSite(other, [{key: 'other-home', path: '/', title, description}]);
	return {seo, texts};
};

describe('ModuleBE_SEO - rendering', () => {
	it('renders a page in the URL locale; unknown or disabled locales are 404', async () => {
		const {seo, texts} = createSeo();
		const page = await seo.renderPage('nl-nl', '/about', 'example.com');
		expect(page.status).to.equal(200);
		expect(page.body).to.contain('<title>Welkom</title>');
		expect(page.body).to.contain('<link rel="canonical" href="https://example.com/nl-nl/about">');
		expect(page.body).to.contain('og:image:secure_url');
		expect(page.headers['content-language']).to.equal('nl-NL');
		expect(texts.reads).to.deep.equal(['nl_NL']);
		expect((await seo.renderPage('de-de', '/about', 'example.com')).status).to.equal(404);
		expect((await seo.renderPage('nl', '/about', 'example.com')).status).to.equal(404);
	});

	it('serves robots, sitemap, and the manifest for the active site', async () => {
		const {seo, texts} = createSeo();
		const robots = seo.renderRobots('example.com');
		expect(robots.body).to.contain('Disallow: /nl-nl/secret');
		expect(robots.body).to.contain('Sitemap: https://example.com/sitemap.xml');
		expect(robots.body).to.not.contain('/quiet');
		const sitemap = await seo.renderSitemap('example.com');
		expect(sitemap.body).to.contain('<loc>https://example.com/en-us/about</loc>');
		expect(sitemap.body).to.contain('hreflang="nl-NL"');
		expect(sitemap.body).to.contain('hreflang="x-default"');
		expect(sitemap.body).to.not.contain('/secret');
		expect(sitemap.body).to.not.contain('/quiet');
		const manifest = await seo.renderManifest('example.com');
		expect(JSON.parse(manifest.body)).to.include({name: 'Example', lang: 'en-US', theme_color: '#0f766e'});
		expect(texts.reads).to.deep.equal(['en_US']);
	});

	it('llms.txt per locale, via lang param, default otherwise', async () => {
		const {seo} = createSeo();
		expect((await seo.renderLlms('nl-nl', undefined, 'example.com')).body).to.contain('# Voorbeeld');
		expect((await seo.renderLlms(undefined, 'nl-NL', 'example.com')).body).to.contain('- [Welkom](https://example.com/nl-nl/about)');
		expect((await seo.renderLlms(undefined, 'xx', 'example.com')).body).to.contain('# Example');
		expect((await seo.renderLlms('fr-fr', undefined, 'example.com')).status).to.equal(404);
		expect((await seo.renderLlms(undefined, 'en', 'acme.other.example')).status).to.equal(404);
	});

	it('root redirect uses lang, then Accept-Language, then the default, and sets no cookie', async () => {
		const {seo} = createSeo();
		const chosen = await seo.redirectToLocale('nl-NL', undefined, 'example.com');
		expect(chosen.headers.location).to.equal('/nl-nl/');
		expect(chosen.headers).to.not.have.property('set-cookie');
		expect((await seo.redirectToLocale(undefined, 'de;q=1,nl;q=0.8', 'example.com')).headers.location).to.equal('/nl-nl/');
		expect((await seo.redirectToLocale(undefined, 'fr', 'example.com')).headers.location).to.equal('/en-us/');
	});

	it('refuses a duplicate site, a page on another site, and a missing origin', async () => {
		const {seo} = createSeo();
		expect(() => seo.registerSite(site, [home, about, secret, quiet])).to.throw(/Duplicate/);
		expect(() => seo.registerSite({...site, key: 'bad-links', hosts: ['bad.example'], llms: site.llms}, [])).to.throw(/unknown page/);
		expect((await seo.renderPage('en-us', '/', 'acme.other.example')).body).to.contain('<title>Welcome</title>');
		expect((await seo.renderPage('en-us', '/about', 'acme.other.example')).status).to.equal(404);
		expect((await seo.renderPage('en-us', '/', 'missing.example')).status).to.equal(404);
		seo.setDefaultConfig({env: 'staging'});
		expect(() => seo.renderRobots('example.com')).to.throw(/staging/);
	});

	it('parses Accept-Language by q', () => {
		expect(parseAcceptLanguage('en;q=0.5, nl-BE, *;q=0.1, de;q=0')).to.deep.equal(['nl-BE', 'en']);
		expect(parseAcceptLanguage(undefined)).to.deep.equal([]);
	});
});

describe('ModuleBE_SEO - routes', () => {
	it('serves shells, SEO files, llms.txt, and the root redirect over HTTP without cookies', async () => {
		const server = new HttpServer({tag: 'seo-test', port: 0, baseUrl: '', cors: {headers: [], responseHeaders: []}} as never);
		await server.init();
		const {seo} = createSeo();
		seo.setHttpServer(() => server);
		(seo as unknown as {init(): void}).init();
		const app = server.getExpress();

		const shell = await request(app).get('/nl-nl/about').set('X-Forwarded-Host', 'example.com').expect(200);
		expect(shell.headers['content-type']).to.contain('text/html');
		expect(shell.headers['set-cookie']).to.equal(undefined);
		expect(shell.text).to.contain('<link rel="canonical" href="https://example.com/nl-nl/about">');

		const root = await request(app).get('/en-us').set('X-Forwarded-Host', 'example.com').expect(200);
		expect(root.text).to.contain('<title>Welcome</title>');
		expect(root.text).to.contain('<link rel="manifest" href="/site.webmanifest">');

		await request(app).get('/de-de/about').set('X-Forwarded-Host', 'example.com').expect(404);
		await request(app).get('/en-us/about').set('X-Forwarded-Host', 'nope.example').expect(404);

		const robots = await request(app).get('/robots.txt').set('X-Forwarded-Host', 'example.com').expect(200);
		expect(robots.headers['content-type']).to.contain('text/plain');
		expect(robots.text).to.contain('Sitemap: https://example.com/sitemap.xml');

		const sitemap = await request(app).get('/sitemap.xml').set('X-Forwarded-Host', 'example.com').expect(200);
		expect(sitemap.headers['content-type']).to.contain('application/xml');
		expect(sitemap.text).to.contain('hreflang="x-default"');

		const manifest = await request(app).get('/site.webmanifest').set('X-Forwarded-Host', 'example.com').expect(200);
		expect(manifest.headers['content-type']).to.contain('application/manifest+json');
		expect(JSON.parse(manifest.text).name).to.equal('Example');

		const llms = await request(app).get('/llms.txt?lang=nl').set('X-Forwarded-Host', 'example.com').expect(200);
		expect(llms.headers['content-type']).to.contain('text/plain');
		expect(llms.text).to.contain('# Voorbeeld');
		expect((await request(app).get('/nl-nl/llms.txt').set('X-Forwarded-Host', 'example.com').expect(200)).text).to.contain('## Pagina\'s');

		const redirect = await request(app).get('/').set('X-Forwarded-Host', 'example.com').set('Accept-Language', 'nl').expect(302);
		expect(redirect.headers.location).to.equal('/nl-nl/');
		expect(redirect.headers['set-cookie']).to.equal(undefined);
		expect(shell.headers.vary).to.contain('X-Forwarded-Host');

		const booked = await request(app).get('/en-us/book?slug=ada').set('X-Forwarded-Host', 'example.com').expect(200);
		expect(booked.text).to.contain('<link rel="canonical" href="https://example.com/en-us/book?slug=ada">');
		expect(booked.text).to.contain('<meta property="og:image:width" content="1200">');
		expect(booked.text).to.contain('<meta property="og:image:height" content="630">');
		await request(app).get('/en-us/book').set('X-Forwarded-Host', 'example.com').expect(404);

		const host = await request(app).get('/en-us/h/ada').set('X-Forwarded-Host', 'example.com').expect(200);
		expect(host.text).to.contain('<link rel="canonical" href="https://example.com/en-us/h/ada">');
		expect(host.headers['set-cookie']).to.equal(undefined);
	});
});
