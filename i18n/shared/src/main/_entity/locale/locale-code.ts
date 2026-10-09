import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {Locale_DbKey} from './types.js';

/** Grammatical register a locale's texts are written in (e.g. nl: formal = "u", informal = "je"). */
export const LocaleRegisters = ['formal', 'informal'] as const;
export type LocaleRegister = typeof LocaleRegisters[number];

/** `ll` or `ll_CC`: lowercase ISO 639 language, optional uppercase ISO 3166 region. */
export const LocaleCodePattern = /^[a-z]{2,3}(?:_[A-Z]{2})?$/;

export const isLocaleCode = (code: string): boolean => LocaleCodePattern.test(code);

/**
 * The locale's document id, derived from its code. The code is the locale's identity: one code, one
 * document, and the id can be computed without a lookup.
 */
export const localeIdFromCode = (code: string) => hashToUniqueId<typeof Locale_DbKey>(code);

export const splitLocaleCode = (code: string): { language: string; country: string } => {
	const [language = '', country = ''] = code.split('_');
	return {language, country};
};
