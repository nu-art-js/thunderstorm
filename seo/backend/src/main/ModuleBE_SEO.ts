/*
 * @nu-art/seo-backend - Per-locale HTML shells and SEO files through the i18n translator
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {_ServerQueryApi, HttpServer, MemKey_HttpRequest, MemKey_HttpResponse} from '@nu-art/http-server';
import {detectLocale, resolveRequestLocale, type I18N_Params} from '@nu-art/i18n-shared';
import {
	assertSeoHosting,
	assertSeoLinks,
	assertSeoPages,
	assertSeoSite,
	collectSitemapPaths,
	fillSeoPath,
	isConcreteSeoPath,
	localeFromUrlSegment,
	localeLanguageTag,
	localizedPath,
	matchSeoPage,
	renderLlmsTxt,
	renderRobotsTxt,
	renderSeoShell,
	renderSitemapXml,
	renderWebManifest,
	requestHostFromHeaders,
	resolveSiteOrigin,
	selectSeoSite,
	SeoShareImageSize,
	splitLocalizedRequest,
	type SeoBundle,
	type SeoPageDef,
	type SeoPageResolution,
	type SeoSiteDef,
} from '@nu-art/seo-shared';
import {BadImplementationException, ImplementationMissingException, Module} from '@nu-art/ts-common';
import type {SeoTextsSource} from './texts-source.js';

type Config = {
	/** Env key whose origin the site def declares (`local`, `dev`, `prod`). */
	env: string;
	/**
	 * Frontend assets per site key. Hashes change per hosting build, so this stays on the
	 * module config (RTDB) rather than the site def.
	 */
	bundles: Record<string, SeoBundle>;
	/** Seconds browsers and the CDN may cache a shell or SEO file. */
	cacheMaxAgeSec: number;
	/** Serve `/` as a redirect to the visitor's locale (lang param, then Accept-Language, then the site default). */
	rootRedirect: boolean;
};

export type SeoResponse = {status: number; body: string; contentType: string; headers: Record<string, string>};

type Active = {site: SeoSiteDef; pages: SeoPageDef[]; origin: string};

