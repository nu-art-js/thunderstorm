import {tsValidateBoolean, tsValidateString} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_Locale, Locale_DbKey} from './types.js';

const modifiablePropsValidator: DatabaseDef_Locale['modifiablePropsValidator'] = {
	code: tsValidateString(),
	displayName: tsValidateString(),
	enabled: tsValidateBoolean(),
};

const generatedPropsValidator: DatabaseDef_Locale['generatedPropsValidator'] = {};

export const DBDef_Locale: Database<DatabaseDef_Locale> = {
	dbKey: Locale_DbKey,
	entityName: 'Locale',
	modifiablePropsValidator,
	generatedPropsValidator,
	versions: ['1.0.0'],
	uniqueKeys: ['_id'],
	frontend: {group: 'locale', name: 'locale'},
	backend: {name: Locale_DbKey},
};
