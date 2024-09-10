import {DBDef_V3, tsValidateNumber, tsValidateUniqueId} from '@nu-art/ts-common';
import {DBProto_LoginAttempt} from './types';
import {accountGroupName} from '../../session/shared';


const Validator_ModifiableProps: DBProto_LoginAttempt['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	count: tsValidateNumber()
};

const Validator_GeneratedProps: DBProto_LoginAttempt['generatedPropsValidator'] = {};

export const DBDef_LoginAttempt: DBDef_V3<DBProto_LoginAttempt> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'login-attempt',
	entityName: 'login-attempt',
	frontend: {
		group: accountGroupName,
		name: 'login-attempt'
	},
	backend: {
		name: 'user-account--login-attempt'
	}
};