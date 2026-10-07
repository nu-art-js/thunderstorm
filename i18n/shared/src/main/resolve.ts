import type {I18N_Brand} from './brand.js';
import {getI18nRegistration, type I18N_Forms} from './register.js';
import {languageFromLocaleCode, pluralCategory} from './plural.js';

export type I18N_Params = Record<string, string | number | boolean | undefined>;

export type ResolveI18nInput = {
	id: I18N_Brand;
	params?: I18N_Params;
	localeCode: string;
	overlayForms?: I18N_Forms;
};

const pickDefaults = (defaults: Record<string, I18N_Forms> | undefined, localeCode: string, language: string): I18N_Forms | undefined => {
	if (!defaults)
		return undefined;
	return defaults[localeCode] ?? defaults[language] ?? defaults['en_US'] ?? defaults['en'];
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

export const resolveI18n = (input: ResolveI18nInput): string => {
	const language = languageFromLocaleCode(input.localeCode);
	const registration = getI18nRegistration(input.id);
	const overlay = input.overlayForms;
	const registered = pickDefaults(registration?.defaults, input.localeCode, language);
	const english = pickDefaults(registration?.defaults, 'en_US', 'en');

	const template =
		(overlay ? pickForm(overlay, input.params, language) : undefined)
		?? (registered ? pickForm(registered, input.params, language) : undefined)
		?? (english ? pickForm(english, input.params, 'en') : undefined)
		?? input.id;

	return interpolateI18n(template, input.params);
};
