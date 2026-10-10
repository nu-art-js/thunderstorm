import {_ServerQueryApi, HttpServer, MemKey_HttpRequest, MemKey_HttpResponse} from '@nu-art/http-server';
import {detectLocale, resolveRequestLocale} from '@nu-art/i18n-shared';
import {
	localeFromUrlSegment,
	localeLanguageTag,
	localizedPath,
	type LlmsTxtDef,
	renderLlmsTxt,
	renderSeoShell,
	type SeoBundle,
	type SeoPageDef
} from '@nu-art/seo-shared';
import {BadImplementationException, ImplementationMissingException, Module} from '@nu-art/ts-common';
import type {SeoTextsSource} from './texts-source.js';

type Config = {
	/** Public origin (`https://example.com`): canonical and hreflang URLs. */
	baseUrl: string;
	/** x-default and the fallback when nothing matches. */
	defaultLocale: string;
	bundle: SeoBundle;
	siteName?: string;
	/** Seconds browsers and the CDN may cache a shell or llms.txt. */
	cacheMaxAgeSec: number;
	/** Serve `/` as a redirect to the visitor's locale (lang param, then Accept-Language, then default). */
	rootRedirect: boolean;
};

export type SeoResponse = { status: number; body: string; contentType: string; headers: Record<string, string> };

/**
 * Per-locale HTML shells (`/<locale><path>`) and llms.txt (`/llms.txt?lang=`, `/<locale>/llms.txt`),
 * rendered from the cached i18n translations through the single resolution path.
 */
export class ModuleBE_SEO_Class
	extends Module<Config> {

	private readonly pages: SeoPageDef[] = [];
	private llms?: LlmsTxtDef;
	private texts?: SeoTextsSource;
	private server: () => HttpServer = () => HttpServer.getDefault();

	constructor() {
		super();
		this.setDefaultConfig({defaultLocale: 'en_US', bundle: {scripts: [], styles: []}, cacheMaxAgeSec: 300, rootRedirect: false});
	}

	setTextsSource(texts: SeoTextsSource) {
		this.texts = texts;
	}

	setHttpServer(server: () => HttpServer) {
		this.server = server;
	}

	/** Register before init. Paths are locale-less and unique. */
	registerPages(...pages: SeoPageDef[]) {
		for (const page of pages) {
			if (this.pages.some(existing => existing.key === page.key || existing.path === page.path))
				throw new BadImplementationException(`Duplicate SEO page '${page.key}' (${page.path})`);

			this.pages.push(page);
		}
	}

	setLlmsTxt(def: LlmsTxtDef) {
		this.llms = def;
	}

	protected init() {
		const server = this.server();
		// Fixed paths first: `/:locale` would otherwise also match `/llms.txt`.
		if (this.llms) {
			this.route(server, '/llms.txt', () => this.renderLlms(undefined, this.query('lang')));
			this.route(server, '/:locale/llms.txt', () => this.renderLlms(this.param('locale')));
		}

		if (this.config.rootRedirect)
			this.route(server, '/', () => this.redirectToLocale(this.query('lang'), this.header('accept-language')));

		for (const page of this.pages)
			this.route(server, `/:locale${page.path === '/' ? '' : page.path}`, () => this.renderPage(this.param('locale'), page.key));
	}

	async renderPage(localeSegment: string, pageKey: string): Promise<SeoResponse> {
		const page = this.pages.find(candidate => candidate.key === pageKey);
		if (!page)
			throw new BadImplementationException(`Unknown SEO page '${pageKey}'`);

		const locales = await this.textsSource().enabledLocales();
		const locale = localeFromUrlSegment(localeSegment, locales);
		if (!locale)
			return this.notFound();

		const t = await this.textsSource().translator(locale);
		const body = renderSeoShell({
			page, t, locale, locales,
			defaultLocale: locales.includes(this.config.defaultLocale) ? this.config.defaultLocale : locales[0],
			baseUrl: this.baseUrl(), bundle: this.config.bundle, siteName: this.config.siteName,
		});
		return this.ok(body, 'text/html; charset=utf-8', {'content-language': localeLanguageTag(locale)});
	}

	/** `/llms.txt?lang=` (explicit choice or default) or `/<locale>/llms.txt`. */
	async renderLlms(localeSegment?: string, lang?: string): Promise<SeoResponse> {
		if (!this.llms)
			return this.notFound();

		const locales = await this.textsSource().enabledLocales();
		const locale = localeSegment !== undefined
			? localeFromUrlSegment(localeSegment, locales)
			: resolveRequestLocale(lang, locales, this.fallbackLocale(locales));
		if (!locale)
			return this.notFound();

		const body = renderLlmsTxt({def: this.llms, t: await this.textsSource().translator(locale), locale, baseUrl: this.baseUrl(), pages: this.pages});
		return this.ok(body, 'text/plain; charset=utf-8', {'content-language': localeLanguageTag(locale)});
	}

	/** `/` → `/<locale>/`: explicit lang, then Accept-Language, then the default. No cookies. */
	async redirectToLocale(lang?: string, acceptLanguage?: string): Promise<SeoResponse> {
		const locales = await this.textsSource().enabledLocales();
		const detected = detectLocale({supported: locales, browserLanguages: parseAcceptLanguage(acceptLanguage), appDefault: this.fallbackLocale(locales)});
		const locale = resolveRequestLocale(lang, locales, detected);
		return {status: 302, body: '', contentType: 'text/plain', headers: {location: localizedPath(locale, '/'), vary: 'Accept-Language', 'cache-control': 'no-store'}};
	}

	private route(server: HttpServer, path: string, render: () => Promise<SeoResponse>) {
		server.addRoute(new _ServerQueryApi({method: 'get', path} as never, async () => {
			const response = await render();
			const http = MemKey_HttpResponse.get();
			if (response.status === 302)
				return http.redirect(302, response.headers.location, {vary: response.headers.vary, 'cache-control': response.headers['cache-control']});

			http.end(response.status, response.body, {'content-type': response.contentType, ...response.headers});
		}));
	}

	private ok(body: string, contentType: string, headers: Record<string, string>): SeoResponse {
		return {status: 200, body, contentType, headers: {'cache-control': `public, max-age=${this.config.cacheMaxAgeSec}`, ...headers}};
	}

	private notFound(): SeoResponse {
		return {status: 404, body: 'Not found', contentType: 'text/plain; charset=utf-8', headers: {'cache-control': 'no-store'}};
	}

	private fallbackLocale(locales: readonly string[]) {
		return locales.includes(this.config.defaultLocale) ? this.config.defaultLocale : (locales[0] ?? this.config.defaultLocale);
	}

	private baseUrl() {
		if (!this.config.baseUrl)
			throw new ImplementationMissingException('ModuleBE_SEO config is missing baseUrl');

		return this.config.baseUrl;
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
