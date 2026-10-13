import {tsValidateBoolean, tsValidateString, tsValidateValue} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_Locale, Locale_DbKey} from './types.js';
import {LocaleRegisters} from './locale-code.js';
import {I18nLocaleCodes} from '../../locales.js';

const modifiablePropsValidator: DatabaseDef_Locale['modifiablePropsValidator'] = {
	code: tsValidateValue([...I18nLocaleCodes]),
	displayName: tsValidateString(),
	enabled: tsValidateBoolean(),
	register: tsValidateValue([...LocaleRegisters], false),
};

const generatedPropsValidator: DatabaseDef_Locale['generatedPropsValidator'] = {
	_language: tsValidateString(),
	_country: tsValidateString(),
};

export const DBDef_Locale: Database<DatabaseDef_Locale> = {
	dbKey: Locale_DbKey,
	entityName: 'Locale',
	modifiablePropsValidator,
	generatedPropsValidator,
	generatedProps: ['_language', '_country'],
	versions: ['1.0.0'],
	uniqueKeys: ['code'],
	frontend: {group: 'i18n', name: 'locale'},
	backend: {name: Locale_DbKey},
};
