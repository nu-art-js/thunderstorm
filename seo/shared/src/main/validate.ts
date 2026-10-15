/*
 * @nu-art/seo-shared - Site and page SEO config and share-meta rendering
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {I18nLocaleCodes, isI18nLocaleCode, type I18N_Brand} from '@nu-art/i18n-shared';
import {BadImplementationException} from '@nu-art/ts-common';
import {isSiteOrigin, localeUrlSegment} from './locale-url.js';
import {
	SeoColorSchemes,
	SeoImageTypes,
	SeoOgTypes,
	SeoShareImageSize,
	type SeoColorScheme,
	type SeoIcon,
	type SeoImage,
	type SeoImageType,
	type SeoOgType,
	type SeoPageDef,
	type SeoSiteDef,
} from './types.js';

const KeyPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const SiteKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PagePathPattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/;
const ThemeColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const HandlePattern = /^@[A-Za-z0-9_]{1,15}$/;

const fail = (message: string): never => {
	throw new BadImplementationException(message);
};

const assertKey = (key: I18N_Brand, label: string) => {
	if (!KeyPattern.test(key))
		fail(`${label} must be an i18n key, not text`);
};

const isImageType = (value: string): value is SeoImageType => (SeoImageTypes as readonly string[]).includes(value);
const isColorScheme = (value: string): value is SeoColorScheme => (SeoColorSchemes as readonly string[]).includes(value);
const isOgType = (value: string): value is SeoOgType => (SeoOgTypes as readonly string[]).includes(value);

const assertImage = (image: SeoImage, label: string, shareSize: boolean) => {
	assertKey(image.alt, `${label} alt`);
	if (!image.src)
		fail(`${label} is missing src`);

	if (!isImageType(image.type))
		fail(`${label} type must be png, jpeg, or webp`);

	if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1)
		fail(`${label} width and height must be positive integers`);

	if (shareSize && (image.width !== SeoShareImageSize.width || image.height !== SeoShareImageSize.height))
		fail(`${label} must be ${SeoShareImageSize.width}x${SeoShareImageSize.height}`);
};

const assertIcon = (icon: SeoIcon, label: string) => {
	if (!icon.src || !icon.type || !icon.sizes)
		fail(`${label} needs src, type, and sizes`);
};

/** Throws when the site config is not safe to serve. Call at registration, not per request. */
export const assertSeoSite = (site: SeoSiteDef): void => {
	if (!SiteKeyPattern.test(site.key))
		fail(`SEO site key '${site.key}' must be kebab-case`);

	assertKey(site.siteName, `SEO site '${site.key}' siteName`);
	assertKey(site.publisher.name, `SEO site '${site.key}' publisher name`);
	if (!Object.keys(site.origins).length)
		fail(`SEO site '${site.key}' needs an origin per env`);

	for (const [env, origin] of Object.entries(site.origins)) {
		if (!isSiteOrigin(origin))
			fail(`SEO site '${site.key}' origin '${env}' must be an absolute origin with no path`);
	}

	assertImage(site.image, `SEO site '${site.key}' default image`, true);
	if (site.publisher.logo)
		assertImage(site.publisher.logo, `SEO site '${site.key}' logo`, false);

	for (const url of site.publisher.sameAs ?? []) {
		if (!url.startsWith('https://'))
			fail(`SEO site '${site.key}' publisher sameAs must be https URLs`);
	}

	if (!ThemeColorPattern.test(site.themeColor))
		fail(`SEO site '${site.key}' themeColor must be a hex color`);

	if (!isColorScheme(site.colorScheme))
		fail(`SEO site '${site.key}' colorScheme is not supported`);

	if (site.twitter.card !== 'summary_large_image')
		fail(`SEO site '${site.key}' twitter card must be summary_large_image`);

	if (site.twitter.site !== undefined && !HandlePattern.test(site.twitter.site))
		fail(`SEO site '${site.key}' twitter site must be an @handle`);

	assertIcon(site.icons.favicon, `SEO site '${site.key}' favicon`);
	assertIcon(site.icons.appleTouch, `SEO site '${site.key}' apple touch icon`);
	if (!site.icons.manifest.length)
		fail(`SEO site '${site.key}' needs at least one manifest icon`);

	site.icons.manifest.forEach((icon, index) => assertIcon(icon, `SEO site '${site.key}' manifest icon ${index}`));

	if (!site.enabledLocales.length)
		fail(`SEO site '${site.key}' needs at least one enabled locale`);

	if (new Set(site.enabledLocales).size !== site.enabledLocales.length)
		fail(`SEO site '${site.key}' lists a locale twice`);

	for (const locale of site.enabledLocales) {
		if (!isI18nLocaleCode(locale))
			fail(`SEO site '${site.key}' locale '${locale}' is not in the i18n locale enum`);
	}

	if (!site.enabledLocales.includes(site.defaultLocale))
		fail(`SEO site '${site.key}' default locale is not enabled`);

	if (site.llms)
		assertLlms(site);
};

const assertLlms = (site: SeoSiteDef) => {
	const llms = site.llms!;
	assertKey(llms.title, `SEO site '${site.key}' llms title`);
	assertKey(llms.summary, `SEO site '${site.key}' llms summary`);
	llms.details?.forEach(key => assertKey(key, `SEO site '${site.key}' llms detail`));
	for (const section of llms.sections) {
		assertKey(section.title, `SEO site '${site.key}' llms section`);
		for (const link of section.links) {
			if ('title' in link)
				assertKey(link.title, `SEO site '${site.key}' llms link title`);

			if (link.description)
				assertKey(link.description, `SEO site '${site.key}' llms link description`);
		}
	}
};

/** Throws when llms.txt points at a page that was not registered. */
export const assertSeoLinks = (site: SeoSiteDef, pages: readonly SeoPageDef[]): void => {
	const keys = new Set(pages.map(page => page.key));
	for (const section of site.llms?.sections ?? []) {
		for (const link of section.links) {
			if ('page' in link && !keys.has(link.page))
				fail(`llms.txt links to unknown page '${link.page}'`);
		}
	}
};

/** Throws when two pages share a key or a path, or a path is not a static locale-less route. */
export const assertSeoPages = (pages: readonly SeoPageDef[]): void => {
	const keys = new Set<string>();
	const paths = new Set<string>();
	for (const page of pages) {
		if (!SiteKeyPattern.test(page.key))
			fail(`SEO page key '${page.key}' must be kebab-case`);

		if (!PagePathPattern.test(page.path))
			fail(`SEO page '${page.key}' path '${page.path}' must be a static locale-less path`);

		const head = page.path.split('/')[1];
		if (head && I18nLocaleCodes.some(code => localeUrlSegment(code) === head))
			fail(`SEO page '${page.key}' path '${page.path}' must not start with a locale segment`);

		if (keys.has(page.key) || paths.has(page.path))
			fail(`Duplicate SEO page '${page.key}' (${page.path})`);

		keys.add(page.key);
		paths.add(page.path);
		assertKey(page.title, `SEO page '${page.key}' title`);
		assertKey(page.description, `SEO page '${page.key}' description`);
		if (page.image)
			assertImage(page.image, `SEO page '${page.key}' image`, false);

		if (page.ogType !== undefined && !isOgType(page.ogType))
			fail(`SEO page '${page.key}' og:type is not supported`);

		page.sections?.forEach(section => {
			if (section.heading)
				assertKey(section.heading, `SEO page '${page.key}' heading`);

			assertKey(section.body, `SEO page '${page.key}' body`);
		});
	}
};
