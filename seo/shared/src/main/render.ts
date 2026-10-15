/*
 * @nu-art/seo-shared - Site and page SEO config and share-meta rendering
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {I18nLocales, type I18N_Brand} from '@nu-art/i18n-shared';
import {BadImplementationException} from '@nu-art/ts-common';
import {absoluteUrl, assetUrl, isHttpsUrl, localeLanguageTag, localizedPath, rootPath} from './locale-url.js';
import type {LlmsTxtDef, SeoBundle, SeoPageDef, SeoSiteDef, SeoTranslate} from './types.js';

export const escapeHtml = (value: string): string => value
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const escapeXml = (value: string): string => escapeHtml(value);

/** JSON safe inside <script>: no `</script>`, no HTML comment openers, no line separators. */
export const jsonForScript = (value: unknown): string => JSON.stringify(value)
	.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
	.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

export type RenderSeoShellInput = {
	site: SeoSiteDef;
	page: SeoPageDef;
	t: SeoTranslate;
	locale: SeoSiteDef['defaultLocale'];
	origin: string;
	bundle: SeoBundle;
};

const meta = (attr: 'name' | 'property', key: string, content: string) => `<meta ${attr}="${key}" content="${escapeHtml(content)}">`;

const shareImageTags = (site: SeoSiteDef, page: SeoPageDef, t: SeoTranslate, origin: string): string[] => {
	const image = page.image ?? site.image;
	const url = assetUrl(origin, image.src);
	const alt = t(image.alt);
	return [
		meta('property', 'og:image', url),
		isHttpsUrl(url) ? meta('property', 'og:image:secure_url', url) : '',
		meta('property', 'og:image:type', image.type),
		meta('property', 'og:image:width', String(image.width)),
		meta('property', 'og:image:height', String(image.height)),
		meta('property', 'og:image:alt', alt),
		meta('name', 'twitter:image', url),
		meta('name', 'twitter:image:alt', alt),
	];
};

/** The HTML shell of one page in one locale. Every human string comes from `t`. */
export const renderSeoShell = (input: RenderSeoShellInput): string => {
	const {site, page, t, locale, origin, bundle} = input;
	if (!site.enabledLocales.includes(locale))
		throw new BadImplementationException(`Locale '${locale}' is not enabled`);

	const url = absoluteUrl(origin, localizedPath(locale, page.path));
	const title = t(page.title);
	const description = t(page.description);
	const siteName = t(site.siteName);
	const dir = I18nLocales[locale].dir;
	const jsonLd = (page.jsonLd ?? []).map(build => build({t, locale, url, origin, site, page}));

	const head = [
		'<meta charset="utf-8">',
		'<meta name="viewport" content="width=device-width, initial-scale=1">',
		`<title>${escapeHtml(title)}</title>`,
		meta('name', 'description', description),
		meta('name', 'robots', page.noindex ? 'noindex,nofollow' : 'index,follow'),
		meta('name', 'theme-color', site.themeColor),
		meta('name', 'color-scheme', site.colorScheme),
		`<link rel="canonical" href="${escapeHtml(url)}">`,
		...site.enabledLocales.map(code => `<link rel="alternate" hreflang="${escapeHtml(localeLanguageTag(code))}" href="${escapeHtml(absoluteUrl(origin, localizedPath(code, page.path)))}">`),
		`<link rel="alternate" hreflang="x-default" href="${escapeHtml(absoluteUrl(origin, localizedPath(site.defaultLocale, page.path)))}">`,
		meta('property', 'og:type', page.ogType ?? 'website'),
		meta('property', 'og:title', title),
		meta('property', 'og:description', description),
		meta('property', 'og:url', url),
		meta('property', 'og:site_name', siteName),
		meta('property', 'og:locale', locale),
		...site.enabledLocales.filter(code => code !== locale).map(code => meta('property', 'og:locale:alternate', code)),
		...shareImageTags(site, page, t, origin),
		meta('name', 'twitter:card', site.twitter.card),
		meta('name', 'twitter:title', title),
		meta('name', 'twitter:description', description),
		site.twitter.site ? meta('name', 'twitter:site', site.twitter.site) : '',
		`<link rel="icon" href="${escapeHtml(rootPath(site.icons.favicon.src))}" type="${escapeHtml(site.icons.favicon.type)}" sizes="${escapeHtml(site.icons.favicon.sizes)}">`,
		`<link rel="apple-touch-icon" href="${escapeHtml(rootPath(site.icons.appleTouch.src))}" sizes="${escapeHtml(site.icons.appleTouch.sizes)}">`,
		'<link rel="manifest" href="/site.webmanifest">',
		...jsonLd.map(node => `<script type="application/ld+json">${jsonForScript({'@context': 'https://schema.org', ...node})}</script>`),
		...bundle.styles.map(href => `<link rel="stylesheet" href="${escapeHtml(href)}">`),
		...bundle.scripts.map(src => `<script type="module" src="${escapeHtml(src)}"></script>`),
	].filter(line => line.length > 0);

	const sections = (page.sections ?? []).map(section =>
		`<section>${section.heading ? `<h2>${escapeHtml(t(section.heading))}</h2>` : ''}<p>${escapeHtml(t(section.body))}</p></section>`);
	const mounts = (page.mounts ?? []).map(key => `<div data-ts-embed="${escapeHtml(key)}"></div>`);

	return `<!doctype html>\n<html lang="${escapeHtml(localeLanguageTag(locale))}" dir="${dir}">\n<head>\n${head.join('\n')}\n</head>\n<body>\n<main><h1>${escapeHtml(title)}</h1>${sections.join('')}${mounts.join('')}</main>\n</body>\n</html>\n`;
};

