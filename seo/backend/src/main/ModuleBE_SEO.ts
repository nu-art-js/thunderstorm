/*
 * @nu-art/seo-backend - Per-locale HTML shells and SEO files through the i18n translator
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {_ServerQueryApi, HttpServer, MemKey_HttpRequest, MemKey_HttpResponse} from '@nu-art/http-server';
import {detectLocale, resolveRequestLocale} from '@nu-art/i18n-shared';
import {
	assertSeoLinks,
	assertSeoPages,
	assertSeoSite,
	localeFromUrlSegment,
	localeLanguageTag,
	localizedPath,
	renderLlmsTxt,
	renderRobotsTxt,
	renderSeoShell,
	renderSitemapXml,
	renderWebManifest,
	siteOrigin,
	type SeoBundle,
	type SeoPageDef,
	type SeoSiteDef,
} from '@nu-art/seo-shared';
import {BadImplementationException, ImplementationMissingException, Module} from '@nu-art/ts-common';
import type {SeoTextsSource} from './texts-source.js';

type Config = {
	/** Env key whose origin the site def declares (`local`, `dev`, `prod`). */
	env: string;
	/** Registered site to serve. */
	site: string;
	bundle: SeoBundle;
	/** Seconds browsers and the CDN may cache a shell or SEO file. */
	cacheMaxAgeSec: number;
	/** Serve `/` as a redirect to the visitor's locale (lang param, then Accept-Language, then the site default). */
	rootRedirect: boolean;
};

export type SeoResponse = {status: number; body: string; contentType: string; headers: Record<string, string>};

/**
 * HTML shells and SEO files for one registered site.
 * Locales are the site's `enabledLocales` (i18n locale enum). Nothing is read from or written to the database,
 * and locale is never stored in a cookie.
 *
 * Register the site and its pages before init. Routes:
 * `/<locale><path>`, `/robots.txt`, `/sitemap.xml`, `/site.webmanifest`,
 * `/llms.txt?lang=` and `/<locale>/llms.txt` when the site defines llms.txt,
 * and `/` when `rootRedirect` is on.
 */
