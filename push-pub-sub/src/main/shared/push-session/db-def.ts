import {
	convertUpperCamelCase,
	DBDef_V3,
	tsValidateString,
	tsValidateTimestamp,
	tsValidateUniqueId
} from '@nu-art/ts-common';
import {DBProto_PushSession} from './types';


const Validator_ModifiableProps: DBProto_PushSession['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	pushSessionId: tsValidateString(),
	firebaseToken: tsValidateString(),
	timestamp: tsValidateTimestamp()
};

const Validator_GeneratedProps: DBProto_PushSession['generatedPropsValidator'] = {
// 
};

export const DBDef_PushSession: DBDef_V3<DBProto_PushSession> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	uniqueKeys: ['pushSessionId'],
	dbName: 'push-session',
	entityName: convertUpperCamelCase('PushSession', '-').toLowerCase(),
};
