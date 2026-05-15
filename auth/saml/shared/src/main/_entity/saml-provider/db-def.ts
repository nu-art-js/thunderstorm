import {tsValidateArray, tsValidateBoolean, tsValidateNumber, tsValidateString, tsValidator_nonMandatoryString} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_SamlProvider, SamlProvider_DbKey} from './types.js';

const modifiablePropsValidator: DatabaseDef_SamlProvider['modifiablePropsValidator'] = {
	domain: tsValidateString(),
	label: tsValidateString(),
	enabled: tsValidateBoolean(),
	metadataUrl: tsValidateString(),
	idpEntityId: tsValidateString(),
	ssoLoginUrl: tsValidateString(),
	ssoLogoutUrl: tsValidateString(undefined, false),
	certificates: tsValidateArray(tsValidateString()),
};

const generatedPropsValidator: DatabaseDef_SamlProvider['generatedPropsValidator'] = {
	lastMetadataFetchAt: tsValidateNumber(false),
	metadataFetchError: tsValidator_nonMandatoryString,
};

export const DBDef_SamlProvider: Database<DatabaseDef_SamlProvider> = {
	dbKey: SamlProvider_DbKey,
	entityName: 'SamlProvider',
	modifiablePropsValidator,
	generatedPropsValidator,
	generatedProps: ['lastMetadataFetchAt', 'metadataFetchError'],
	versions: ['1.0.0'],
	uniqueKeys: ['domain'],
	lockKeys: ['domain'],
	frontend: {group: 'saml', name: 'saml-provider'},
	backend: {name: SamlProvider_DbKey},
};
