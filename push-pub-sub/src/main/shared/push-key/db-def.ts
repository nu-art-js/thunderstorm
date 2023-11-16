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
import {DBProto_PushKeys} from './types';


const Validator_ModifiableProps: DBProto_PushKeys['modifiablePropsValidator'] = {
	pushSessionId: tsValidateString(),
	props: tsValidateDynamicObject((value?: number | string) => {
			if (typeof value === 'string')
				return tsValidateResult(value, tsValidateString());

			if (typeof value === 'number')
				return tsValidateResult(value, tsValidateNumber());

			if (exists(value))
				return `expected type number | string but received ${typeof value}`;

			return tsValidateResult(value, tsValidateMustExist);
		}, tsValidateString()
	),
	pushKey: tsValidateString(200)
};

const Validator_GeneratedProps: DBProto_PushKeys['generatedPropsValidator'] = {
//
};

export const DBDef_PushKeys: DBDef_V3<DBProto_PushKeys> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbName: convertUpperCamelCase('PushKeys', '-').toLowerCase(),
	entityName: convertUpperCamelCase('PushKeys', '-').toLowerCase(),
};