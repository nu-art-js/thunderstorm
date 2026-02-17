import {
	tsValidateIpAddress,
	tsValidateOptionalId,
	tsValidateUniqueId,
	tsValidateValue
} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DBProto_LoginAttempt, LoginStatus_Failed, LoginStatus_Success} from './types.js';

const Validator_ModifiableProps: DBProto_LoginAttempt['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	status: tsValidateValue([LoginStatus_Success, LoginStatus_Failed]),
	metadata: {
		ipAddress: tsValidateIpAddress(false),
		deviceId: tsValidateOptionalId
	}
};

const Validator_GeneratedProps: DBProto_LoginAttempt['generatedPropsValidator'] = {};

export const DBDef_LoginAttempt: Database<DBProto_LoginAttempt> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'login-attempt',
	entityName: 'login-attempt',
	uniqueKeys: ['_id'],
	frontend: {
		group: 'ts-default',
		name: 'login-attempt'
	},
	backend: {
		name: 'user-account--login-attempt'
	}
};