export type RenderLlmsTxtInput = {
	def: LlmsTxtDef;
	t: SeoTranslate;
	locale: string;
	origin: string;
	pages: readonly SeoPageDef[];
};

/** Markdown-ish text has no HTML escaping, but link text and descriptions must stay on one line. */
const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim();
const linkText = (value: string) => oneLine(value).replace(/([[\]])/g, '\\$1');

/** llms.txt for one locale (llmstxt.org): H1, blockquote summary, details, then H2 sections of links. */
export const renderLlmsTxt = (input: RenderLlmsTxtInput): string => {
	const {def, t, locale, origin} = input;
	const lines = [`# ${oneLine(t(def.title))}`, '', `> ${oneLine(t(def.summary))}`, ''];
	for (const detail of def.details ?? [])
		lines.push(t(detail).trim(), '');

	for (const section of def.sections) {
		lines.push(`## ${oneLine(t(section.title))}`, '');
		for (const link of section.links) {
			let title: string;
			let url: string;
			if ('page' in link) {
				const page = input.pages.find(candidate => candidate.key === link.page);
				if (!page)
					throw new BadImplementationException(`llms.txt links to unknown page '${link.page}'`);

				title = t(page.title);
				url = absoluteUrl(origin, localizedPath(locale, page.path));
			} else {
				title = t(link.title);
				url = link.url;
			}

			const description = link.description ? `: ${oneLine(t(link.description))}` : '';
			lines.push(`- [${linkText(title)}](${encodeURI(url)})${description}`);
		}
		lines.push('');
	}

	return lines.join('\n');
};

const inSitemap = (page: SeoPageDef): boolean => page.sitemap !== false && !page.noindex;

/** robots.txt. noindex routes are disallowed in every enabled locale. No cookies, no prose. */
export const renderRobotsTxt = (site: SeoSiteDef, origin: string, pages: readonly SeoPageDef[]): string => {
	const lines = ['User-agent: *'];
	for (const page of pages) {
		if (!page.noindex)
			continue;

		for (const locale of site.enabledLocales)
			lines.push(`Disallow: ${localizedPath(locale, page.path).replace(/[\r\n]/g, '')}`);
	}

	lines.push(`Sitemap: ${absoluteUrl(origin, '/sitemap.xml')}`, '');
	return lines.join('\n');
};

/** sitemap.xml. One `<url>` per indexable page per enabled locale, with hreflang alternates and x-default. */
export const renderSitemapXml = (site: SeoSiteDef, origin: string, pages: readonly SeoPageDef[]): string => {
	const urls = pages.filter(inSitemap).flatMap(page => site.enabledLocales.map(locale => {
		const loc = absoluteUrl(origin, localizedPath(locale, page.path));
		const alternates = [
			...site.enabledLocales.map(code => `<xhtml:link rel="alternate" hreflang="${escapeXml(localeLanguageTag(code))}" href="${escapeXml(absoluteUrl(origin, localizedPath(code, page.path)))}"/>`),
			`<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl(origin, localizedPath(site.defaultLocale, page.path)))}"/>`,
		];
		return `  <url><loc>${escapeXml(loc)}</loc>${alternates.join('')}</url>`;
	}));
	const body = urls.length ? `${urls.join('\n')}\n` : '';
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}</urlset>\n`;
};

/** site.webmanifest. `name` is the site name in the locale `t` was built for (the module uses the default locale). Icon paths stay root-relative. */
export const renderWebManifest = (site: SeoSiteDef, t: SeoTranslate): string => {
	const name = t(site.siteName);
	return JSON.stringify({
		name,
		short_name: name,
		start_url: localizedPath(site.defaultLocale, '/'),
		scope: '/',
		display: 'standalone',
		lang: localeLanguageTag(site.defaultLocale),
		dir: I18nLocales[site.defaultLocale].dir,
		background_color: site.themeColor,
		theme_color: site.themeColor,
		icons: site.icons.manifest.map(icon => ({
			src: rootPath(icon.src),
			sizes: icon.sizes,
			type: icon.type,
		})),
	});
};

const addKey = (keys: Set<string>, key?: I18N_Brand) => {
	if (key)
		keys.add(key);
};

/**
 * Every i18n key declared on the site and pages, for the CI completeness check.
 * Keys closed over by a JSON-LD builder (for example breadcrumb labels) are not listed; register those at the call site.
 */
export const seoKeys = (site: SeoSiteDef, pages: readonly SeoPageDef[] = []): string[] => {
	const keys = new Set<string>();
	addKey(keys, site.siteName);
	addKey(keys, site.publisher.name);
	addKey(keys, site.image.alt);
	addKey(keys, site.publisher.logo?.alt);
	for (const page of pages) {
		addKey(keys, page.title);
		addKey(keys, page.description);
		addKey(keys, page.image?.alt);
		page.sections?.forEach(section => {
			addKey(keys, section.heading);
			addKey(keys, section.body);
		});
	}

	const llms = site.llms;
	if (llms) {
		addKey(keys, llms.title);
		addKey(keys, llms.summary);
		llms.details?.forEach(key => addKey(keys, key));
		llms.sections.forEach(section => {
			addKey(keys, section.title);
			section.links.forEach(link => {
				if ('title' in link)
					addKey(keys, link.title);

				addKey(keys, link.description);
			});
		});
	}

	return [...keys];
}
