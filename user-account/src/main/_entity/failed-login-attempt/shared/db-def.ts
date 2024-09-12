import {DBDef_V3, tsValidateNumber, tsValidateUniqueId} from '@nu-art/ts-common';
import {DBProto_FailedLoginAttempt} from './types';
import {accountGroupName} from '../../session/shared';


const Validator_ModifiableProps: DBProto_FailedLoginAttempt['modifiablePropsValidator'] = {
	count: tsValidateNumber(),
	accountId: tsValidateUniqueId,
	loginSuccessfulAt: tsValidateNumber(false)
};

const Validator_GeneratedProps: DBProto_FailedLoginAttempt['generatedPropsValidator'] = {};

export const DBDef_FailedLoginAttempt: DBDef_V3<DBProto_FailedLoginAttempt> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'failed-login-attempt',
	entityName: 'failed-login-attempt',
	frontend: {
		group: accountGroupName,
		name: 'failed-login-attempt'
	},
	backend: {
		name: 'user-account--failed-login-attempt'
	}
};