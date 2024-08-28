import {
	convertUpperCamelCase,
	DBDef_V3,
	exists,
	tsValidateDynamicObject,
	tsValidateMustExist,
	tsValidateNumber,
	tsValidateResult,
	tsValidateString
} from '@thunder-storm/common';
import {DBProto_PushSubscription} from './types';
import {PushPubSubDBGroup} from '../shared';


const Validator_FilterKey = (value?: number | string) => {
	if (typeof value === 'string')
		return tsValidateResult(value, tsValidateString());

	if (typeof value === 'number')
		return tsValidateResult(value, tsValidateNumber());

	if (exists(value))
		return `expected type number | string but received ${typeof value}`;

	return tsValidateResult<string | number>(value, tsValidateMustExist);
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
	dbKey: 'push-subscription',
	entityName: convertUpperCamelCase('PushSubscription', '-').toLowerCase(),
	frontend: {
		group: PushPubSubDBGroup,
		name: 'subscription',
	},
	backend: {
		name: 'push-subscription'
	}
};