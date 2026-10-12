import {isRtlLanguage, languageFromLocaleCode} from '@nu-art/i18n-shared';
import {BadImplementationException} from '@nu-art/ts-common';
import {absoluteUrl, localeLanguageTag, localizedPath} from './locale-url.js';
import type {JsonLdNode, LlmsTxtDef, SeoBundle, SeoPageDef, SeoTranslate} from './types.js';

export const escapeHtml = (value: string): string => value
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** JSON safe inside <script>: no `</script>`, no HTML comment openers, no line separators. */
export const jsonForScript = (value: unknown): string => JSON.stringify(value)
	.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
	.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

export type RenderSeoShellInput = {
	page: SeoPageDef;
	t: SeoTranslate;
	locale: string;
	/** Enabled locale codes: hreflang alternates. */
	locales: readonly string[];
	/** x-default target. */
	defaultLocale: string;
	baseUrl: string;
	bundle: SeoBundle;
	siteName?: string;
};

const meta = (attr: 'name' | 'property', key: string, content: string) => `<meta ${attr}="${key}" content="${escapeHtml(content)}">`;

/** The thin HTML shell of one page in one locale. Every text comes from `t`. */
export const renderSeoShell = (input: RenderSeoShellInput): string => {
	const {page, t, locale, baseUrl} = input;
	if (!input.locales.includes(locale))
		throw new BadImplementationException(`Locale '${locale}' is not enabled`);

	const url = absoluteUrl(baseUrl, localizedPath(locale, page.path));
	const title = t(page.title);
	const description = t(page.description);
	const language = languageFromLocaleCode(locale);
	const ogImage = page.ogImage && (/^https:\/\//.test(page.ogImage) ? page.ogImage : absoluteUrl(baseUrl, page.ogImage));
	const jsonLd = page.jsonLd ? ([] as JsonLdNode[]).concat(page.jsonLd({t, locale, url, baseUrl})) : [];

	const head = [
		'<meta charset="utf-8">',
		'<meta name="viewport" content="width=device-width, initial-scale=1">',
		`<title>${escapeHtml(title)}</title>`,
		meta('name', 'description', description),
		page.noindex ? meta('name', 'robots', 'noindex') : '',
		`<link rel="canonical" href="${escapeHtml(url)}">`,
		...input.locales.map(code => `<link rel="alternate" hreflang="${escapeHtml(localeLanguageTag(code))}" href="${escapeHtml(absoluteUrl(baseUrl, localizedPath(code, page.path)))}">`),
		`<link rel="alternate" hreflang="x-default" href="${escapeHtml(absoluteUrl(baseUrl, localizedPath(input.defaultLocale, page.path)))}">`,
		meta('property', 'og:type', page.ogType ?? 'website'),
		meta('property', 'og:title', title),
		meta('property', 'og:description', description),
		meta('property', 'og:url', url),
		meta('property', 'og:locale', locale.includes('_') ? locale : language),
		...input.locales.filter(code => code !== locale).map(code => meta('property', 'og:locale:alternate', code.includes('_') ? code : languageFromLocaleCode(code))),
		input.siteName ? meta('property', 'og:site_name', input.siteName) : '',
		ogImage ? meta('property', 'og:image', ogImage) : '',
		meta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary'),
		meta('name', 'twitter:title', title),
		meta('name', 'twitter:description', description),
		...jsonLd.map(node => `<script type="application/ld+json">${jsonForScript({'@context': 'https://schema.org', ...node})}</script>`),
		...input.bundle.styles.map(href => `<link rel="stylesheet" href="${escapeHtml(href)}">`),
		...input.bundle.scripts.map(src => `<script type="module" src="${escapeHtml(src)}"></script>`),
	].filter(Boolean);

	const sections = (page.sections ?? []).map(section =>
		`<section>${section.heading ? `<h2>${escapeHtml(t(section.heading))}</h2>` : ''}<p>${escapeHtml(t(section.body))}</p></section>`);
	const mounts = (page.mounts ?? []).map(key => `<div data-ts-embed="${escapeHtml(key)}"></div>`);

	return `<!doctype html>\n<html lang="${escapeHtml(localeLanguageTag(locale))}" dir="${isRtlLanguage(language) ? 'rtl' : 'ltr'}">\n<head>\n${head.join('\n')}\n</head>\n<body>\n<main><h1>${escapeHtml(title)}</h1>${sections.join('')}${mounts.join('')}</main>\n</body>\n</html>\n`;
};

export type RenderLlmsTxtInput = {
	def: LlmsTxtDef;
	t: SeoTranslate;
	locale: string;
	baseUrl: string;
	pages: readonly SeoPageDef[];
};

/** Markdown-ish text has no HTML escaping, but link text and descriptions must stay on one line. */
const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim();
const linkText = (value: string) => oneLine(value).replace(/([[\]])/g, '\\$1');

/** llms.txt for one locale (llmstxt.org): H1, blockquote summary, details, then H2 sections of links. */
export const renderLlmsTxt = (input: RenderLlmsTxtInput): string => {
	const {def, t, locale, baseUrl} = input;
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
				url = absoluteUrl(baseUrl, localizedPath(locale, page.path));
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

/** Every i18n key the definitions use, for the CI completeness check's registrations. */
export const seoKeys = (pages: readonly SeoPageDef[], llms?: LlmsTxtDef): string[] => {
	const keys = new Set<string>();
	for (const page of pages) {
		keys.add(page.title).add(page.description);
		page.sections?.forEach(section => {
			if (section.heading)
				keys.add(section.heading);
			keys.add(section.body);
		});
	}

	if (llms) {
		keys.add(llms.title).add(llms.summary);
		llms.details?.forEach(key => keys.add(key));
		llms.sections.forEach(section => {
			keys.add(section.title);
			section.links.forEach(link => {
				if ('title' in link)
					keys.add(link.title);
				if (link.description)
					keys.add(link.description);
			});
		});
	}

	return [...keys];
};
