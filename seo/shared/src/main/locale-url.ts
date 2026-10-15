/*
 * @nu-art/seo-shared - Site and page SEO config and share-meta rendering
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {isI18nLocaleCode, type I18nLocaleCode} from '@nu-art/i18n-shared';
import {BadImplementationException, ImplementationMissingException} from '@nu-art/ts-common';

const OriginPattern = /^https?:\/\/[^\s/?#]+(?::\d+)?$/;

/** `en_US` → `en-us` (the URL segment: `/en-us/pricing`). */
export const localeUrlSegment = (code: string): string => code.replace('_', '-').toLowerCase();

/** `en_US` → `en-US` (hreflang / html lang). */
export const localeLanguageTag = (code: string): string => code.replace('_', '-');

/** The enabled locale a URL segment names, if it is in the i18n locale enum. */
export const localeFromUrlSegment = (segment: string, enabled: readonly string[]): I18nLocaleCode | undefined => {
	const wanted = segment.toLowerCase();
	const code = enabled.find(candidate => isI18nLocaleCode(candidate) && localeUrlSegment(candidate) === wanted);
	return code && isI18nLocaleCode(code) ? code : undefined;
};

/** `/<segment><path>`; `/` stays `/<segment>/`. */
export const localizedPath = (code: string, path: string): string => {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `/${localeUrlSegment(code)}${normalized}`;
};

export const absoluteUrl = (origin: string, path: string): string => `${origin.replace(/\/$/, '')}${path}`;

/** Strip one trailing slash so origins compare and concatenate cleanly. */
export const normalizeOrigin = (value: string): string => value.trim().replace(/\/$/, '');

/** Absolute origin with no path, query, or hash. A trailing slash is allowed and ignored. */
export const isSiteOrigin = (value: string): boolean => OriginPattern.test(normalizeOrigin(value));

/** The site's public origin for one env. */
export const siteOrigin = (origins: Readonly<Record<string, string>>, env: string, siteKey: string): string => {
	const raw = origins[env];
	if (!raw)
		throw new ImplementationMissingException(`SEO site '${siteKey}' has no origin for env '${env}'`);

	const origin = normalizeOrigin(raw);
	if (!isSiteOrigin(origin))
		throw new BadImplementationException(`SEO site '${siteKey}' origin for env '${env}' must be an absolute origin with no path`);

	return origin;
};

/** App path or absolute URL, resolved against the origin. Used for og:image and canonical URLs. */
export const assetUrl = (origin: string, src: string): string =>
	/^https?:\/\//.test(src) ? src : absoluteUrl(origin, src.startsWith('/') ? src : `/${src}`);

/** Same-host link. Absolute URLs stay; everything else is root-relative. */
export const rootPath = (src: string): string =>
	/^https?:\/\//.test(src) ? src : (src.startsWith('/') ? src : `/${src}`);

export const isHttpsUrl = (url: string): boolean => url.startsWith('https://');
