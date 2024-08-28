import {DBDef_V3, tsValidateArray, tsValidateString, tsValidateStringAndNumbersWithDashes} from '@thunder-storm/common';
import {DBProto_PermissionUser} from './types';
import {PermissionDBGroup} from '../../shared';


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
	dbKey: 'permissions--user',
	entityName: 'PermissionUser',
	frontend: {
		group: PermissionDBGroup,
		name: 'user',
	},
	backend: {
		name: 'permissions--user'
	},
	dependencies: {
		'__groupIds': {
			fieldType: 'string[]',
			dbKey: 'permissions--group',
		}
	}
};