import {isLocaleCode} from '@nu-art/i18n-shared';

/** `en_US` → `en-us` (the URL segment: `/en-us/pricing`). */
export const localeUrlSegment = (code: string): string => code.replace('_', '-').toLowerCase();

/** `en_US` → `en-US` (hreflang / html lang). */
export const localeLanguageTag = (code: string): string => code.replace('_', '-');

/** The enabled locale a URL segment names, if any. */
export const localeFromUrlSegment = (segment: string, enabled: readonly string[]): string | undefined => {
	const wanted = segment.toLowerCase();
	return enabled.find(code => isLocaleCode(code) && localeUrlSegment(code) === wanted);
};

/** `/<segment><path>`; `/` stays `/<segment>/`. */
export const localizedPath = (code: string, path: string): string => {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `/${localeUrlSegment(code)}${normalized}`;
};

export const absoluteUrl = (baseUrl: string, path: string): string => `${baseUrl.replace(/\/$/, '')}${path}`;
