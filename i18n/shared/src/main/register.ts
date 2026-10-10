import {BadImplementationException} from '@nu-art/ts-common';
import type {I18N_Brand} from './brand.js';

/** Plural/band forms of one text: `{one: '{count} item', other: '{count} items'}`. */
export type I18N_Forms = Partial<Record<string, string>>;
export type I18N_ParamKind = 'number' | 'string' | 'boolean';

/**
 * What code declares about a key. No text: defaults live in the RTDB config (locale → key → text)
 * and overrides in the overlay collection.
 */
export type I18N_Registration = {
	/** For translators and agents: where the text appears and what it means. */
	context?: string;
	params?: Record<string, I18N_ParamKind>;
};

const registry = new Map<string, I18N_Registration>();

export const i18nRegister = (id: I18N_Brand, registration: I18N_Registration = {}): I18N_Brand => {
	if (registry.has(id))
		throw new BadImplementationException(`Duplicate i18nRegister for '${id}'`);

	registry.set(id, registration);
	return id;
};

export const getI18nRegistration = (id: I18N_Brand): I18N_Registration | undefined => registry.get(id);
export const getAllI18nRegistrations = (): ReadonlyMap<string, I18N_Registration> => registry;
