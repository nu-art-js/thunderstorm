import {convertUpperCamelCase, DBDef_V3, tsValidateString, tsValidateTimestamp, tsValidateUniqueId} from '@nu-art/ts-common';
import {DBProto_PushRegistration} from './types';


const Validator_ModifiableProps: DBProto_PushRegistration['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	pushSessionId: tsValidateString(),
	firebaseToken: tsValidateString(),
	timestamp: tsValidateTimestamp()
};

const Validator_GeneratedProps: DBProto_PushRegistration['generatedPropsValidator'] = {
// 
};

export const DBDef_PushRegistration: DBDef_V3<DBProto_PushRegistration> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbName: convertUpperCamelCase('PushRegistration', '-').toLowerCase(),
	entityName: convertUpperCamelCase('PushRegistration', '-').toLowerCase(),
};
