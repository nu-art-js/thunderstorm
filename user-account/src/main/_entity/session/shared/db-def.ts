import {
	DBDef_V3,
	tsValidateArray,
	tsValidateBoolean,
	tsValidateString,
	tsValidateTimestamp,
	tsValidateUniqueId
} from '@nu-art/ts-common';
import {accountGroupName} from './consts';
import {DBProto_Session} from './types';

export const Validator_Modifiable: DBProto_Session['modifiablePropsValidator'] = {
	label: tsValidateString(100, false),
	accountId: tsValidateUniqueId,
	deviceId: tsValidateUniqueId,
	prevSession: tsValidateArray(tsValidateString(), false), //array of MD5s of previous sessions.
	sessionId: tsValidateString(),
	sessionIdJwt: tsValidateString(),
	timestamp: tsValidateTimestamp(),
	needToRefresh: tsValidateBoolean(false),
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

