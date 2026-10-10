import {isLocaleCode, splitLocaleCode} from './_entity/locale/locale-code.js';

/** Default country → language, used when only the region is known. Apps may pass their own. */
export const DefaultCountryLanguages: Record<string, string> = {
	NL: 'nl', BE: 'nl', DE: 'de', AT: 'de', CH: 'de', FR: 'fr', LU: 'fr', ES: 'es', MX: 'es', AR: 'es',
	IT: 'it', PT: 'pt', BR: 'pt', IL: 'he', SA: 'ar', AE: 'ar', EG: 'ar', RU: 'ru', UA: 'uk', PL: 'pl',
	GB: 'en', US: 'en', IE: 'en', AU: 'en', CA: 'en', NZ: 'en',
};

/** Time zone → country, for when the browser gives no usable language. Apps may pass their own. */
export const DefaultTimeZoneCountries: Record<string, string> = {
	'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Berlin': 'DE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH',
	'Europe/Paris': 'FR', 'Europe/Luxembourg': 'LU', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Lisbon': 'PT',
	'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Warsaw': 'PL', 'Europe/Moscow': 'RU', 'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA',
	'Asia/Jerusalem': 'IL', 'Asia/Tel_Aviv': 'IL', 'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Africa/Cairo': 'EG',
	'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
	'America/Toronto': 'CA', 'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR',
	'Australia/Sydney': 'AU', 'Pacific/Auckland': 'NZ',
};

/** `nl-BE` / `nl_be` / `NL` → `nl_BE` / `nl`; undefined when it is not a locale tag. */
export const normalizeLocaleTag = (tag: string | undefined | null): string | undefined => {
	if (!tag)
		return undefined;

	const [language = '', region] = tag.trim().split(/[-_]/);
	const code = region && /^[a-z]{2}$/i.test(region) ? `${language.toLowerCase()}_${region.toUpperCase()}` : language.toLowerCase();
	return isLocaleCode(code) ? code : undefined;
};

/**
 * Best supported locale for a tag: exact (`nl_BE`), then its language (`nl`), then any supported
 * locale of that language (`nl_NL`).
 */
export const matchSupportedLocale = (tag: string | undefined | null, supported: readonly string[]): string | undefined => {
	const code = normalizeLocaleTag(tag);
	if (!code)
		return undefined;

	if (supported.includes(code))
		return code;

	const {language} = splitLocaleCode(code);
	if (supported.includes(language))
		return language;

	return supported.find(candidate => splitLocaleCode(candidate).language === language);
};

export type DetectLocaleInput = {
	/** Enabled locale codes. */
	supported: readonly string[];
	/** Browser preferences, most preferred first (`navigator.languages`). */
	browserLanguages?: readonly string[];
	/** Region (ISO country) if known, e.g. from `Intl.Locale`. */
	region?: string;
	/** IANA time zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`). */
	timeZone?: string;
	appDefault: string;
	countryLanguages?: Record<string, string>;
	timeZoneCountries?: Record<string, string>;
};

/** Default locale: browser language, then region / time zone, then the app default. No cookies. */
export const detectLocale = (input: DetectLocaleInput): string => {
	for (const tag of input.browserLanguages ?? []) {
		const match = matchSupportedLocale(tag, input.supported);
		if (match)
			return match;
	}

	const country = (input.region?.toUpperCase()) || (input.timeZone ? (input.timeZoneCountries ?? DefaultTimeZoneCountries)[input.timeZone] : undefined);
	if (country) {
		const language = (input.countryLanguages ?? DefaultCountryLanguages)[country];
		const match = language && (matchSupportedLocale(`${language}_${country}`, input.supported) ?? matchSupportedLocale(language, input.supported));
		if (match)
			return match;
	}

	return input.appDefault;
};

/** The query/body parameter carrying the user's explicit locale choice. */
export const I18nLocaleParam = 'lang';

/**
 * Locale for a request: the explicit `lang` choice when it matches a supported locale, otherwise the
 * fallback (the client's detected locale or the app default). Nothing is read from cookies.
 */
export const resolveRequestLocale = (explicit: string | undefined | null, supported: readonly string[], fallback: string): string =>
	matchSupportedLocale(explicit, supported) ?? fallback;
