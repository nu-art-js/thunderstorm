import {tsValidateArray, tsValidateString, tsValidateStringAndNumbersWithDashes} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionUser, PermissionUser_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';

const Validator_ModifiableProps: DatabaseDef_PermissionUser['modifiablePropsValidator'] = {
	groups: tsValidateArray({
		groupId: tsValidateStringAndNumbersWithDashes,
	}, false),
};

const Validator_GeneratedProps: DatabaseDef_PermissionUser['generatedPropsValidator'] = {
	__groupIds: tsValidateArray(tsValidateStringAndNumbersWithDashes, false),
	_auditorId: tsValidateString()
};

export const DBDef_PermissionUser: Database<DatabaseDef_PermissionUser> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: PermissionUser_DbKey,
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
