import {tsValidateNumber, tsValidateUniqueId} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DBProto_FailedLoginAttempt} from './types.js';
import {accountGroupName} from '../session/index.js';

const Validator_ModifiableProps: DBProto_FailedLoginAttempt['modifiablePropsValidator'] = {
	count: tsValidateNumber(),
	accountId: tsValidateUniqueId,
	loginSuccessfulAt: tsValidateNumber(false)
};

const Validator_GeneratedProps: DBProto_FailedLoginAttempt['generatedPropsValidator'] = {};

export const DBDef_FailedLoginAttempt: Database<DBProto_FailedLoginAttempt> = {
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