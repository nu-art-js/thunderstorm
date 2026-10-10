import {tsValidateDynamicObject, tsValidateRegexp, tsValidateString} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {LocaleCodePattern} from '../locale/locale-code.js';
import {DatabaseDef_I18nOverlay, I18nOverlay_DbKey} from './types.js';

const modifiablePropsValidator: DatabaseDef_I18nOverlay['modifiablePropsValidator'] = {
	locale: tsValidateRegexp(LocaleCodePattern),
	key: tsValidateString(),
	forms: tsValidateDynamicObject(tsValidateString(), tsValidateString()),
	translatorNote: tsValidateString(-1, false),
};

const generatedPropsValidator: DatabaseDef_I18nOverlay['generatedPropsValidator'] = {};

export const DBDef_I18nOverlay: Database<DatabaseDef_I18nOverlay> = {
	dbKey: I18nOverlay_DbKey,
	entityName: 'I18nOverlay',
	modifiablePropsValidator,
	generatedPropsValidator,
	versions: ['1.0.0'],
	uniqueKeys: ['locale', 'key'],
	indices: [
		{id: 'locale-key', keys: ['locale', 'key'], params: {unique: true, multiEntry: false}},
		{id: 'locale', keys: 'locale', params: {unique: false, multiEntry: false}},
	],
	frontend: {group: 'i18n', name: 'overlay'},
	backend: {name: I18nOverlay_DbKey},
};
