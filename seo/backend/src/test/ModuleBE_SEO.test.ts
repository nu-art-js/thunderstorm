import {expect} from 'chai';
import request from 'supertest';
import {HttpServer} from '@nu-art/http-server';
import {createI18nTranslator, i18nBrand} from '@nu-art/i18n-shared';
import type {SeoPageDef} from '@nu-art/seo-shared';
import {ModuleBE_SEO_Class, parseAcceptLanguage} from '../main/ModuleBE_SEO.js';
import type {SeoTextsSource} from '../main/texts-source.js';

const title = i18nBrand('seo.home.title');
const description = i18nBrand('seo.home.description');
const llmsTitle = i18nBrand('llms.title');
const llmsSummary = i18nBrand('llms.summary');
const llmsSection = i18nBrand('llms.section');

class FakeTexts
	implements SeoTextsSource {
	reads: string[] = [];

	async enabledLocales() {
		return ['en_US', 'nl'];
	}

	async translator(locale: string) {
		this.reads.push(locale);
		return createI18nTranslator(locale, {
			overrides: {},
			defaults: locale === 'nl'
				? {[title]: 'Welkom', [description]: 'Boek snel', [llmsTitle]: 'Voorbeeld', [llmsSummary]: 'Kort.', [llmsSection]: 'Pagina\'s'}
				: {[title]: 'Welcome', [description]: 'Book fast', [llmsTitle]: 'Example', [llmsSummary]: 'Short.', [llmsSection]: 'Pages'},
		}).t;
	}
}

const home: SeoPageDef = {key: 'home', path: '/', title, description};
const about: SeoPageDef = {key: 'about', path: '/about', title, description};

const createSeo = () => {
	const seo = new ModuleBE_SEO_Class();
	const texts = new FakeTexts();
	seo.setTextsSource(texts);
	seo.setDefaultConfig({baseUrl: 'https://example.com', defaultLocale: 'en_US', bundle: {scripts: ['/app.js'], styles: []}, cacheMaxAgeSec: 300, rootRedirect: true});
	seo.registerPages(home, about);
	seo.setLlmsTxt({title: llmsTitle, summary: llmsSummary, sections: [{title: llmsSection, links: [{page: 'home'}, {page: 'about'}]}]});
	return {seo, texts};
};

describe('ModuleBE_SEO - rendering', () => {
	it('renders a page in the URL locale; unknown or disabled locales are 404', async () => {
		const {seo} = createSeo();
		const page = await seo.renderPage('nl', 'about');
		expect(page.status).to.equal(200);
		expect(page.body).to.contain('<title>Welkom</title>');
		expect(page.headers['content-language']).to.equal('nl');
		expect((await seo.renderPage('de', 'about')).status).to.equal(404);
	});

	it('llms.txt per locale, via lang param, default otherwise', async () => {
		const {seo} = createSeo();
		expect((await seo.renderLlms('nl')).body).to.contain('# Voorbeeld');
		expect((await seo.renderLlms(undefined, 'nl-NL')).body).to.contain('- [Welkom](https://example.com/nl/about)');
		expect((await seo.renderLlms(undefined, 'xx')).body).to.contain('# Example');
	});

	it('root redirect: lang param, then Accept-Language, then default', async () => {
		const {seo} = createSeo();
		expect((await seo.redirectToLocale('nl')).headers.location).to.equal('/nl/');
		expect((await seo.redirectToLocale(undefined, 'de;q=1,nl-BE;q=0.8')).headers.location).to.equal('/nl/');
		expect((await seo.redirectToLocale(undefined, 'fr')).headers.location).to.equal('/en-us/');
	});

	it('refuses duplicate pages', () => {
		const {seo} = createSeo();
		expect(() => seo.registerPages({...home, key: 'home2'})).to.throw();
	});

	it('parses Accept-Language by q', () => {
		expect(parseAcceptLanguage('en;q=0.5, nl-BE, *;q=0.1, de;q=0')).to.deep.equal(['nl-BE', 'en']);
		expect(parseAcceptLanguage(undefined)).to.deep.equal([]);
	});
});

describe('ModuleBE_SEO - routes', () => {
	it('serves shells, llms.txt and the root redirect over HTTP', async () => {
		const server = new HttpServer({tag: 'seo-test', port: 0, baseUrl: '', cors: {headers: [], responseHeaders: []}} as never);
		await server.init();
		const {seo} = createSeo();
		seo.setHttpServer(() => server);
		(seo as unknown as { init(): void }).init();
		const app = server.getExpress();

		const shell = await request(app).get('/nl/about').expect(200);
		expect(shell.headers['content-type']).to.contain('text/html');
		expect(shell.text).to.contain('<link rel="canonical" href="https://example.com/nl/about">');

		const root = await request(app).get('/en-us').expect(200);
		expect(root.text).to.contain('<title>Welcome</title>');

		await request(app).get('/de/about').expect(404);

		const llms = await request(app).get('/llms.txt?lang=nl').expect(200);
		expect(llms.headers['content-type']).to.contain('text/plain');
		expect(llms.text).to.contain('# Voorbeeld');
		expect((await request(app).get('/nl/llms.txt').expect(200)).text).to.contain('## Pagina\'s');

		const redirect = await request(app).get('/').set('Accept-Language', 'nl').expect(302);
		expect(redirect.headers.location).to.equal('/nl/');
	});
});