/**
 * HTML shells and SEO files for every registered site.
 * The request host selects the site (`x-fh-requested-host`, then `x-forwarded-host`, then `host`).
 * One site may omit `hosts` and then answers every host. Locales are the site's `enabledLocales`.
 * Nothing is read from or written to the database, and locale is never stored in a cookie.
 *
 * Register each site and its pages before init. Routes:
 * `/<locale><path>`, `/robots.txt`, `/sitemap.xml`, `/site.webmanifest`,
 * `/llms.txt?lang=` and `/<locale>/llms.txt`,
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
		this.setDefaultConfig({env: 'local', bundles: {}, cacheMaxAgeSec: 300, rootRedirect: false});
	}

	setTextsSource(texts: SeoTextsSource) {
		this.texts = texts;
	}

	setHttpServer(server: () => HttpServer) {
		this.server = server;
	}

	/** Register before init. Host selects which site a request renders. */
	registerSite(site: SeoSiteDef, pages: readonly SeoPageDef[]) {
		assertSeoSite(site);
		assertSeoPages(pages);
		assertSeoLinks(site, pages);
		if (this.sites.has(site.key))
			throw new BadImplementationException(`Duplicate SEO site '${site.key}'`);

		assertSeoHosting([...this.sites.values(), site]);
		this.sites.set(site.key, site);
		this.pages.set(site.key, [...pages]);
	}

	protected init() {
		const server = this.server();
		// Fixed paths first: `/:locale` would otherwise also match `/llms.txt` and `/robots.txt`.
		this.route(server, '/robots.txt', () => this.renderRobots());
		this.route(server, '/sitemap.xml', () => this.renderSitemap());
		this.route(server, '/site.webmanifest', () => this.renderManifest());
		this.route(server, '/llms.txt', () => this.renderLlms(undefined, this.query('lang')));
		this.route(server, '/:locale/llms.txt', () => this.renderLlms(this.param('locale')));
		if (this.config.rootRedirect)
			this.route(server, '/', () => this.redirectToLocale(this.query('lang'), this.header('accept-language')));

		this.route(server, '/:locale', () => this.renderFromRequest());
		this.route(server, '/:locale/*', () => this.renderFromRequest());
	}

	async renderPage(localeSegment: string, pagePath: string, host?: string, query: Readonly<Record<string, string>> = {}): Promise<SeoResponse> {
		const active = this.active(host);
		if (!active)
			return this.notFound();

		const {site, pages, origin} = active;
		const locale = localeFromUrlSegment(localeSegment, site.enabledLocales);
		if (!locale)
			return this.notFound();

		const matched = matchSeoPage(pages, pagePath);
		if (!matched)
			return this.notFound();

		const requestHost = host ?? this.requestHost();
		const resolution = matched.page.resolve
			? await matched.page.resolve({host: requestHost, path: pagePath, pathParams: matched.pathParams, query})
			: {};
		if (!resolution)
			return this.notFound();

		const rendered = this.concrete(matched.page, matched.pathParams, resolution);
		const params: I18N_Params = {...rendered.pathParams, ...resolution.params};
		const body = renderSeoShell({
			site, page: matched.page, locale, origin, params,
			path: rendered.path,
			image: resolution.image,
			noindex: resolution.noindex,
			t: await this.textsSource().translator(locale),
			bundle: this.bundle(site.key),
		});
		return this.ok(body, 'text/html; charset=utf-8', {'content-language': localeLanguageTag(locale)});
	}

	renderRobots(host?: string): SeoResponse {
		const active = this.active(host);
		if (!active)
			return this.notFound();

		return this.ok(renderRobotsTxt(active.site, active.origin, active.pages), 'text/plain; charset=utf-8');
	}

	async renderSitemap(host?: string): Promise<SeoResponse> {
		const active = this.active(host);
		if (!active)
			return this.notFound();

		const paths = await collectSitemapPaths(active.pages);
		return this.ok(renderSitemapXml(active.site, active.origin, paths), 'application/xml; charset=utf-8');
	}

	async renderManifest(host?: string): Promise<SeoResponse> {
		const active = this.active(host);
		if (!active)
			return this.notFound();

		const body = renderWebManifest(active.site, await this.textsSource().translator(active.site.defaultLocale));
		return this.ok(body, 'application/manifest+json; charset=utf-8', {'content-language': localeLanguageTag(active.site.defaultLocale)});
	}

	/** `/llms.txt?lang=` (explicit choice or default) or `/<locale>/llms.txt`. */
	async renderLlms(localeSegment?: string, lang?: string, host?: string): Promise<SeoResponse> {
		const active = this.active(host);
		const llms = active?.site.llms;
		if (!active || !llms)
			return this.notFound();

		const {site, pages, origin} = active;
		const locale = localeSegment !== undefined
			? localeFromUrlSegment(localeSegment, site.enabledLocales)
			: resolveRequestLocale(lang, site.enabledLocales, site.defaultLocale);
		if (!locale)
			return this.notFound();

		const body = renderLlmsTxt({def: llms, t: await this.textsSource().translator(locale), locale, origin, pages});
		return this.ok(body, 'text/plain; charset=utf-8', {'content-language': localeLanguageTag(locale)});
	}

	/** `/` → `/<locale>/`: explicit lang, then Accept-Language, then the site default. No cookies. */
	async redirectToLocale(lang?: string, acceptLanguage?: string, host?: string): Promise<SeoResponse> {
		const active = this.active(host);
		if (!active)
			return this.notFound();

		const {site} = active;
		const detected = detectLocale({supported: site.enabledLocales, browserLanguages: parseAcceptLanguage(acceptLanguage), appDefault: site.defaultLocale});
		const locale = resolveRequestLocale(lang, site.enabledLocales, detected);
		const vary = ['Accept-Language', ...this.hostVaryNames()];
		return {status: 302, body: '', contentType: 'text/plain', headers: {location: localizedPath(locale, '/'), vary: vary.join(', '), 'cache-control': 'no-store'}};
	}

	private async renderFromRequest(): Promise<SeoResponse> {
		const split = splitLocalizedRequest(MemKey_HttpRequest.get().path);
		if (!split)
			return this.notFound();

		return this.renderPage(split.locale, split.pagePath, this.requestHost(), this.queryMap());
	}

	private concrete(page: SeoPageDef, pathParams: Readonly<Record<string, string>>, resolution: SeoPageResolution): {path: string; pathParams: Record<string, string>} {
		const merged = {...pathParams, ...resolution.pathParams};
		const path = resolution.path ?? fillSeoPath(page.path, merged);
		if (!isConcreteSeoPath(path))
			throw new BadImplementationException(`SEO page '${page.key}' resolved path '${path}' is not concrete`);

		const image = resolution.image;
		if (image && (image.width !== SeoShareImageSize.width || image.height !== SeoShareImageSize.height))
			throw new BadImplementationException(`SEO page '${page.key}' image must be ${SeoShareImageSize.width}x${SeoShareImageSize.height}`);

		return {path, pathParams: merged};
	}

	private active(host?: string): Active | undefined {
		const name = (host ?? this.requestHost()).toLowerCase();
		const site = selectSeoSite([...this.sites.values()], name);
		if (!site)
			return undefined;

		return {site, pages: this.pages.get(site.key) ?? [], origin: resolveSiteOrigin(site, this.config.env, name)};
	}

	private bundle(siteKey: string): SeoBundle {
		const bundle = this.config.bundles[siteKey];
		if (!bundle)
			throw new ImplementationMissingException(`SEO site '${siteKey}' has no bundle`);

		return bundle;
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

	private hostVaryNames(): string[] {
		return this.sites.size > 1 ? ['X-Forwarded-Host', 'X-FH-Requested-Host'] : [];
	}

	private ok(body: string, contentType: string, headers: Record<string, string> = {}): SeoResponse {
		const vary = this.hostVaryNames();
		return {
			status: 200, body, contentType,
			headers: {'cache-control': `public, max-age=${this.config.cacheMaxAgeSec}`, ...(vary.length ? {vary: vary.join(', ')} : {}), ...headers},
		};
	}

	private notFound(): SeoResponse {
		return {status: 404, body: '', contentType: 'text/plain; charset=utf-8', headers: {'cache-control': 'no-store'}};
	}

	private textsSource(): SeoTextsSource {
		if (!this.texts)
			throw new ImplementationMissingException('ModuleBE_SEO has no texts source (use ModulePackBE_SEO or setTextsSource)');

		return this.texts;
	}

	private requestHost(): string {
		return requestHostFromHeaders(MemKey_HttpRequest.get().headers);
	}

	private param(name: string): string {
		return String((MemKey_HttpRequest.get().params as Record<string, string>)[name] ?? '');
	}

	private query(name: string): string | undefined {
		return this.queryMap()[name];
	}

	private queryMap(): Record<string, string> {
		const query = MemKey_HttpRequest.get().query as Record<string, unknown>;
		const out: Record<string, string> = {};
		for (const [key, value] of Object.entries(query ?? {})) {
			if (typeof value === 'string')
				out[key] = value;
			else if (Array.isArray(value) && typeof value[0] === 'string')
				out[key] = value[0];
		}

		return out;
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