export class ModuleBE_SEO_Class
	extends Module<Config> {

	private readonly sites = new Map<string, SeoSiteDef>();
	private readonly pages = new Map<string, SeoPageDef[]>();
	private texts?: SeoTextsSource;
	private server: () => HttpServer = () => HttpServer.getDefault();

	constructor() {
		super();
		this.setDefaultConfig({env: 'local', site: '', bundle: {scripts: [], styles: []}, cacheMaxAgeSec: 300, rootRedirect: false});
	}

	setTextsSource(texts: SeoTextsSource) {
		this.texts = texts;
	}

	setHttpServer(server: () => HttpServer) {
		this.server = server;
	}

	/** Register before init. The running module serves `config.site` only. */
	registerSite(site: SeoSiteDef, pages: readonly SeoPageDef[]) {
		assertSeoSite(site);
		assertSeoPages(pages);
		assertSeoLinks(site, pages);
		if (this.sites.has(site.key))
			throw new BadImplementationException(`Duplicate SEO site '${site.key}'`);

		this.sites.set(site.key, site);
		this.pages.set(site.key, [...pages]);
	}

	protected init() {
		const server = this.server();
		const {site, pages} = this.active();
		// Fixed paths first: `/:locale` would otherwise also match `/llms.txt` and `/robots.txt`.
		this.route(server, '/robots.txt', () => this.renderRobots());
		this.route(server, '/sitemap.xml', () => this.renderSitemap());
		this.route(server, '/site.webmanifest', () => this.renderManifest());
		if (site.llms) {
			this.route(server, '/llms.txt', () => this.renderLlms(undefined, this.query('lang')));
			this.route(server, '/:locale/llms.txt', () => this.renderLlms(this.param('locale')));
		}

		if (this.config.rootRedirect)
			this.route(server, '/', () => this.redirectToLocale(this.query('lang'), this.header('accept-language')));

		for (const page of pages)
			this.route(server, `/:locale${page.path === '/' ? '' : page.path}`, () => this.renderPage(this.param('locale'), page.key));
	}

	async renderPage(localeSegment: string, pageKey: string): Promise<SeoResponse> {
		const {site, pages, origin} = this.active();
		const page = pages.find(candidate => candidate.key === pageKey);
		if (!page)
			throw new BadImplementationException(`Unknown SEO page '${pageKey}'`);

		const locale = localeFromUrlSegment(localeSegment, site.enabledLocales);
		if (!locale)
			return this.notFound();

		const body = renderSeoShell({
			site, page, locale, origin,
			t: await this.textsSource().translator(locale),
			bundle: this.config.bundle,
		});
		return this.ok(body, 'text/html; charset=utf-8', {'content-language': localeLanguageTag(locale)});
	}

	renderRobots(): SeoResponse {
		const {site, pages, origin} = this.active();
		return this.ok(renderRobotsTxt(site, origin, pages), 'text/plain; charset=utf-8');
	}

	renderSitemap(): SeoResponse {
		const {site, pages, origin} = this.active();
		return this.ok(renderSitemapXml(site, origin, pages), 'application/xml; charset=utf-8');
	}

	async renderManifest(): Promise<SeoResponse> {
		const {site} = this.active();
		const body = renderWebManifest(site, await this.textsSource().translator(site.defaultLocale));
		return this.ok(body, 'application/manifest+json; charset=utf-8', {'content-language': localeLanguageTag(site.defaultLocale)});
	}

	/** `/llms.txt?lang=` (explicit choice or default) or `/<locale>/llms.txt`. */
	async renderLlms(localeSegment?: string, lang?: string): Promise<SeoResponse> {
		const {site, pages, origin} = this.active();
		if (!site.llms)
			return this.notFound();

		const locale = localeSegment !== undefined
			? localeFromUrlSegment(localeSegment, site.enabledLocales)
			: resolveRequestLocale(lang, site.enabledLocales, site.defaultLocale);
		if (!locale)
			return this.notFound();

		const body = renderLlmsTxt({def: site.llms, t: await this.textsSource().translator(locale), locale, origin, pages});
		return this.ok(body, 'text/plain; charset=utf-8', {'content-language': localeLanguageTag(locale)});
	}

	/** `/` → `/<locale>/`: explicit lang, then Accept-Language, then the site default. No cookies. */
	async redirectToLocale(lang?: string, acceptLanguage?: string): Promise<SeoResponse> {
		const {site} = this.active();
		const detected = detectLocale({supported: site.enabledLocales, browserLanguages: parseAcceptLanguage(acceptLanguage), appDefault: site.defaultLocale});
		const locale = resolveRequestLocale(lang, site.enabledLocales, detected);
		return {status: 302, body: '', contentType: 'text/plain', headers: {location: localizedPath(locale, '/'), vary: 'Accept-Language', 'cache-control': 'no-store'}};
	}

	private active(): {site: SeoSiteDef; pages: SeoPageDef[]; origin: string} {
		const site = this.sites.get(this.config.site);
		if (!site)
			throw new ImplementationMissingException(`SEO site '${this.config.site}' is not registered`);

		return {site, pages: this.pages.get(site.key) ?? [], origin: siteOrigin(site.origins, this.config.env, site.key)};
	}

	private route(server: HttpServer, path: string, render: () => SeoResponse | Promise<SeoResponse>) {
		server.addRoute(new _ServerQueryApi({method: 'get', path} as never, async () => {
			const response = await render();
			const http = MemKey_HttpResponse.get();
			if (response.status === 302)
				return http.redirect(302, response.headers.location, {vary: response.headers.vary, 'cache-control': response.headers['cache-control']});

			http.end(response.status, response.body, {'content-type': response.contentType, ...response.headers});
		}));
	}

	private ok(body: string, contentType: string, headers: Record<string, string> = {}): SeoResponse {
		return {status: 200, body, contentType, headers: {'cache-control': `public, max-age=${this.config.cacheMaxAgeSec}`, ...headers}};
	}

	private notFound(): SeoResponse {
		return {status: 404, body: '', contentType: 'text/plain; charset=utf-8', headers: {'cache-control': 'no-store'}};
	}

	private textsSource(): SeoTextsSource {
		if (!this.texts)
			throw new ImplementationMissingException('ModuleBE_SEO has no texts source (use ModulePackBE_SEO or setTextsSource)');

		return this.texts;
	}

	private param(name: string): string {
		return String((MemKey_HttpRequest.get().params as Record<string, string>)[name] ?? '');
	}

	private query(name: string): string | undefined {
		const value = MemKey_HttpRequest.get().query[name];
		return typeof value === 'string' ? value : undefined;
	}

	private header(name: string): string | undefined {
		const value = MemKey_HttpRequest.get().headers[name];
		return typeof value === 'string' ? value : undefined;
	}
}

/** `nl-BE,nl;q=0.9,en;q=0.5` → `['nl-BE', 'nl', 'en']` (by q, stable). */
export const parseAcceptLanguage = (header?: string): string[] => (header ?? '')
	.split(',')
	.map((part, index) => {
		const [tag, ...params] = part.trim().split(';');
		const q = params.map(p => p.trim()).find(p => p.startsWith('q='));
		return {tag: tag.trim(), q: q ? Number(q.slice(2)) : 1, index};
	})
	.filter(entry => entry.tag && entry.tag !== '*' && Number.isFinite(entry.q) && entry.q > 0)
	.sort((a, b) => b.q - a.q || a.index - b.index)
	.map(entry => entry.tag);

export const ModuleBE_SEO = new ModuleBE_SEO_Class();
