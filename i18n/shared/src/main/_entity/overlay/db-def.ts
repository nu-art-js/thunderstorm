import {tsValidateDynamicObject, tsValidateRegexp, tsValidateString, tsValidateTimestamp} from '@nu-art/ts-common';
import {composeDbObjectUniqueId, Database} from '@nu-art/db-api-shared';
import {LocaleCodePattern} from '../locale/locale-code.js';
import {DatabaseDef_I18nOverlay, type DB_I18nOverlay, I18nOverlay_DbKey} from './types.js';

const modifiablePropsValidator: DatabaseDef_I18nOverlay['modifiablePropsValidator'] = {
	locale: tsValidateRegexp(LocaleCodePattern),
	key: tsValidateString(),
	forms: tsValidateDynamicObject(tsValidateString(), tsValidateString()),
	translatorNote: tsValidateString(-1, false),
};

const generatedPropsValidator: DatabaseDef_I18nOverlay['generatedPropsValidator'] = {
	_editedBy: tsValidateString(-1, false),
	_editedAt: tsValidateTimestamp(undefined, false),
};

export const DBDef_I18nOverlay: Database<DatabaseDef_I18nOverlay> = {
	dbKey: I18nOverlay_DbKey,
	entityName: 'I18nOverlay',
	modifiablePropsValidator,
	generatedPropsValidator,
	generatedProps: ['_editedBy', '_editedAt'],
	versions: ['1.0.0'],
	uniqueKeys: ['locale', 'key'],
	indices: [
		{id: 'locale-key', keys: ['locale', 'key'], params: {unique: true, multiEntry: false}},
		{id: 'locale', keys: 'locale', params: {unique: false, multiEntry: false}},
	],
	frontend: {group: 'i18n', name: 'overlay'},
	backend: {name: I18nOverlay_DbKey},
};

/** The override document id, composed by db-api from the unique keys (locale, key). */
export const i18nOverrideId = (locale: string, key: string) =>
	composeDbObjectUniqueId({locale, key} as unknown as DB_I18nOverlay, [...DBDef_I18nOverlay.uniqueKeys!]) as DB_I18nOverlay['_id'];
