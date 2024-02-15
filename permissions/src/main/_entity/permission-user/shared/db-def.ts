import {DBDef_V3, tsValidateArray, tsValidateString, tsValidateStringAndNumbersWithDashes} from '@nu-art/ts-common';
import {DBProto_PermissionUser} from './types';


const Validator_ModifiableProps: DBProto_PermissionUser['modifiablePropsValidator'] = {
	groups: tsValidateArray({
		groupId: tsValidateStringAndNumbersWithDashes,
	}, false),
};

const Validator_GeneratedProps: DBProto_PermissionUser['generatedPropsValidator'] = {
	__groupIds: tsValidateArray(tsValidateStringAndNumbersWithDashes, false),
	_auditorId: tsValidateString()
};

export const DBDef_PermissionUser: DBDef_V3<DBProto_PermissionUser> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbName: 'permissions--user',
	entityName: 'PermissionUser',
};