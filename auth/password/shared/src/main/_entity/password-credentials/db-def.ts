import {tsValidateBoolean, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_PasswordCredentials} from './types.js';

const Validator_ModifiableProps: DatabaseDef_PasswordCredentials['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	salt: tsValidateString(),
	saltedPassword: tsValidateString(),
	_newPasswordRequired: tsValidateBoolean(false),
};

const Validator_GeneratedProps: DatabaseDef_PasswordCredentials['generatedPropsValidator'] = {};

export const DBDef_PasswordCredentials: Database<DatabaseDef_PasswordCredentials> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'password-auth--credentials',
	entityName: 'password-credentials',
	uniqueKeys: ['accountId'],
	frontend: {
		group: 'ts-default',
		name: 'password-credentials'
	},
	backend: {
		name: 'password-auth--credentials'
	}
};
