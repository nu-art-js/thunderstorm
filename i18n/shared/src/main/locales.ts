/** How a locale is shown and laid out. nativeName is the language's own name. */
export type I18nLocaleDef = {
	nativeName: string;
	flag: string;
	dir: 'ltr' | 'rtl';
};

/**
 * The locales this codebase knows. The code is the identity; a DB locale record realizes one
 * (enabled, access groups, overlays) and its `code` must be one of these keys.
 */
export const I18nLocales = {
	en_US: {nativeName: 'English', flag: '🇺🇸', dir: 'ltr'},
	nl_NL: {nativeName: 'Nederlands', flag: '🇳🇱', dir: 'ltr'},
	de_DE: {nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr'},
	fr_FR: {nativeName: 'Français', flag: '🇫🇷', dir: 'ltr'},
	es_ES: {nativeName: 'Español', flag: '🇪🇸', dir: 'ltr'},
	pt_BR: {nativeName: 'Português', flag: '🇧🇷', dir: 'ltr'},
	ru_RU: {nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr'},
	he_IL: {nativeName: 'עברית', flag: '🇮🇱', dir: 'rtl'},
	ar_SA: {nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl'},
} as const satisfies Record<string, I18nLocaleDef>;

export type I18nLocaleCode = keyof typeof I18nLocales;

export const I18nLocaleCodes = Object.keys(I18nLocales) as I18nLocaleCode[];

export const isI18nLocaleCode = (code: string): code is I18nLocaleCode => Object.prototype.hasOwnProperty.call(I18nLocales, code);
