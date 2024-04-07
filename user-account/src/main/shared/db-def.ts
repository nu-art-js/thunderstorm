import {DBDef_V3} from '@nu-art/ts-common/db/types';
import {tsValidateUniqueId} from '@nu-art/ts-common/validator/validators';
import {tsValidateArray, tsValidateBoolean, tsValidateString, tsValidateTimestamp} from '@nu-art/ts-common/validator/type-validators';
import {DBProto_Session} from './types';
import {accountGroupName} from '../_entity/account/shared/consts';


export const Validator_Modifiable: DBProto_Session['modifiablePropsValidator'] = {
	label: tsValidateString(100, false),
	accountId: tsValidateUniqueId,
	deviceId: tsValidateUniqueId,
	prevSession: tsValidateArray(tsValidateString(), false),
	sessionId: tsValidateString(),
	timestamp: tsValidateTimestamp(),
	needToRefresh: tsValidateBoolean(false)
};

export const Validator_Generated: DBProto_Session['generatedPropsValidator'] = {};

export const DBDef_Session: DBDef_V3<DBProto_Session> = {
	modifiablePropsValidator: Validator_Modifiable,
	generatedPropsValidator: Validator_Generated,
	dbKey: 'user-account--sessions',
	entityName: 'Session',
	uniqueKeys: ['accountId', 'deviceId'],
	versions: ['1.0.0'],
	frontend: {
		group: accountGroupName,
		name: 'session',
	},
	backend: {
		name: 'user-account--sessions'
	}
};

