import {tsValidateOptionalId, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {Locale_DbKey} from '../locale/types.js';
import {DatabaseDef_LocalizedString, LocalizedString_DbKey} from './types.js';

const modifiablePropsValidator: DatabaseDef_LocalizedString['modifiablePropsValidator'] = {
	localeId: tsValidateUniqueId,
	originId: tsValidateOptionalId,
	value: tsValidateString(),
};

const generatedPropsValidator: DatabaseDef_LocalizedString['generatedPropsValidator'] = {};

export const DBDef_LocalizedString: Database<DatabaseDef_LocalizedString> = {
	dbKey: LocalizedString_DbKey,
	entityName: 'LocalizedString',
	modifiablePropsValidator,
	generatedPropsValidator,
	versions: ['1.0.0'],
	uniqueKeys: ['_id'],
	frontend: {group: 'locale', name: 'localized-string'},
	backend: {name: LocalizedString_DbKey},
	dependencies: {
		localeId: {dbKey: Locale_DbKey, fieldType: 'string'},
	},
};
