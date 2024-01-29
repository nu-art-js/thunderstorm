import {
	convertUpperCamelCase,
	DBDef_V3,
	exists,
	tsValidateDynamicObject,
	tsValidateMustExist,
	tsValidateNumber,
	tsValidateResult,
	tsValidateString
} from '@nu-art/ts-common';
import {DBProto_PushSubscription} from './types';


const Validator_FilterKey = (value?: number | string) => {
	if (typeof value === 'string')
		return tsValidateResult(value, tsValidateString());

	if (typeof value === 'number')
		return tsValidateResult(value, tsValidateNumber());

	if (exists(value))
		return `expected type number | string but received ${typeof value}`;

	return tsValidateResult<string>(value, tsValidateMustExist);
};

const Validator_ModifiableProps: DBProto_PushSubscription['modifiablePropsValidator'] = {
	pushSessionId: tsValidateString(),
	filter: tsValidateDynamicObject(Validator_FilterKey, tsValidateString(), false),
	topic: tsValidateString(200)
};

const Validator_GeneratedProps: DBProto_PushSubscription['generatedPropsValidator'] = {
//
};

export const DBDef_PushSubscription: DBDef_V3<DBProto_PushSubscription> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbName: convertUpperCamelCase('PushSubscription', '-').toLowerCase(),
	entityName: convertUpperCamelCase('PushSubscription', '-').toLowerCase(),
};