import {tsValidateNumber, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_PasswordResetToken} from './types.js';

const Validator_ModifiableProps: DatabaseDef_PasswordResetToken['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	consumedAt: tsValidateNumber(false),
};

const Validator_GeneratedProps: DatabaseDef_PasswordResetToken['generatedPropsValidator'] = {
	token: tsValidateString(),
	expiresAt: tsValidateNumber(),
};

export const DBDef_PasswordResetToken: Database<DatabaseDef_PasswordResetToken> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: ['token', 'expiresAt'],
	versions: ['1.0.0'],
	dbKey: 'password-auth--reset-token',
	entityName: 'password-reset-token',
	uniqueKeys: ['accountId'],
	frontend: {
		group: 'ts-default',
		name: 'password-reset-token'
	},
	backend: {
		name: 'password-auth--reset-token'
	}
};
