import {BadImplementationException} from '@nu-art/ts-common';
import type {I18N_Brand} from './brand.js';

export type I18N_Forms = Partial<Record<string, string>>;
export type I18N_Defaults = Record<string, I18N_Forms>;
export type I18N_ParamKind = 'number' | 'string' | 'boolean';

export type I18N_Registration = {
	hint?: string;
	params?: Record<string, I18N_ParamKind>;
	defaults: I18N_Defaults;
};

const registry = new Map<string, I18N_Registration>();

export const i18nRegister = (id: I18N_Brand, registration: I18N_Registration): I18N_Brand => {
	const existing = registry.get(id);
	if (existing)
		throw new BadImplementationException(`Duplicate i18nRegister for '${id}'`);
	if (!registration.defaults || Object.keys(registration.defaults).length === 0)
		throw new BadImplementationException(`i18nRegister('${id}') requires defaults`);
	registry.set(id, registration);
	return id;
};

export const getI18nRegistration = (id: I18N_Brand): I18N_Registration | undefined => registry.get(id);

export const getAllI18nRegistrations = (): ReadonlyMap<string, I18N_Registration> => registry;
