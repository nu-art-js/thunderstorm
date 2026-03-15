import {Database} from '@nu-art/db-api-shared';
import {convertUpperCamelCase, tsValidateBoolean, tsValidateMustExist, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {DatabaseDef_PushMessagesHistory} from './types.js';
import {PushPubSubDBGroup} from '../shared.js';

const Validator_ModifiableProps: DatabaseDef_PushMessagesHistory['modifiablePropsValidator'] = {};

const Validator_GeneratedProps: DatabaseDef_PushMessagesHistory['generatedPropsValidator'] = {
	pushSessionId: tsValidateString(),
	token: tsValidateString(),
	message: tsValidateMustExist,
	read: tsValidateBoolean(),
	originatingAccountId: tsValidateUniqueId,
};

export const DBDef_PushMessagesHistory: Database<DatabaseDef_PushMessagesHistory> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: ['pushSessionId', 'token', 'message', 'read', 'originatingAccountId'],
	versions: ['1.0.0'],
	dbKey: 'push-messages-history',
	entityName: convertUpperCamelCase('PushMessagesHistory', '-').toLowerCase(),
	frontend: {
		group: PushPubSubDBGroup,
		name: 'message-history',
	},
	backend: {
		name: 'push-messages-history'
	}
};