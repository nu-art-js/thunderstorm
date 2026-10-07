import {tsValidateDynamicObject, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {Locale_DbKey} from '../locale/types.js';
import {DatabaseDef_I18nOverlay, I18nOverlay_DbKey} from './types.js';

const modifiablePropsValidator: DatabaseDef_I18nOverlay['modifiablePropsValidator'] = {
	key: tsValidateString(),
	localeId: tsValidateUniqueId,
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
	uniqueKeys: ['_id'],
	frontend: {group: 'i18n', name: 'overlay'},
	backend: {name: I18nOverlay_DbKey},
	dependencies: {
		localeId: {dbKey: Locale_DbKey, fieldType: 'string'},
	},
};
