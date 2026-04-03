import {tsValidateArray, tsValidateString, tsValidateStringAndNumbersWithDashes, tsValidateUniqueId} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_PermissionUser, PermissionUser_DbKey} from './types.js';
import {PermissionDBGroup} from '../../consts.js';

const Validator_ModifiableProps: DatabaseDef_PermissionUser['modifiablePropsValidator'] = {
	roles: tsValidateArray({
		roleId: tsValidateStringAndNumbersWithDashes,
		context: tsValidateArray({
			dbKey: tsValidateString(),
			id: tsValidateUniqueId,
		}, false),
	}, false),
};

const Validator_GeneratedProps: DatabaseDef_PermissionUser['generatedPropsValidator'] = {
	__roleIds: tsValidateArray(tsValidateStringAndNumbersWithDashes, false),
};

export const DBDef_PermissionUser: Database<DatabaseDef_PermissionUser> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: ['__roleIds'],
	versions: ['1.0.0'],
	dbKey: PermissionUser_DbKey,
	entityName: 'PermissionUser',
	frontend: {
		group: PermissionDBGroup,
		name: 'user',
	},
	backend: {
		name: `${PermissionDBGroup}--users`
	},
	dependencies: {
		__roleIds: {
			fieldType: 'string[]',
			dbKey: 'permissions--role',
		}
	}
};
