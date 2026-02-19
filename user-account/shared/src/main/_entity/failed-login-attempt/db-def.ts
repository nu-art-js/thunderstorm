import {tsValidateNumber, tsValidateUniqueId} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_FailedLoginAttempt} from './types.js';
import {accountGroupName} from '../session/consts.js';

const Validator_ModifiableProps: DatabaseDef_FailedLoginAttempt['modifiablePropsValidator'] = {
	count: tsValidateNumber(),
	accountId: tsValidateUniqueId,
	loginSuccessfulAt: tsValidateNumber(false)
};

const Validator_GeneratedProps: DatabaseDef_FailedLoginAttempt['generatedPropsValidator'] = {};

export const DBDef_FailedLoginAttempt: Database<DatabaseDef_FailedLoginAttempt> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'failed-login-attempt',
	entityName: 'failed-login-attempt',
	uniqueKeys: ['_id'],
	frontend: {
		group: accountGroupName,
		name: 'failed-login-attempt'
	},
	backend: {
		name: 'user-account--failed-login-attempt'
	}
};