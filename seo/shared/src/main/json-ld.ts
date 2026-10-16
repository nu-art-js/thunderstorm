/*
 * @nu-art/seo-shared - Site and page SEO config and share-meta rendering
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {I18N_Brand} from '@nu-art/i18n-shared';
import {absoluteUrl, assetUrl, localeLanguageTag, localizedPath} from './locale-url.js';
import type {JsonLdNode, SeoJsonLdBuilder, SeoRenderContext} from './types.js';

export type SeoBreadcrumbItem = {name: I18N_Brand; path: string};

const publisherUrl = (context: SeoRenderContext): string =>
	context.site.publisher.url ? assetUrl(context.origin, context.site.publisher.url) : context.origin;

/** schema.org WebPage for this route and locale. */
export const seoJsonLdWebPage: SeoJsonLdBuilder = context => ({
	'@type': 'WebPage',
	'@id': context.url,
	url: context.url,
	name: context.t(context.page.title),
	description: context.t(context.page.description),
	inLanguage: localeLanguageTag(context.locale),
	isPartOf: {'@id': `${context.origin}/#website`},
});

/** schema.org WebSite for the site origin. */
export const seoJsonLdWebSite: SeoJsonLdBuilder = context => ({
	'@type': 'WebSite',
	'@id': `${context.origin}/#website`,
	url: context.origin,
	name: context.t(context.site.siteName),
	publisher: {'@id': `${context.origin}/#organization`},
	inLanguage: context.site.enabledLocales.map(localeLanguageTag),
});

/** schema.org Organization from the site publisher. */
export const seoJsonLdOrganization: SeoJsonLdBuilder = context => {
	const logo = context.site.publisher.logo;
	const sameAs = context.site.publisher.sameAs ?? [];
	const node: JsonLdNode = {
		'@type': 'Organization',
		'@id': `${context.origin}/#organization`,
		name: context.t(context.site.publisher.name),
		url: publisherUrl(context),
	};
	if (logo)
		node.logo = assetUrl(context.origin, logo.src);

	if (sameAs.length)
		node.sameAs = [...sameAs];

	return node;
};

/** schema.org BreadcrumbList. Item names are i18n keys; register them at the call site (`seoKeys` does not see them). */
export const seoJsonLdBreadcrumb = (items: readonly SeoBreadcrumbItem[]): SeoJsonLdBuilder => context => ({
	'@type': 'BreadcrumbList',
	itemListElement: items.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		name: context.t(item.name),
		item: absoluteUrl(context.origin, localizedPath(context.locale, item.path)),
	})),
});
