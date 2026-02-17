import {tsValidateArray, tsValidateOptionalId, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {accountGroupName} from './consts.js';
import {DBProto_Session} from './types.js';

export const Validator_Modifiable: DBProto_Session['modifiablePropsValidator'] = {
	label: tsValidateString(100, false),
	accountId: tsValidateUniqueId,
	deviceId: tsValidateUniqueId,
	linkedSessionId: tsValidateOptionalId,
	validSessionJwtMd5s: tsValidateArray(tsValidateUniqueId),
	sessionIdJwt: tsValidateString(),
};

export const Validator_Generated: DBProto_Session['generatedPropsValidator'] = {};

export const DBDef_Session: Database<DBProto_Session> = {
	modifiablePropsValidator: Validator_Modifiable,
	generatedPropsValidator: Validator_Generated,
	dbKey: 'user-account--sessions',
	entityName: 'Session',
	versions: ['1.0.0'],
	uniqueKeys: ['_id', 'accountId', 'deviceId'],
	frontend: {
		group: accountGroupName,
		name: 'session',
	},
	backend: {
		name: 'user-account--sessions',
	}
};

