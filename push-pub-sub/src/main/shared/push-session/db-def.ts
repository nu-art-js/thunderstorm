import {convertUpperCamelCase, DBDef_V3, tsValidateString, tsValidateTimestamp, tsValidateUniqueId} from '@thunder-storm/common';
import {DBProto_PushSession} from './types';
import {PushPubSubDBGroup} from '../shared';

const Validator_ModifiableProps: DBProto_PushSession['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	pushSessionId: tsValidateString(),
	firebaseToken: tsValidateString(),
	timestamp: tsValidateTimestamp()
};

const Validator_GeneratedProps: DBProto_PushSession['generatedPropsValidator'] = {};

export const DBDef_PushSession: DBDef_V3<DBProto_PushSession> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	uniqueKeys: ['pushSessionId'],
	dbKey: 'push-session',
	entityName: convertUpperCamelCase('PushSession', '-').toLowerCase(),
	frontend: {
		group: PushPubSubDBGroup,
		name: 'session',
	},
	backend: {
		name: 'push-session'
	}
};
