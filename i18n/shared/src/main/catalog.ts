import type {I18N_Forms} from './register.js';

/** A default text: a plain string (the `other` form) or plural/band forms. */
export type I18N_Text = string | I18N_Forms;

/** One locale's texts, by i18n key (`inbox.unread`). */
export type I18N_LocaleCatalog = Record<string, I18N_Text>;

/**
 * The defaults as stored in the RTDB config: locale code → encoded key → text.
 * RTDB keys cannot contain '.', so keys are stored with ':' in place of '.' (see encodeI18nRtdbKey).
 */
export type I18N_RtdbDefaults = Record<string, Record<string, I18N_Text>>;

/** Default RTDB path of the defaults tree. */
export const I18nDefaults_RtdbPath = '/_config/i18n/defaults';

/** 'inbox.unread' → 'inbox:unread'. Reversible: ':' is not allowed in i18n keys. */
export const encodeI18nRtdbKey = (key: string): string => key.replace(/\./g, ':');
export const decodeI18nRtdbKey = (rtdbKey: string): string => rtdbKey.replace(/:/g, '.');

/** Decodes one locale node of the RTDB defaults tree into a catalog. */
export const catalogFromRtdb = (node: Record<string, I18N_Text> | null | undefined): I18N_LocaleCatalog => {
	const catalog: I18N_LocaleCatalog = {};
	for (const [rtdbKey, text] of Object.entries(node ?? {}))
		catalog[decodeI18nRtdbKey(rtdbKey)] = text;

	return catalog;
};

export const textToForms = (text: I18N_Text | undefined): I18N_Forms | undefined => {
	if (text === undefined)
		return undefined;

	return typeof text === 'string' ? {other: text} : text;
};
