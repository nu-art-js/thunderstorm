import {convertUpperCamelCase, DBDef_V3, tsValidateBoolean, tsValidateMustExist, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {DBProto_PushMessagesHistory} from './types';
import {PushPubSubDBGroup} from '../shared';


const Validator_ModifiableProps: DBProto_PushMessagesHistory['modifiablePropsValidator'] = {
	//
};

const Validator_GeneratedProps: DBProto_PushMessagesHistory['generatedPropsValidator'] = {
	pushSessionId: tsValidateString(),
	token: tsValidateString(),
	message: tsValidateMustExist,
	read: tsValidateBoolean(),
	originatingAccountId: tsValidateUniqueId,
};

export const DBDef_PushMessagesHistory: DBDef_V3<DBProto_PushMessagesHistory> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbName: 'push-messages-history',
	dbGroup: PushPubSubDBGroup,
	entityName: convertUpperCamelCase('PushMessagesHistory', '-').toLowerCase(),
};