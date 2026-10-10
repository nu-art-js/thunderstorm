import type {I18N_Brand} from './brand.js';
import type {I18N_Forms} from './register.js';
import {textToForms, type I18N_Text} from './catalog.js';
import {languageFromLocaleCode, pluralCategory} from './plural.js';

export type I18N_Params = Record<string, string | number | boolean | undefined>;

export type ResolveI18nInput = {
	id: I18N_Brand;
	params?: I18N_Params;
	localeCode: string;
	/** Override (overlay) forms for this locale and key, if any. */
	override?: I18N_Forms;
	/** The RTDB default for this locale and key, if any. */
	defaultText?: I18N_Text;
};

const pickForm = (forms: I18N_Forms, params: I18N_Params | undefined, language: string): string | undefined => {
	const band = params?.band;
	if (typeof band === 'string' && forms[band])
		return forms[band];

	const count = params?.count;
	if (typeof count === 'number') {
		const category = pluralCategory(language, count);
		return forms[category] ?? forms.other;
	}

	return forms.other ?? forms[Object.keys(forms)[0] ?? ''];
};

export const interpolateI18n = (template: string, params?: I18N_Params): string => {
	if (!params)
		return template;

	return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (match, name: string) => {
		const value = params[name];
		return value === undefined ? match : String(value);
	});
};

/**
 * The single resolution path: key + params + locale → string.
 * Order: override → default (same locale) → the key itself. The key is a last resort the CI
 * completeness check keeps from ever showing. There is no cross-locale fallback.
 */
export const resolveI18n = (input: ResolveI18nInput): string => {
	const language = languageFromLocaleCode(input.localeCode);
	const fromOverride = input.override ? pickForm(input.override, input.params, language) : undefined;
	const defaults = textToForms(input.defaultText);
	const fromDefault = defaults ? pickForm(defaults, input.params, language) : undefined;
	const template = fromOverride ?? fromDefault ?? input.id;
	return interpolateI18n(template, input.params);
};

/** One locale's texts: overrides (by key) and defaults (by key). */
export type I18nLocaleTexts = {
	overrides: Record<string, I18N_Forms | undefined>;
	defaults: Record<string, I18N_Text | undefined>;
};

export type I18nTranslator = {
	localeCode: string;
	/** Synchronous; goes through resolveI18n. Use for text, titles, meta and attributes alike. */
	t: (id: I18N_Brand, params?: I18N_Params) => string;
};

/** Binds a locale's loaded texts to the single resolution path. */
export const createI18nTranslator = (localeCode: string, texts: I18nLocaleTexts): I18nTranslator => ({
	localeCode,
	t: (id, params) => resolveI18n({id, params, localeCode, override: texts.overrides[id], defaultText: texts.defaults[id]}),
});
