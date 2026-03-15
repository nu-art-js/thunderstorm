import {Database} from '@nu-art/db-api-shared';
import {convertUpperCamelCase, tsValidateString, tsValidateTimestamp, tsValidateUniqueId} from '@nu-art/ts-common';
import {DatabaseDef_PushSession} from './types.js';
import {PushPubSubDBGroup} from '../shared.js';

const Validator_ModifiableProps: DatabaseDef_PushSession['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	pushSessionId: tsValidateString(),
	firebaseToken: tsValidateString(),
	timestamp: tsValidateTimestamp()
};

const Validator_GeneratedProps: DatabaseDef_PushSession['generatedPropsValidator'] = {};

export const DBDef_PushSession: Database<DatabaseDef_PushSession> = {
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
